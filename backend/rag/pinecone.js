import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getEmbeddingModel } from "./llm.js";
import { getUserNamespace, getVectorStoreConfigIssues, RAG_CONFIG } from "./config.js";

let pineconeClient;
const storeCache = new Map();

const getPineconeClient = () => {
  if (!pineconeClient) {
    const configIssues = getVectorStoreConfigIssues();
    if (configIssues.length) {
      throw new Error(`Pinecone configuration error: ${configIssues.join(" ")}`);
    }
    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pineconeClient;
};

export const getPineconeStore = async (namespace) => {
  const cacheKey = `${RAG_CONFIG.pineconeIndex}:${namespace}`;
  if (storeCache.has(cacheKey)) {
    return storeCache.get(cacheKey);
  }

  const client = getPineconeClient();
  const pineconeIndex = client.index(RAG_CONFIG.pineconeIndex);

  const store = await PineconeStore.fromExistingIndex(getEmbeddingModel(), {
    pineconeIndex,
    namespace,
    maxConcurrency: 5,
  });

  storeCache.set(cacheKey, store);
  return store;
};

export const deleteVectorsBySource = async ({ userId, sourceId }) => {
  const client = getPineconeClient();
  const namespace = getUserNamespace(userId);
  const namespacedIndex = client.index(RAG_CONFIG.pineconeIndex).namespace(namespace);

  await namespacedIndex.deleteMany({
    userId: { "$eq": String(userId) },
    sourceId: { "$eq": String(sourceId) },
  });
};
