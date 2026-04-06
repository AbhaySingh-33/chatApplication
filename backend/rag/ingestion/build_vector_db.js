import { randomUUID } from "crypto";
import { getPineconeStore } from "../pinecone.js";
import { getUserNamespace } from "../config.js";
import { chunkDocuments } from "./chunker.js";
import { addClassificationMetadata } from "./classifier.js";

export const ingestDocumentsToVectorDb = async ({ userId, documents }) => {
  if (!documents?.length) {
    return { added: 0 };
  }

  const namespace = getUserNamespace(userId);
  const vectorStore = await getPineconeStore(namespace);

  const chunks = await chunkDocuments(documents);
  const enrichedChunks = addClassificationMetadata(chunks).map((doc) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      chunkId: randomUUID(),
      userId: String(userId),
      ingestedAt: new Date().toISOString(),
    },
  }));

  await vectorStore.addDocuments(enrichedChunks);

  return {
    added: enrichedChunks.length,
    namespace,
  };
};
