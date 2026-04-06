import axios from "axios";
import * as cheerio from "cheerio";
import { getChatModel } from "./llm.js";
import { hasRagEnv, RAG_CONFIG } from "./config.js";
import { retrieveWithRRF } from "./retrieval/advanced_retriever.js";
import { routeQuery } from "./routing/router.js";
import { decomposeQuery } from "./agents/query_decomposer.js";

const renderDocsAsContext = (docs) => {
  const parts = [];
  let size = 0;

  for (const [index, doc] of docs.entries()) {
    const source = doc?.metadata?.source || doc?.metadata?.url || "unknown";
    const snippet = (doc?.pageContent || "").slice(0, 1400);
    const block = `[${index + 1}] (${source})\n${snippet}\n`;

    if (size + block.length > RAG_CONFIG.maxContextChars) {
      break;
    }

    size += block.length;
    parts.push(block);
  }

  return parts.join("\n");
};

const answerFromVectorContext = async ({ question, docs, conversationContext = "", userMemory = "" }) => {
  const llm = getChatModel({ temperature: 0.2 });
  const context = renderDocsAsContext(docs);

  const prompt = [
    "You are an AI assistant for a chat app.",
    "Use the provided context first. If context is insufficient, clearly say what is missing.",
    "Keep answers concise and actionable.",
    "Cite sources inline as [1], [2] matching context indices.",
    userMemory ? `User memory:\n${userMemory}` : "",
    conversationContext ? `Recent conversation:\n${conversationContext}` : "",
    "",
    "Context:",
    context || "No context provided.",
    "",
    `Question: ${question}`,
  ].join("\n");

  const response = await llm.invoke(prompt);
  return String(response?.content || "").trim();
};

export const fetchDuckDuckGoResults = async (query, maxResults = RAG_CONFIG.webSearchResults) => {
  const endpoints = [
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  ];

  const parseResults = (html) => {
    const $ = cheerio.load(html || "");
    const items = [];

    $(".result").each((_, el) => {
      if (items.length >= maxResults) return;

      const titleEl = $(el).find(".result__a").first();
      const snippetEl = $(el).find(".result__snippet").first();

      const title = titleEl.text().replace(/\s+/g, " ").trim();
      const rawHref = titleEl.attr("href") || "";
      const snippet = snippetEl.text().replace(/\s+/g, " ").trim();

      let url = rawHref;
      try {
        if (rawHref.startsWith("/")) {
          const asUrl = new URL(`https://duckduckgo.com${rawHref}`);
          const uddg = asUrl.searchParams.get("uddg");
          if (uddg) {
            url = decodeURIComponent(uddg);
          }
        }
      } catch {
        // Keep raw href when URL parsing fails.
      }

      if (!title || !url) return;
      items.push({ title, url, snippet });
    });

    return items;
  };

  let lastError;
  for (const endpoint of endpoints) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await axios.get(endpoint, {
          timeout: Math.max(8000, RAG_CONFIG.crawlRequestTimeoutMs),
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        const parsed = parseResults(response.data);
        if (parsed.length) {
          return parsed;
        }
      } catch (error) {
        lastError = error;
      }

      await new Promise((resolve) => setTimeout(resolve, 900 * attempt));
    }
  }

  if (lastError) throw lastError;
  return [];
};

const renderWebResultsAsContext = (results = []) =>
  results
    .map((item, index) => `[W${index + 1}] ${item.title}\n${item.url}\n${item.snippet || ""}`)
    .join("\n\n");

const answerWithWebTool = async ({
  question,
  contextDocs,
  webResults = [],
  conversationContext = "",
  userMemory = "",
}) => {
  const llm = getChatModel({ temperature: 0.2 });

  const context = renderDocsAsContext(contextDocs);
  const webContext = renderWebResultsAsContext(webResults);

  const prompt = [
    "You are a fast, reliable assistant.",
    "Use the provided web results for freshness-sensitive questions.",
    webResults.length
      ? "Web results are available. Do not claim web fetch failed. Derive the best possible up-to-date answer from [W] sources."
      : "Web results are empty, so say you could not fetch current web data right now and provide a best-effort answer.",
    "Return concise answers and cite web sources as [W1], [W2] etc.",
    userMemory ? `User memory:\n${userMemory}` : "",
    conversationContext ? `Recent conversation:\n${conversationContext}` : "",
    context ? `Local vector context:\n${context}` : "No local vector context available.",
    webContext ? `DuckDuckGo web results:\n${webContext}` : "DuckDuckGo web results unavailable.",
    `Question: ${question}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await llm.invoke(prompt);
  return {
    answer: String(response?.content || "").trim(),
    webSources: webResults.map((item) => item.url).filter(Boolean),
  };
};

export const getWebResultsWithFallback = async (question) => {
  try {
    return await fetchDuckDuckGoResults(question, RAG_CONFIG.webSearchResults);
  } catch (error) {
    console.error("DuckDuckGo fetch failed:", error.message);
    return [];
  }
};

export const answerWithRag = async ({
  userId,
  question,
  conversationContext = "",
  userMemory = "",
  allowVector = true,
}) => {
  if (!process.env.MISTRAL_API_KEY) {
    return {
      mode: "disabled",
      answer: null,
      sources: [],
    };
  }

  const canUseVector = allowVector && hasRagEnv();

  const merged = [];

  if (canUseVector) {
    const subQueries = await decomposeQuery(question);
    const retrievals = await Promise.all(
      subQueries.map((q) => retrieveWithRRF({ userId, query: q }))
    );

    const seen = new Set();
    for (const docs of retrievals) {
      for (const doc of docs) {
        const key = doc?.metadata?.chunkId || `${doc?.metadata?.source}:${doc?.pageContent?.slice(0, 30)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(doc);
        if (merged.length >= 8) break;
      }
      if (merged.length >= 8) break;
    }
  }

  const mode = routeQuery({ query: question, hasVectorContext: merged.length > 0 });

  if (mode === "vector") {
    const answer = await answerFromVectorContext({
      question,
      docs: merged,
      conversationContext,
      userMemory,
    });
    return {
      mode,
      answer,
      sources: merged.map((doc) => doc?.metadata?.source || doc?.metadata?.url).filter(Boolean),
    };
  }

  const webResults = await getWebResultsWithFallback(question);

  const webResult = await answerWithWebTool({
    question,
    contextDocs: merged,
    webResults,
    conversationContext,
    userMemory,
  });

  const webSources = webResults.map((item) => item.url).filter(Boolean);
  const combinedSources = [
    ...merged.map((doc) => doc?.metadata?.source || doc?.metadata?.url).filter(Boolean),
    ...webSources,
  ];

  return {
    mode,
    answer: webResult.answer,
    sources: [...new Set(combinedSources)],
  };
};
