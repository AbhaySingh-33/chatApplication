import { retrieveContext } from "./retriever.js";
import { generateQueryVariants } from "./multi_query.js";
import { RAG_CONFIG } from "../config.js";

const rrfScore = (rank, k = 60) => 1 / (k + rank);

export const retrieveWithRRF = async ({ userId, query, perQueryK = 4 }) => {
  const variants = await generateQueryVariants(query);
  const rankings = await Promise.all(
    variants.map(async (variant) => {
      const docs = await retrieveContext({ userId, query: variant, k: perQueryK });
      return docs;
    })
  );

  const scoreMap = new Map();
  for (const docs of rankings) {
    docs.forEach((doc, index) => {
      const key =
        doc?.metadata?.chunkId ||
        `${doc?.metadata?.source || "src"}:${index}:${doc.pageContent?.slice(0, 40)}`;
      const current = scoreMap.get(key) || { score: 0, doc };
      current.score += rrfScore(index + 1);
      scoreMap.set(key, current);
    });
  }

  return [...scoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, RAG_CONFIG.defaultTopK)
    .map((item) => item.doc);
};
