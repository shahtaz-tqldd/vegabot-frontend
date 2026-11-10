import {
  ArrowUpCircle,
  Bell,
  CheckCircle2,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  Wrench,
} from "lucide-react";

// Map an API notification row to the shape used by the UI.
export const normalizeNotification = (raw = {}) => ({
  ...raw,
  id: raw.id ?? raw.uuid,
  recipientType: raw.recipient_type ?? raw.recipientType ?? "global",
  notificationType:
    raw.notification_type ?? raw.notificationType ?? raw.event ?? "general",
  title: raw.title ?? "",
  message: raw.message ?? "",
  metadata: raw.metadata ?? {},
  workspaceId: raw.workspace_id ?? null,
  chatbotId: raw.chatbot_id ?? null,
  targetId: raw.target_id ?? null,
  isRead: Boolean(raw.is_read ?? raw.isRead),
  readAt: raw.read_at ?? null,
  createdAt: raw.created_at,
});

const TYPE_VISUALS = {
  training_complete: {
    Icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600",
  },
  new_message: {
    Icon: MessageSquare,
    className: "bg-sky-500/10 text-sky-600",
  },
  session_started: {
    Icon: MessagesSquare,
    className: "bg-violet-500/10 text-violet-600",
  },
  ai_notification: {
    Icon: Sparkles,
    className: "bg-fuchsia-500/10 text-fuchsia-600",
  },
  update: {
    Icon: ArrowUpCircle,
    className: "bg-blue-500/10 text-blue-600",
  },
  maintenance: {
    Icon: Wrench,
    className: "bg-amber-500/10 text-amber-600",
  },
  notify: {
    Icon: Megaphone,
    className: "bg-rose-500/10 text-rose-600",
  },
};

export const notificationVisual = (type) =>
  TYPE_VISUALS[String(type || "").toLowerCase()] ?? {
    Icon: Bell,
    className: "bg-primary/10 text-primary",
  };
