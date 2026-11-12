import { useMemo } from "react";
import { Clock, Coins, Cpu, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

const formatInt = (value) =>
  Number.isFinite(Number(value))
    ? Math.round(Number(value)).toLocaleString()
    : "—";

const formatCost = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `$${number.toFixed(number >= 1 ? 2 : 4)}`;
};

const formatMs = (ms) => {
  const number = Number(ms);
  if (!Number.isFinite(number)) return "—";
  return number >= 1000 ? `${(number / 1000).toFixed(1)}s` : `${Math.round(number)}ms`;
};

const formatAudioDuration = (seconds) => {
  const total = Math.round(Number(seconds) || 0);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  return `${minutes}m ${String(total % 60).padStart(2, "0")}s`;
};

const formatMinutes = (seconds) =>
  `${((Number(seconds) || 0) / 60).toFixed(2)} min`;

// Sums everything the loaded messages report. Live/streaming bubbles have no
// usage yet and are skipped.
const summarize = (messages = []) => {
  const stored = messages.filter((m) => !m.streaming && !m.partial);
  const replies = stored.filter((m) => m.senderType === "agent");
  const withUsage = replies.filter((m) => m.usage);
  const times = replies
    .map((m) => m.responseTimeMs)
    .filter((ms) => Number.isFinite(ms));

  const totals = withUsage.reduce(
    (acc, { usage }) => {
      Object.keys(acc).forEach((key) => {
        acc[key] += usage[key] || 0;
      });
      return acc;
    },
    {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      thinkingTokens: 0,
      cachedInputTokens: 0,
      audioInputTokens: 0,
      audioOutputTokens: 0,
      audioInputSeconds: 0,
      audioOutputSeconds: 0,
      cost: 0,
    },
  );

  const models = [...new Set(withUsage.map((m) => m.usage.model).filter(Boolean))];

  return {
    totals,
    models,
    messageCount: stored.length,
    userCount: stored.filter((m) => m.senderType !== "agent").length,
    replyCount: replies.length,
    audioCount: stored.filter((m) => m.mode === "audio").length,
    textCount: stored.filter((m) => m.mode !== "audio").length,
    replies: withUsage,
    avgMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
    minMs: times.length ? Math.min(...times) : null,
    maxMs: times.length ? Math.max(...times) : null,
  };
};

const StatCard = ({ icon, label, value, sub }) => {
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-border bg-card px-3.5 py-3">
      <p className="flx gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon size={12} className="text-primary" />
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
};

const Panel = ({ title, hint, children }) => (
  <div className="rounded-2xl border border-border bg-card">
    <div className="flbx gap-2 border-b border-border px-4 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
        {title}
      </p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

const KeyValue = ({ label, value, swatch }) => (
  <div className="flbx py-1 text-xs">
    <span className="flx gap-2 text-muted-foreground">
      {swatch && <span className={cn("size-2 rounded-full", swatch)} />}
      {label}
    </span>
    <span className="font-semibold tabular-nums text-foreground">{value}</span>
  </div>
);

const TOKEN_PARTS = [
  { key: "inputTokens", label: "Input", swatch: "bg-primary" },
  { key: "outputTokens", label: "Output", swatch: "bg-sky-500" },
  { key: "thinkingTokens", label: "Thinking", swatch: "bg-amber-500" },
];

const AUDIO_PARTS = [
  {
    key: "audioInputSeconds",
    tokensKey: "audioInputTokens",
    label: "Heard (user)",
    swatch: "bg-primary",
  },
  {
    key: "audioOutputSeconds",
    tokensKey: "audioOutputTokens",
    label: "Spoken (agent)",
    swatch: "bg-sky-500",
  },
];

// Proportional bar used by the token and audio breakdowns.
const StackedBar = ({ parts, totals }) => {
  const sum = parts.reduce((total, part) => total + totals[part.key], 0);
  if (!sum) return null;
  return (
    <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-muted">
      {parts.map((part) => (
        <span
          key={part.key}
          className={part.swatch}
          style={{ width: `${(totals[part.key] / sum) * 100}%` }}
        />
      ))}
    </div>
  );
};

const AnalyticsTab = ({ messages, summary }) => {
  const stats = useMemo(() => summarize(messages), [messages]);
  const { totals } = stats;

  // Session-level totals come from the sessions list (covers every message,
  // even ones not loaded); fall back to what's loaded.
  const totalCost = summary?.totalCost ?? totals.cost;
  const totalTokens = summary?.totalTokens ?? totals.totalTokens;
  const avgMs = summary?.avgResponseTimeMs ?? stats.avgMs;
  const messageCount = summary?.messageCount || stats.messageCount;

  const audioSeconds = totals.audioInputSeconds + totals.audioOutputSeconds;
  const hasAudio =
    totals.audioInputSeconds || totals.audioOutputSeconds ||
    totals.audioInputTokens || totals.audioOutputTokens;

  if (!stats.messageCount && !summary) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
        Usage shows up once the agent replies.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard icon={Coins} label="Total cost" value={formatCost(totalCost)} />
        <StatCard icon={Cpu} label="Tokens" value={formatInt(totalTokens)} />
        <StatCard
          icon={Clock}
          label="Avg response"
          value={formatMs(avgMs)}
          sub={
            stats.minMs != null
              ? `${formatMs(stats.minMs)} – ${formatMs(stats.maxMs)}`
              : null
          }
        />
        <StatCard
          icon={MessageSquare}
          label="Messages"
          value={formatInt(messageCount)}
          sub={`${stats.userCount} user · ${stats.replyCount} agent`}
        />
      </div>

      <Panel
        title="Token breakdown"
        hint={`${stats.replies.length} repl${stats.replies.length === 1 ? "y" : "ies"}`}
      >
        <StackedBar parts={TOKEN_PARTS} totals={totals} />
        {TOKEN_PARTS.map((part) => (
          <KeyValue
            key={part.key}
            label={part.label}
            value={formatInt(totals[part.key])}
            swatch={part.swatch}
          />
        ))}
        <KeyValue label="Cached input" value={formatInt(totals.cachedInputTokens)} />
        <div className="mt-1 border-t border-border pt-1">
          <KeyValue label="Total (loaded)" value={formatInt(totals.totalTokens)} />
          <KeyValue label="Cost (loaded)" value={formatCost(totals.cost)} />
        </div>
      </Panel>

      {hasAudio ? (
        <Panel title="Audio breakdown" hint={formatMinutes(audioSeconds)}>
          <StackedBar parts={AUDIO_PARTS} totals={totals} />
          {AUDIO_PARTS.map((part) => (
            <KeyValue
              key={part.key}
              label={part.label}
              swatch={part.swatch}
              value={`${formatAudioDuration(totals[part.key])} · ${formatInt(totals[part.tokensKey])} tok`}
            />
          ))}
          <div className="mt-1 border-t border-border pt-1">
            <KeyValue label="Total audio" value={formatAudioDuration(audioSeconds)} />
            <KeyValue
              label="Messages by mode"
              value={`${stats.textCount} text · ${stats.audioCount} voice`}
            />
          </div>
        </Panel>
      ) : null}

      {stats.replies.length > 0 && (
        <Panel title="Cost per reply" hint="oldest first">
          <div className="custom-scrollbar -mx-1 max-h-72 divide-y divide-border/70 overflow-y-auto px-1">
            {stats.replies.map((message, index) => (
              <div key={message.id} className="flex items-center gap-3 py-2">
                <span className="w-6 shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  #{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">
                    {message.content || "(no text)"}
                  </p>
                  <p className="text-[10px] tabular-nums text-muted-foreground">
                    {[
                      `${formatInt(message.usage.totalTokens)} tok`,
                      formatMs(message.responseTimeMs),
                      message.mode === "audio" ? "voice" : "text",
                    ].join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                  {formatCost(message.usage.cost)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {stats.models.length > 0 && (
        <p className="px-1 text-[11px] text-muted-foreground">
          Model{stats.models.length > 1 ? "s" : ""}:{" "}
          <span className="font-mono text-foreground">{stats.models.join(", ")}</span>
        </p>
      )}
    </div>
  );
};

export default AnalyticsTab;
