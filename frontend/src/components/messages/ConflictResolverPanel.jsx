import toast from "react-hot-toast";
import useConversation from "../../zustand/useConversation";

const severityStyles = {
  low: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  medium: "bg-orange-500/20 text-orange-200 border-orange-400/30",
  high: "bg-red-500/20 text-red-200 border-red-400/30",
};

const ConflictResolverPanel = () => {
  const {
    selectedConversation,
    conflictHints,
    clearConflictHint,
    setDraftMessage,
  } = useConversation();

  if (selectedConversation?.isAI) return null;
  const hint = conflictHints?.[selectedConversation?._id];
  if (!hint) return null;

  const severity = hint.severity || "low";
  const badgeStyle = severityStyles[severity] || severityStyles.low;

  const handleCopy = async (text) => {
    if (!text) return;
    if (!navigator?.clipboard?.writeText) {
      toast.error("Clipboard not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="mx-2 mb-2 rounded-xl border border-amber-300/20 bg-amber-900/20 p-3 text-amber-100 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-200">
          Conflict Resolver
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeStyle}`}>
          {severity} tension
        </span>
      </div>
      {hint.action === "modified" && (
        <p className="mt-2 text-xs text-amber-200">
          Your message was softened before sending.
        </p>
      )}
      {hint.action === "blocked" && (
        <p className="mt-2 text-xs text-amber-200">
          Your message was blocked. Consider revising it.
        </p>
      )}

      {hint.neutralRephrase && (
        <>
          <p className="mt-2 text-xs text-amber-200">Neutral re-phrasing</p>
          <p className="mt-1 text-sm text-amber-50">{hint.neutralRephrase}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="text-xs px-2 py-1 rounded bg-amber-500/30 hover:bg-amber-500/40 transition-colors"
              onClick={() => setDraftMessage(hint.neutralRephrase)}
            >
              Use Rephrase
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => handleCopy(hint.neutralRephrase)}
            >
              Copy
            </button>
          </div>
        </>
      )}

      {hint.compromiseSuggestions?.length > 0 && (
        <>
          <p className="mt-3 text-xs text-amber-200">Compromise ideas</p>
          <ul className="mt-1 list-disc list-inside text-sm text-amber-50 space-y-1">
            {hint.compromiseSuggestions.map((suggestion, index) => (
              <li key={`${hint.messageId || "conflict"}-${index}`}>{suggestion}</li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-3 flex gap-2">
        <button
          className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => clearConflictHint(selectedConversation?._id)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ConflictResolverPanel;
