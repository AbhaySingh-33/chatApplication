import { getChatModel } from "../llm.js";

export const generateQueryVariants = async (question) => {
  const llm = getChatModel({ temperature: 0.1 });
  const prompt = [
    "Generate up to 3 short alternate search queries for the user question.",
    "Rules:",
    "- Keep each query under 14 words",
    "- Keep core meaning unchanged",
    "- Return one query per line with no numbering",
    "Question:",
    question,
  ].join("\n");

  try {
    const response = await llm.invoke(prompt);
    const content = String(response?.content || "");
    const variants = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);

    return [...new Set([question, ...variants])].slice(0, 4);
  } catch {
    return [question];
  }
};
