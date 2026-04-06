import axios from "axios";
import * as cheerio from "cheerio";
import { Document } from "@langchain/core/documents";
import { RAG_CONFIG } from "../config.js";

const normalizeUrl = (url) => {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
};

const isSameHost = (baseUrl, candidateUrl) => {
  try {
    return new URL(baseUrl).host === new URL(candidateUrl).host;
  } catch {
    return false;
  }
};

const extractTextFromHtml = (html) => {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe").remove();
  const title = $("title").first().text().trim();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return { title, text };
};

const fetchPage = async (url) => {
  const response = await axios.get(url, {
    timeout: RAG_CONFIG.crawlRequestTimeoutMs,
    headers: {
      "User-Agent": "ChatApp-RAG-Crawler/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  const html = response.data;
  const $ = cheerio.load(html);
  const links = new Set();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const absolute = new URL(href, url).toString();
      links.add(absolute);
    } catch {
      // Skip invalid links
    }
  });

  return {
    html,
    links: [...links],
  };
};

export const crawlWebsite = async ({ startUrl, maxPages = RAG_CONFIG.crawlMaxPages }) => {
  const normalizedStart = normalizeUrl(startUrl);
  if (!normalizedStart) {
    throw new Error("Invalid URL for crawling");
  }

  const queue = [normalizedStart];
  const visited = new Set();
  const docs = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    try {
      const { html, links } = await fetchPage(current);
      const { title, text } = extractTextFromHtml(html);

      if (text.length >= 120) {
        docs.push(
          new Document({
            pageContent: text,
            metadata: {
              source: current,
              url: current,
              title,
              type: "web",
            },
          })
        );
      }

      for (const link of links) {
        const normalizedLink = normalizeUrl(link);
        if (!normalizedLink || visited.has(normalizedLink)) continue;
        if (!isSameHost(normalizedStart, normalizedLink)) continue;
        if (queue.length + visited.size >= maxPages * 2) continue;
        queue.push(normalizedLink);
      }
    } catch (error) {
      console.warn(`Crawler skipped ${current}:`, error.message);
    }
  }

  return docs;
};
