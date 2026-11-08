import { useState } from "react";
import { ImageIcon, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const Image = ({
  src,
  fallbackSrc,
  alt = "",
  type = "other",
  className = "",
  fallbackClassName = "",
  fallback = null,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [status, setStatus] = useState(src ? "loading" : "error");
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setCurrentSrc(src);
    setStatus(src ? "loading" : "error");
  }

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setStatus("loading");
      return;
    }
    setStatus("error");
  };

  if (status === "error") {
    if (fallback) return fallback;

    return (
      <div
        className={cn(
          "flex items-center justify-center bg-blue-100 dark:bg-blue-500",
          className,
          fallbackClassName,
        )}
        aria-label={alt || "Image unavailable"}
      >
        {type === "user" ? (
          <UserRound className="size-1/2 text-blue-700 dark:text-white" />
        ) : (
          <ImageIcon className="size-1/2 text-blue-700 dark:text-white" />
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onLoad={() => setStatus("loaded")}
      onError={handleError}
      className={cn(
        className,
        status === "loading" && "animate-pulse bg-muted",
      )}
      {...props}
    />
  );
};

export default Image;
