import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { getChatModel } from "../llm.js";
import { hasMistralApiKey } from "../../utils/mistralClient.js";

const STRONG_DOC_HINTS = [
  /\b(this|that|my|the)\s+(pdf|doc|document|file|notes|syllabus|book|handout)\b/i,
  /\b(this|that|my|the)?\s*attached\s+(pdf|doc|document|file|notes|syllabus|book|handout)\b/i,
  /\b(from|in|using)\s+(this|that|my|the)?\s*attached\s+(pdf|doc|document|file|notes|syllabus|book|handout)\b/i,
  /\b(uploaded|ingested)\s+(pdf|doc|document|file|docs|syllabus|book|notes)\b/i,
  /\b(list|summari[sz]e|explain|extract|find|count)\b.*\b(from|in)\b.*\b(pdf|doc|document|file|notes|syllabus|book|handout)\b/i,
  /\baccording to\b.*\b(pdf|doc|document|file|notes|syllabus|book|handout)\b/i,
  /\bhow many\b.*\b(chapters?|units?|modules?)\b.*\b(this|that|my|the)?\s*(syllabus|book|notes|pdf|document)?\b/i,
];

export const isStrongDocQuery = (query = "") =>
  STRONG_DOC_HINTS.some((pattern) => pattern.test(String(query || "")));

const CASUAL_DIRECT_HINTS = [
  /^\s*(hi|hello|hey|yo|sup|hola)\b/i,
  /^\s*(thanks|thank you|thx)\b/i,
  /^\s*(ok|okay|cool|nice|great|awesome)\b/i,
  /^\s*(good\s*(morning|afternoon|evening|night))\b/i,
  /^\s*(bye|goodbye|see you|cya)\b/i,
];

const WEB_FRESHNESS_HINTS = [
  /\b(latest|today|current|currently|live|ongoing|recent|news|released?)\b/i,
  /\b(price|stock|score|standings?|weather|breaking)\b/i,
  /\bwhat happened\b/i,
];

const DEFAULT_ROUTER_TIMEOUT_MS = 800;

const RouterState = Annotation.Root({
  query: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),
  hasIngestedDocs: Annotation({
    reducer: (_, next) => Boolean(next),
    default: () => false,
  }),
  hasVectorContext: Annotation({
    reducer: (_, next) => Boolean(next),
    default: () => false,
  }),
  route: Annotation({
    reducer: (_, next) => next,
    default: () => "direct",
  }),
  reason: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),
  confidence: Annotation({
    reducer: (_, next) => Number(next || 0),
    default: () => 0,
  }),
  decidedBy: Annotation({
    reducer: (_, next) => next,
    default: () => "fallback",
  }),
});

const normalizeRoute = (value = "") => {
  const route = String(value || "").trim().toLowerCase();
  if (["direct", "vector", "web", "hybrid"].includes(route)) {
    return route;
  }
  return "direct";
};

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const responseText = (response) => {
  const content = response?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text") return item?.text || "";
        return "";
      })
      .join("\n");
  }
  return "";
};

const fastPathRouterNode = async (state) => {
  const text = String(state?.query || "").trim();
  if (!text) {
    return {
      route: "direct",
      reason: "Empty query",
      confidence: 1,
      decidedBy: "fast_path",
    };
  }

  if (isStrongDocQuery(text)) {
    if (state?.hasIngestedDocs || state?.hasVectorContext) {
      return {
        route: state?.hasVectorContext ? "vector" : "hybrid",
        reason: "Explicit uploaded-document request",
        confidence: 0.99,
        decidedBy: "fast_path",
      };
    }

    return {
      route: "direct",
      reason: "Document request but user has no ingested docs",
      confidence: 0.99,
      decidedBy: "fast_path",
    };
  }

  if (CASUAL_DIRECT_HINTS.some((pattern) => pattern.test(text)) && text.length <= 120) {
    return {
      route: "direct",
      reason: "Short casual query",
      confidence: 0.99,
      decidedBy: "fast_path",
    };
  }

  const tokenCount = text.split(/\s+/).filter(Boolean).length;
  if (tokenCount <= 8 && !/\?/.test(text) && !WEB_FRESHNESS_HINTS.some((pattern) => pattern.test(text))) {
    return {
      route: "direct",
      reason: "Short non-factual prompt",
      confidence: 0.9,
      decidedBy: "fast_path",
    };
  }

  if (!hasMistralApiKey()) {
    const webLike = WEB_FRESHNESS_HINTS.some((pattern) => pattern.test(text));
    if (webLike) {
      return {
        route: state?.hasVectorContext ? "hybrid" : "web",
        reason: "Heuristic web-freshness fallback without LLM",
        confidence: 0.66,
        decidedBy: "fallback",
      };
    }

    if (state?.hasVectorContext || state?.hasIngestedDocs) {
      return {
        route: "vector",
        reason: "Heuristic document-knowledge fallback without LLM",
        confidence: 0.51,
        decidedBy: "fallback",
      };
    }

    return {
      route: "direct",
      reason: "No model key; direct answer fallback",
      confidence: 0.75,
      decidedBy: "fallback",
    };
  }

  return {
    route: "unknown",
    reason: "Requires semantic routing",
    confidence: 0,
    decidedBy: "pending_llm",
  };
};

const llmRouterNode = async (state) => {
  if (state?.route && state.route !== "unknown") {
    return state;
  }

  const model = getChatModel({ temperature: 0 });
  const prompt = [
    "You are an intent router for a chat assistant.",
    "Classify the best execution route for the user query.",
    "Return strict JSON only:",
    '{"route":"direct|vector|web|hybrid","confidence":0.0,"reason":"short reason"}',
    "Definitions:",
    "- direct: answer from base model only (no web, no retrieval)",
    "- vector: use user uploaded document retrieval (RAG) only",
    "- web: use DuckDuckGo/web freshness tool only",
    "- hybrid: combine vector context + web results",
    "Routing policy:",
    "- Prefer direct for general chat, writing help, and reasoning tasks that do not need external facts.",
    "- Prefer web for freshness-sensitive/current-events queries.",
    "- Prefer vector for questions about user-uploaded docs/files/PDF/notes/syllabus.",
    "- Prefer hybrid if both uploaded-doc context and fresh web evidence are needed.",
    "- Latency is important: avoid retrieval/web unless needed.",
    `hasIngestedDocs: ${Boolean(state?.hasIngestedDocs)}`,
    `hasVectorContext: ${Boolean(state?.hasVectorContext)}`,
    `query: ${String(state?.query || "")}`,
  ].join("\n");

  const timeoutMs = Math.max(
    500,
    Number(process.env.RAG_ROUTER_TIMEOUT_MS || DEFAULT_ROUTER_TIMEOUT_MS)
  );

  try {
    const routed = await Promise.race([
      model.invoke(prompt),
      new Promise((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);

    if (!routed) {
      return {
        route: state?.hasVectorContext ? "vector" : "direct",
        reason: "Router timeout fallback",
        confidence: 0.4,
        decidedBy: "timeout_fallback",
      };
    }

    const parsed = safeJsonParse(responseText(routed));
    const route = normalizeRoute(parsed?.route);

    if (route === "vector" && !state?.hasIngestedDocs && !state?.hasVectorContext) {
      return {
        route: "direct",
        reason: "LLM asked for vector but docs unavailable",
        confidence: 0.55,
        decidedBy: "llm_guard",
      };
    }

    if (route === "hybrid" && !state?.hasVectorContext && !state?.hasIngestedDocs) {
      return {
        route: "web",
        reason: "LLM asked hybrid but no vector context/docs",
        confidence: 0.55,
        decidedBy: "llm_guard",
      };
    }

    return {
      route,
      reason: String(parsed?.reason || "Semantic LLM routing"),
      confidence: Number(parsed?.confidence || 0.7),
      decidedBy: "llm",
    };
  } catch {
    return {
      route: state?.hasVectorContext ? "vector" : "direct",
      reason: "Router error fallback",
      confidence: 0.4,
      decidedBy: "error_fallback",
    };
  }
};

const ROUTER_GRAPH = new StateGraph(RouterState)
  .addNode("fast_path", fastPathRouterNode)
  .addNode("llm_router", llmRouterNode)
  .addEdge(START, "fast_path")
  .addEdge("fast_path", "llm_router")
  .addEdge("llm_router", END)
  .compile();

export const getQueryRoutePlan = async ({
  query = "",
  hasIngestedDocs = false,
  hasVectorContext = false,
}) => {
  const text = String(query || "").trim();
  if (!text) {
    return {
      route: "direct",
      shouldUseRagPipeline: false,
      shouldUseWeb: false,
      reason: "Empty query",
      confidence: 1,
      decidedBy: "fast_path",
    };
  }

  const finalState = await ROUTER_GRAPH.invoke({
    query: text,
    hasIngestedDocs: Boolean(hasIngestedDocs),
    hasVectorContext: Boolean(hasVectorContext),
  });

  const route = normalizeRoute(finalState?.route);

  let resolvedRoute = route;
  if ((route === "vector" || route === "hybrid") && !hasIngestedDocs && !hasVectorContext) {
    resolvedRoute = "direct";
  }

  const shouldUseWeb = resolvedRoute === "web" || resolvedRoute === "hybrid";
  const shouldUseRagPipeline = ["vector", "web", "hybrid"].includes(resolvedRoute);

  return {
    route: resolvedRoute,
    shouldUseRagPipeline,
    shouldUseWeb,
    reason: String(finalState?.reason || ""),
    confidence: Number(finalState?.confidence || 0),
    decidedBy: String(finalState?.decidedBy || "fallback"),
  };
};

export const routeQuery = async ({
  query,
  hasVectorContext = true,
  hasIngestedDocs = false,
}) => {
  const plan = await getQueryRoutePlan({
    query,
    hasVectorContext,
    hasIngestedDocs,
  });

  if (!hasVectorContext) {
    if (plan.route === "hybrid") return "web";
    if (plan.route === "vector") return "web";
  }

  if (plan.route === "direct") {
    return hasVectorContext ? "vector" : "web";
  }

  return plan.route;
};

export const shouldUseRagPipeline = async ({ query = "", hasIngestedDocs = false }) => {
  const text = String(query || "").trim();
  if (!text) return false;

  if (isStrongDocQuery(text) && !hasIngestedDocs) {
    return false;
  }

  const plan = await getQueryRoutePlan({
    query: text,
    hasIngestedDocs,
    hasVectorContext: hasIngestedDocs,
  });

  return Boolean(plan.shouldUseRagPipeline);
};
