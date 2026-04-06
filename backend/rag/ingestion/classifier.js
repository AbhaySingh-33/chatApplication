const RULES = [
  {
    label: "api",
    regex: /\b(api|endpoint|request|response|http|rest|graphql)\b/i,
  },
  {
    label: "auth",
    regex: /\b(auth|oauth|jwt|token|login|permission|rbac)\b/i,
  },
  {
    label: "database",
    regex: /\b(database|sql|mongo|collection|schema|query|index)\b/i,
  },
  {
    label: "frontend",
    regex: /\b(react|component|ui|css|tailwind|frontend|vite)\b/i,
  },
  {
    label: "ops",
    regex: /\b(docker|kubernetes|deploy|ci|cd|monitoring|logging)\b/i,
  },
];

export const classifyDocument = ({ text = "", source = "" }) => {
  const haystack = `${source}\n${text}`;
  const matched = RULES.find((rule) => rule.regex.test(haystack));
  return matched?.label || "general";
};

export const addClassificationMetadata = (documents) =>
  documents.map((doc) => {
    const source = doc?.metadata?.source || doc?.metadata?.url || "";
    const category = classifyDocument({ text: doc.pageContent, source });
    return {
      ...doc,
      metadata: {
        ...doc.metadata,
        category,
      },
    };
  });
