import { useState } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const Composer = ({
  onSend,
  disabled = false,
  className = "px-5 pb-5",
  showNote = true,
  placeholder = "Message the bot…",
}) => {
  const [value, setValue] = useState("");

  const send = () => {
    const content = value.trim();
    if (!content || disabled) return;

    onSend(content);
    setValue("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className={cn("shrink-0", className)}>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm transition focus-within:border-primary/50 focus-within:shadow-primary/5">
          <Textarea
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="max-h-36 min-h-0 flex-1 resize-none rounded-xl border-0 bg-transparent px-2.5 py-2.5 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Button
            type="button"
            size="icon"
            aria-label="Send message"
            onClick={send}
            disabled={!value.trim() || disabled}
            className="rounded-full"
          >
            <SendHorizontal size={16} />
          </Button>
        </div>

        {showNote && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
            Simulated replies — the bot backend and socket connect here later.
          </p>
        )}
      </div>
    </div>
  );
};

export default Composer;
