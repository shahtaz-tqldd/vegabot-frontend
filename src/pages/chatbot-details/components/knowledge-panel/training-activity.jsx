import { useTrainingLogsQuery } from "@/features/knowledge/knowledgeApiSlice";
import { duration } from "@/lib/date-time";
import { cn } from "@/lib/utils";

const STATUS_DOTS = {
  trained: "bg-emerald-500",
  processing: "bg-primary animate-pulse",
  failed: "bg-red-500",
};

const TrainingActivity = ({ chatbot }) => {
  const { data, isLoading } = useTrainingLogsQuery({
    chatbot,
    page_size: 5,
  });

  const logs = data?.logs ?? [];

  if (isLoading || !logs.length) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Training activity
      </p>
      <div className="divide-y divide-border rounded-2xl border border-border bg-background">
        {logs.map((log) => (
          <div key={log.id ?? log.sourceTitle} className="flx px-3.5 py-2.5">
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                STATUS_DOTS[log.status] ?? STATUS_DOTS.processing,
              )}
            />
            <p className="min-w-0 flex-1 px-3 text-[13px] leading-5 text-foreground">
              <span className="font-semibold">{log.sourceTitle}</span>
              {log.stage === "skipped" ? (
                <span className="text-muted-foreground"> · up to date</span>
              ) : (
                log.message && (
                  <span className="text-muted-foreground"> · {log.message}</span>
                )
              )}
            </p>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {duration(log.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingActivity;
