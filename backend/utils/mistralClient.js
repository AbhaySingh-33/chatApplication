import axios from "axios";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const DEFAULT_MISTRAL_MODEL = "mistral-small-latest";

const normalizeContent = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text") return item.text || "";
        return "";
      })
      .join("\n");
  }
  return "";
};

export const hasMistralApiKey = () => Boolean(process.env.MISTRAL_API_KEY);

export const getMistralModel = () =>
  process.env.MISTRAL_MODEL || DEFAULT_MISTRAL_MODEL;

export const chatWithMistral = async ({
  prompt,
  systemPrompt,
  jsonMode = false,
  temperature = 0.2,
}) => {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is missing");
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const payload = {
    model: getMistralModel(),
    messages,
    temperature,
  };

  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const response = await axios.post(MISTRAL_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });

  const content = response?.data?.choices?.[0]?.message?.content;
  return normalizeContent(content).trim();
};