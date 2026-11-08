import Image from "@/components/ui/image";
import { AVATAR_COLORS } from "@/constants/colors";
import { cn, getInitials } from "@/lib/utils";

const PERSON_AVATAT_SIZE = {
  xs: "size-5 text-[8px]",
  sm: "size-6 text-[9px]",
  md: "size-8 text-[10px]",
  lg: "size-10 text-xs",
  xl: "size-12 text-sm",
};

const PersonAvatar = ({ person, index = 0, size = "md", className }) => {
  const name = person?.name?.trim() || person?.email || "Team member";
  const avatar = person?.avatar_url || person?.avatar || person?.image || "";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ring-2 ring-background",
        AVATAR_COLORS[index % AVATAR_COLORS.length],
        PERSON_AVATAT_SIZE[size] || PERSON_AVATAT_SIZE.md,
        className,
      )}
      title={name}
    >
      {avatar ? (
        <Image
          src={avatar}
          alt={`${name} avatar`}
          type="user"
          className="size-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
};

const CHATBOT_AVATAR_SIZE = {
  xs: "size-6",
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-14",
};

const CHATBOT_AVATAR_PADDING = {
  xs: "p-1",
  sm: "p-1",
  md: "p-1.5",
  lg: "p-1.5",
  xl: "p-2",
};

const ChatbotAvatar = ({
  chatbot = null,
  src = null,
  size = "lg",
  className,
}) => {
  const logoSrc = chatbot?.logo || src;

  return (
    <div
      className={cn(
        "center shrink-0 overflow-hidden rounded-full",
        CHATBOT_AVATAR_SIZE[size] || CHATBOT_AVATAR_SIZE.lg,
        className,
      )}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt="chatbot logo"
          type="other"
          className="size-full object-contain"
          fallbackClassName="rounded-full"
        />
      ) : (
        <div
          className={cn(
            "size-full rounded-full bg-primary",
            CHATBOT_AVATAR_PADDING[size] || CHATBOT_AVATAR_PADDING.lg,
          )}
        >
          <img
            src="/logo-dark.png"
            alt="chatbot logo"
            className="size-full object-contain"
          />
        </div>
      )}
    </div>
  );
};
export { PersonAvatar, ChatbotAvatar };
