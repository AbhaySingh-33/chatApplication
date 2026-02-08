import useAIInsights from "../../hooks/useAIInsights";
import useConversation from "../../zustand/useConversation";

const chipStyles = {
  topic: "bg-indigo-500/20 text-indigo-100 border-indigo-400/30",
  sentiment: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30",
  urgency: "bg-amber-500/20 text-amber-100 border-amber-400/30",
};

const AIInsightsPanel = () => {
  const { selectedConversation } = useConversation();
  const { insights, loading, error } = useAIInsights();

  if (!selectedConversation?.isAI) return null;

  if (loading && !insights) {
    return (
      <div className="mx-2 mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-blue-100 text-xs">
        Analyzing conversation insights...
      </div>
    );
  }

  if (!insights && !loading && !error) {
    return (
      <div className="mx-2 mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-blue-100 text-xs">
        Insights will appear here after a few AI chat messages.
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-2 mt-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-red-100 text-xs">
        Failed to load insights. Check backend logs and `GEMINI_API_KEY`.
      </div>
    );
  }

  return (
    <div className="mx-2 mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-blue-100">
      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
        <span className={`px-2 py-1 rounded-full border ${chipStyles.topic}`}>
          Topic: {insights.topic || "Not set"}
        </span>
        <span className={`px-2 py-1 rounded-full border ${chipStyles.sentiment}`}>
          Sentiment: {insights.sentiment || "neutral"}
        </span>
        <span className={`px-2 py-1 rounded-full border ${chipStyles.urgency}`}>
          Urgency: {insights.urgency || "low"}
        </span>
      </div>

      {insights.summary && (
        <p className="mt-3 text-sm text-blue-100">{insights.summary}</p>
      )}

      {insights.decisions?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wider text-blue-200">Decisions</p>
          <ul className="mt-1 text-sm text-blue-100 list-disc list-inside space-y-1">
            {insights.decisions.map((decision, index) => (
              <li key={`decision-${index}`}>{decision}</li>
            ))}
          </ul>
        </div>
      )}

      {insights.actionItems?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wider text-blue-200">Action Items</p>
          <ul className="mt-1 text-sm text-blue-100 list-disc list-inside space-y-1">
            {insights.actionItems.map((item, index) => (
              <li key={`action-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
