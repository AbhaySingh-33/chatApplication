import { search } from "duck-duck-scrape";
import { getChatModel } from "./llm.js";
import { hasRagEnv, RAG_CONFIG } from "./config.js";
import { retrieveWithRRF } from "./retrieval/advanced_retriever.js";
import { retrieveContext } from "./retrieval/retriever.js";
import { routeQuery } from "./routing/router.js";
import { isStrongDocQuery } from "./routing/router.js";
import { decomposeQuery } from "./agents/query_decomposer.js";

const RAG_DEBUG = String(process.env.AI_DEBUG || "").toLowerCase() === "true";

const buildStrongDocFallbackQueries = (question = "") => {
  const base = String(question || "").trim();
  return [
    base,
    "overview of document",
    "summary of document",
    "problem statement",
    "question statement",
    "exercise question",
    "key topics and sections",
  ].filter(Boolean);
};

const fallbackRetrieveForStrongDocQuery = async ({
  userId,
  question,
  metadataFilter = null,
}) => {
  const fallbackQueries = buildStrongDocFallbackQueries(question);
  const rankings = await Promise.all(
    fallbackQueries.map((query) =>
      retrieveContext({
        userId,
        query,
        k: 8,
        metadataFilter,
      })
    )
  );

  const merged = [];
  const seen = new Set();
  for (const docs of rankings) {
    for (const doc of docs) {
      const key =
        doc?.metadata?.chunkId ||
        `${doc?.metadata?.source || "src"}:${doc?.pageContent?.slice(0, 40)}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(doc);
      if (merged.length >= 12) return merged;
    }
  }

  return merged;
};

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
  const normalizedLimit = Math.max(1, Number(maxResults) || 5);

  const searchPayload = await search(String(query || ""));
  const rawResults = Array.isArray(searchPayload?.results)
    ? searchPayload.results
    : Array.isArray(searchPayload)
      ? searchPayload
      : [];

  return rawResults
    .slice(0, normalizedLimit)
    .map((item) => ({
      title: String(item?.title || "").trim(),
      url: String(item?.url || item?.href || "").trim(),
      snippet: String(item?.description || item?.body || "").trim(),
    }))
    .filter((item) => item.title && item.url);
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
  routeHint = "",
  preferredSourceId = "",
}) => {
  if (!process.env.MISTRAL_API_KEY) {
    return {
      mode: "disabled",
      answer: null,
      sources: [],
    };
  }

  const canUseVector = allowVector && hasRagEnv();
  const sourceFilter = preferredSourceId
    ? { sourceId: { "$eq": String(preferredSourceId) } }
    : null;

  const merged = [];
  const strongDocRequest = isStrongDocQuery(question);

  const mergeUniqueDocs = (docs = [], cap = 8) => {
    const seen = new Set(
      merged.map(
        (doc) => doc?.metadata?.chunkId || `${doc?.metadata?.source}:${doc?.pageContent?.slice(0, 30)}`
      )
    );
    for (const doc of docs) {
      const key = doc?.metadata?.chunkId || `${doc?.metadata?.source}:${doc?.pageContent?.slice(0, 30)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(doc);
      if (merged.length >= cap) break;
    }
  };

  if (canUseVector) {
    const subQueries = await decomposeQuery(question);
    const retrievals = await Promise.all(
      subQueries.map((q) =>
        retrieveWithRRF({
          userId,
          query: q,
          metadataFilter: strongDocRequest ? sourceFilter : null,
        })
      )
    );

    for (const docs of retrievals) {
      mergeUniqueDocs(docs, 8);
      if (merged.length >= 8) break;
    }

    // If source-targeted retrieval found nothing, retry once without source filter.
    if (strongDocRequest && sourceFilter && merged.length === 0) {
      const globalRetrievals = await Promise.all(
        subQueries.map((q) => retrieveWithRRF({ userId, query: q }))
      );
      for (const docs of globalRetrievals) {
        mergeUniqueDocs(docs, 8);
        if (merged.length >= 8) break;
      }
    }
  }

  if (RAG_DEBUG && strongDocRequest) {
    console.log("[RAG_RETRIEVAL]", {
      userId: String(userId),
      preferredSourceId: preferredSourceId || null,
      usedSourceFilter: Boolean(sourceFilter),
      mergedChunks: merged.length,
      topSources: merged
        .slice(0, 5)
        .map((doc) => doc?.metadata?.source || doc?.metadata?.url || "unknown"),
    });
  }

  const normalizedRouteHint = String(routeHint || "").trim().toLowerCase();
  const mode = ["vector", "web", "hybrid"].includes(normalizedRouteHint)
    ? normalizedRouteHint
    : await routeQuery({
        query: question,
        hasVectorContext: merged.length > 0,
        hasIngestedDocs: allowVector,
      });

  if (allowVector && strongDocRequest && merged.length === 0) {
    try {
      const fallbackDocs = await fallbackRetrieveForStrongDocQuery({
        userId,
        question,
        metadataFilter: sourceFilter,
      });
      mergeUniqueDocs(fallbackDocs, 12);

      if (sourceFilter && merged.length === 0) {
        const globalFallbackDocs = await fallbackRetrieveForStrongDocQuery({
          userId,
          question,
        });
        mergeUniqueDocs(globalFallbackDocs, 12);
      }
    } catch (error) {
      console.error("Strong-doc fallback retrieval failed:", error.message);
    }
  }

  if (allowVector && strongDocRequest && merged.length === 0) {
    if (RAG_DEBUG) {
      console.log("[RAG_NO_MATCH]", {
        userId: String(userId),
        preferredSourceId: preferredSourceId || null,
        question: String(question || "").slice(0, 160),
      });
    }
    return {
      mode: "vector",
      answer:
        "I could not find relevant passages in your uploaded documents for that query. Please try rephrasing with specific keywords from the PDF, or re-ingest the file if it was recently uploaded.",
      sources: [],
    };
  }

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
