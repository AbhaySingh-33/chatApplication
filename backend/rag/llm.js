import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";

const DEFAULT_CHAT_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";
const DEFAULT_EMBED_MODEL = process.env.MISTRAL_EMBED_MODEL || "mistral-embed";

export const getChatModel = ({ temperature = 0.2 } = {}) =>
  new ChatMistralAI({
    apiKey: process.env.MISTRAL_API_KEY,
    model: DEFAULT_CHAT_MODEL,
    temperature,
    timeout: 20000,
    maxRetries: 2,
  });

export const getEmbeddingModel = () =>
  new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY,
    model: DEFAULT_EMBED_MODEL,
    maxRetries: 2,
  });
