const WEB_HINTS = [
  /latest/i,
  /today/i,
  /2026/i,
  /2027/i,
  /today/i,
  /news/i,
  /current/i,
  /currently/i,
  /live/i,
  /ongoing/i,
  /score(s)?/i,
  /standings?/i,
  /points table/i,
  /this season/i,
  /how many (matches|games)/i,
  /(matches|games).*(done|played|completed)/i,
  /recent/i,
  /release notes?/i,
  /what happened/i,
  /search web/i,
  /online/i,
];

export const routeQuery = ({ query, hasVectorContext = true }) => {
  if (!hasVectorContext) {
    return "web";
  }

  const shouldUseWeb = WEB_HINTS.some((pattern) => pattern.test(query));
  return shouldUseWeb ? "hybrid" : "vector";
};
