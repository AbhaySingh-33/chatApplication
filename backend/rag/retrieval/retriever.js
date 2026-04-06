import { getPineconeStore } from "../pinecone.js";
import { getUserNamespace, RAG_CONFIG } from "../config.js";

export const getBasicRetriever = async ({ userId, k = RAG_CONFIG.defaultTopK }) => {
  const namespace = getUserNamespace(userId);
  const vectorStore = await getPineconeStore(namespace);
  return vectorStore.asRetriever({
    k,
    searchType: "mmr",
    searchKwargs: {
      fetchK: Math.max(8, k * 2),
      lambda: 0.65,
    },
  });
};

export const retrieveContext = async ({ userId, query, k = RAG_CONFIG.defaultTopK }) => {
  const retriever = await getBasicRetriever({ userId, k });
  return retriever.invoke(query);
};
