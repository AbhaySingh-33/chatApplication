import { getPineconeStore } from "../pinecone.js";
import { getUserNamespace, RAG_CONFIG } from "../config.js";

export const getBasicRetriever = async ({
  userId,
  k = RAG_CONFIG.defaultTopK,
  metadataFilter = null,
}) => {
  const namespace = getUserNamespace(userId);
  const vectorStore = await getPineconeStore(namespace);
  const searchKwargs = {
    fetchK: Math.max(8, k * 2),
    lambda: 0.65,
  };

  if (metadataFilter && typeof metadataFilter === "object") {
    searchKwargs.filter = metadataFilter;
  }

  return vectorStore.asRetriever({
    k,
    searchType: "mmr",
    searchKwargs,
  });
};

export const retrieveContext = async ({
  userId,
  query,
  k = RAG_CONFIG.defaultTopK,
  metadataFilter = null,
}) => {
  const retriever = await getBasicRetriever({ userId, k, metadataFilter });
  return retriever.invoke(query);
};
