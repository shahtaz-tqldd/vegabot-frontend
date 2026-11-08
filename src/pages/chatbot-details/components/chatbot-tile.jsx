import { cn, getInitials, getPaletteIndex } from "@/lib/utils";
import { AVATAR_TONES } from "@/constants/colors";

const ChatbotTile = ({ chatbot, className = "size-12 rounded-2xl text-base" }) => {
  const tone = AVATAR_TONES[getPaletteIndex(chatbot.slug, AVATAR_TONES)];

  if (chatbot.logo) {
    return (
      <img
        src={chatbot.logo}
        alt={chatbot.name}
        className={cn("shrink-0 object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center font-bold",
        tone,
        className,
      )}
      title={chatbot.name}
    >
      {getInitials(chatbot.name)}
    </span>
  );
};

export default ChatbotTile;
