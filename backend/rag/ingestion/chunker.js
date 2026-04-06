import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { RAG_CONFIG } from "../config.js";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: RAG_CONFIG.chunkSize,
  chunkOverlap: RAG_CONFIG.chunkOverlap,
  separators: ["\n\n", "\n", ". ", " ", ""],
});

export const chunkDocuments = async (documents) => splitter.splitDocuments(documents);
