export const RAG_CONFIG = {
  pineconeIndex: process.env.PINECONE_INDEX || "chatapp-rag",
  pineconeNamespacePrefix: process.env.PINECONE_NAMESPACE_PREFIX || "user",
  defaultTopK: Number(process.env.RAG_TOP_K || 4),
  maxContextChars: Number(process.env.RAG_MAX_CONTEXT_CHARS || 7000),
  chunkSize: Number(process.env.RAG_CHUNK_SIZE || 900),
  chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP || 120),
  webSearchResults: Number(process.env.RAG_WEB_SEARCH_RESULTS || 3),
  crawlMaxPages: Number(process.env.RAG_CRAWL_MAX_PAGES || 8),
  crawlRequestTimeoutMs: Number(process.env.RAG_CRAWL_TIMEOUT_MS || 8000),
};

export const getUserNamespace = (userId) =>
  `${RAG_CONFIG.pineconeNamespacePrefix}-${String(userId)}`;

const isUrlLike = (value = "") => /^https?:\/\//i.test(String(value).trim());

export const getVectorStoreConfigIssues = () => {
  const issues = [];
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const pineconeIndex = process.env.PINECONE_INDEX;

  if (!pineconeApiKey) {
    issues.push("PINECONE_API_KEY is missing.");
  } else if (isUrlLike(pineconeApiKey)) {
    issues.push("PINECONE_API_KEY looks like a URL. Use the actual Pinecone API key from the Pinecone console.");
  }

  if (!pineconeIndex) {
    issues.push("PINECONE_INDEX is missing.");
  }

  return issues;
};

export const hasVectorStoreEnv = () => getVectorStoreConfigIssues().length === 0;

export const getRagConfigIssues = () => {
  const issues = [...getVectorStoreConfigIssues()];
  if (!process.env.MISTRAL_API_KEY) {
    issues.push("MISTRAL_API_KEY is missing.");
  }
  return issues;
};

export const hasRagEnv = () =>
  getRagConfigIssues().length === 0;
