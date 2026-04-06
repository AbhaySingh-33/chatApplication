import { getChatModel } from "../llm.js";

export const shouldDecomposeQuery = (query) => {
  const conjunctionCount = (query.match(/\b(and|then|also|plus|vs|compare)\b/gi) || []).length;
  return query.length > 140 || conjunctionCount >= 2;
};

export const decomposeQuery = async (query) => {
  if (!shouldDecomposeQuery(query)) {
    return [query];
  }

  const llm = getChatModel({ temperature: 0 });
  const prompt = [
    "Break this question into up to 3 independent sub-questions for retrieval.",
    "Return one sub-question per line, no numbering, no extra text.",
    "Question:",
    query,
  ].join("\n");

  try {
    const response = await llm.invoke(prompt);
    const lines = String(response?.content || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);

    return lines.length ? lines : [query];
  } catch {
    return [query];
  }
};
