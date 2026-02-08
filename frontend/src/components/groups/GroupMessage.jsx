import { useMemo } from "react";
import { extractTime } from "../../utils/extractTime";

const GroupMessage = ({ message, currentUserId, isAdmin }) => {
  const fromMe = message.senderId === currentUserId;
  const formattedTime = extractTime(message.createdAt);

  const moderation = message.moderation || {};
  const flags = moderation.flags || [];
  const showFlags = flags.length > 0 && (isAdmin || fromMe);

  const highlightClass = moderation.highlighted
    ? "ring-2 ring-amber-400/80 bg-amber-500/10"
    : "";

  const bubbleClass = fromMe ? "bg-blue-500" : "bg-white/10";
  const blocked = moderation.status === "blocked";

  const senderLabel = useMemo(() => {
    if (fromMe) return "You";
    return message.sender?.fullName || message.sender?.username || "Member";
  }, [fromMe, message.sender?.fullName, message.sender?.username]);

  if (message.system) {
    return (
      <div className="w-full flex justify-center my-2">
        <div className="text-xs text-amber-200 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full">
          {message.message || "System update"}
        </div>
      </div>
    );
  }

  // File rendering helper
  const renderMedia = () => {
    if (!message.media) return null;

    const isImage = message.media.match(/\.(jpeg|jpg|gif|png)$/i) || message.media.includes("/image/upload/");
    const isVideo = message.media.match(/\.(mp4|webm|ogg)$/i) || message.media.includes("/video/upload/");

    if (isImage) {
        return (
            <div className="mt-2 rounded-lg overflow-hidden border border-white/20 max-w-[200px]">
                <img src={message.media} alt="Shared media" className="w-full h-auto object-cover" />
            </div>
        );
    }
    if (isVideo) {
        return (
            <div className="mt-2 rounded-lg overflow-hidden border border-white/20 max-w-[200px]">
                <video src={message.media} controls className="w-full h-auto" />
            </div>
        );
    }
    return (
        <a 
            href={message.media} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 block text-xs text-blue-300 underline"
        >
            View Attachment
        </a>
    );
  };

  return (
    <div className={`chat ${fromMe ? "chat-end" : "chat-start"}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full border border-white/10">
          <img
            alt="user avatar"
            src={message.sender?.profilePic || "/default-avatar.png"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-blue-200">{senderLabel}</span>
        <div
          className={`chat-bubble text-white whitespace-pre-line break-words break-all max-w-xs sm:max-w-md md:max-w-lg ${bubbleClass} ${highlightClass}`}
        >
          {blocked ? "Message removed by moderator." : (
              <>
                 {message.message}
                 {renderMedia()}
              </>
          )}
        </div>

        {showFlags && (
          <div className="flex flex-wrap gap-1">
            {flags.map((flag) => (
              <span
                key={`${message._id}-${flag}`}
                className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-100 border border-rose-400/30"
              >
                {flag}
              </span>
            ))}
          </div>
        )}

        <span className="text-[10px] text-blue-200/70">{formattedTime}</span>
      </div>
    </div>
  );
};

export default GroupMessage;
