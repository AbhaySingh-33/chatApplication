import fs from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ingestDocumentsToVectorDb } from "../rag/ingestion/build_vector_db.js";
import { crawlWebsite } from "../rag/ingestion/crawler.js";
import { getRagConfigIssues, getVectorStoreConfigIssues, hasRagEnv, hasVectorStoreEnv } from "../rag/config.js";
import User from "../models/user.model.js";
import { deleteVectorsBySource } from "../rag/pinecone.js";

const buildRagContextUpdate = (sources = []) => {
  const sorted = [...sources].sort(
    (a, b) => new Date(b?.ingestedAt || 0).getTime() - new Date(a?.ingestedAt || 0).getTime()
  );
  return {
    "ragContext.sources": sorted,
    "ragContext.hasIngestedDocs": sorted.length > 0,
    "ragContext.lastIngestedAt": sorted[0]?.ingestedAt || null,
  };
};

const writeTempPdf = async (buffer) => {
  const tempPath = path.join(os.tmpdir(), `chatapp-rag-${randomUUID()}.pdf`);
  await fs.writeFile(tempPath, buffer);
  return tempPath;
};

export const uploadPdfForRag = async (req, res) => {
  try {
    if (!hasVectorStoreEnv()) {
      return res.status(400).json({
        error: "Vector DB is not configured correctly.",
        details: getVectorStoreConfigIssues(),
      });
    }

    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    if (!file.mimetype?.includes("pdf")) {
      return res.status(400).json({ error: "Only PDF files are supported." });
    }

    const sourceId = randomUUID();

    const tempPath = await writeTempPdf(file.buffer);

    try {
      const loader = new PDFLoader(tempPath, {
        splitPages: true,
      });

      const docs = await loader.load();
      const docsWithMetadata = docs.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          sourceId,
          source: file.originalname,
          filename: file.originalname,
          type: "pdf",
        },
      }));

      const result = await ingestDocumentsToVectorDb({
        userId,
        documents: docsWithMetadata,
      });

      if (result.added > 0) {
        const userDoc = await User.findById(userId).select("ragContext.sources");
        const nextSources = [
          ...(userDoc?.ragContext?.sources || []).filter((item) => item?.sourceId !== sourceId),
          {
            sourceId,
            type: "pdf",
            name: file.originalname,
            chunksAdded: result.added,
            namespace: result.namespace || "",
            ingestedAt: new Date(),
          },
        ];

        await User.updateOne(
          { _id: userId },
          {
            $set: buildRagContextUpdate(nextSources),
          }
        );
      }

      return res.status(201).json({
        message: "PDF ingested successfully",
        chunksAdded: result.added,
        namespace: result.namespace,
        source: {
          sourceId,
          type: "pdf",
          name: file.originalname,
        },
      });
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
  } catch (error) {
    console.error("uploadPdfForRag error:", error.message);
    const message = String(error?.message || "");
    const isPineconeAuthError = message.includes("API key you provided was rejected");
    const isPineconeConfigError = message.toLowerCase().includes("pinecone configuration error");
    if (isPineconeAuthError || isPineconeConfigError) {
      return res.status(400).json({
        error: "Pinecone authentication/configuration failed.",
        details: [
          ...getVectorStoreConfigIssues(),
          "Verify PINECONE_API_KEY is the API key (not index URL/host) and that it belongs to the project containing PINECONE_INDEX.",
        ],
      });
    }

    return res.status(500).json({
      error: "Failed to ingest PDF.",
      details: [message || "Unknown ingestion error."],
    });
  }
};

export const crawlForRag = async (req, res) => {
  try {
    if (!hasVectorStoreEnv()) {
      return res.status(400).json({
        error: "Vector DB is not configured correctly.",
        details: getVectorStoreConfigIssues(),
      });
    }

    const userId = req.user._id;
    const { url, maxPages } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const sourceId = randomUUID();

    const docs = await crawlWebsite({
      startUrl: url,
      maxPages: Number(maxPages) || undefined,
    });

    if (!docs.length) {
      return res.status(200).json({
        message: "No crawlable content found",
        chunksAdded: 0,
      });
    }

    const docsWithSource = docs.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        sourceId,
        source: doc?.metadata?.source || url,
        type: "web",
      },
    }));

    const result = await ingestDocumentsToVectorDb({
      userId,
      documents: docsWithSource,
    });

    if (result.added > 0) {
      const userDoc = await User.findById(userId).select("ragContext.sources");
      const nextSources = [
        ...(userDoc?.ragContext?.sources || []).filter((item) => item?.sourceId !== sourceId),
        {
          sourceId,
          type: "web",
          name: url,
          chunksAdded: result.added,
          namespace: result.namespace || "",
          ingestedAt: new Date(),
        },
      ];

      await User.updateOne(
        { _id: userId },
        {
          $set: buildRagContextUpdate(nextSources),
        }
      );
    }

    return res.status(201).json({
      message: "Website ingested successfully",
      pagesCaptured: docs.length,
      chunksAdded: result.added,
      namespace: result.namespace,
      source: {
        sourceId,
        type: "web",
        name: url,
      },
    });
  } catch (error) {
    console.error("crawlForRag error:", error.message);
    const message = String(error?.message || "");
    const isPineconeAuthError = message.includes("API key you provided was rejected");
    const isPineconeConfigError = message.toLowerCase().includes("pinecone configuration error");
    if (isPineconeAuthError || isPineconeConfigError) {
      return res.status(400).json({
        error: "Pinecone authentication/configuration failed.",
        details: [
          ...getVectorStoreConfigIssues(),
          "Verify PINECONE_API_KEY is the API key (not index URL/host) and that it belongs to the project containing PINECONE_INDEX.",
        ],
      });
    }

    return res.status(500).json({
      error: "Failed to crawl and ingest website.",
      details: [message || "Unknown crawl ingestion error."],
    });
  }
};

export const listRagPdfs = async (req, res) => {
  try {
    const userId = req.user._id;
    const userDoc = await User.findById(userId).select("ragContext.sources");
    const pdfs = (userDoc?.ragContext?.sources || [])
      .filter((item) => item?.type === "pdf")
      .sort((a, b) => new Date(b?.ingestedAt || 0).getTime() - new Date(a?.ingestedAt || 0).getTime())
      .map((item) => ({
        sourceId: item.sourceId,
        name: item.name,
        chunksAdded: item.chunksAdded || 0,
        namespace: item.namespace || "",
        ingestedAt: item.ingestedAt,
      }));

    return res.status(200).json({ pdfs });
  } catch (error) {
    console.error("listRagPdfs error:", error.message);
    return res.status(500).json({ error: "Failed to fetch ingested PDFs." });
  }
};

export const deleteRagPdf = async (req, res) => {
  try {
    if (!hasVectorStoreEnv()) {
      return res.status(400).json({
        error: "Vector DB is not configured correctly.",
        details: getVectorStoreConfigIssues(),
      });
    }

    const userId = req.user._id;
    const { sourceId } = req.params;

    if (!sourceId) {
      return res.status(400).json({ error: "sourceId is required" });
    }

    const userDoc = await User.findById(userId).select("ragContext.sources");
    const sources = userDoc?.ragContext?.sources || [];
    const target = sources.find((item) => item?.sourceId === sourceId && item?.type === "pdf");

    if (!target) {
      return res.status(404).json({ error: "PDF source not found." });
    }

    await deleteVectorsBySource({ userId, sourceId });

    const nextSources = sources.filter((item) => item?.sourceId !== sourceId);

    await User.updateOne(
      { _id: userId },
      {
        $set: buildRagContextUpdate(nextSources),
      }
    );

    return res.status(200).json({
      message: "PDF removed and vectors deleted.",
      sourceId,
    });
  } catch (error) {
    console.error("deleteRagPdf error:", error.message);
    return res.status(500).json({
      error: "Failed to delete PDF vectors.",
      details: [String(error?.message || "Unknown delete error")],
    });
  }
};

export const ragHealth = async (_req, res) =>
  res.status(200).json({
    vectorStoreConfigured: hasVectorStoreEnv(),
    ragConfigured: hasRagEnv(),
    vectorStoreIssues: getVectorStoreConfigIssues(),
    ragIssues: getRagConfigIssues(),
  });
