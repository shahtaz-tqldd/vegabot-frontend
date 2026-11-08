import * as React from "react";

import { cn } from "@/lib/utils";
import { Text, Title } from "./typography";
import Image from "./image";

function Table({ className, ...props }) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

function TableProfile({
  className,
  name,
  email,
  profile_img_url = "",
  thumbnail_img_url = "",
  non_rounded = false,
}) {
  const avatarClassName = cn(
    "shrink-0 overflow-hidden",
    non_rounded ? "h-12 w-12 rounded-xl" : "h-10 w-10 rounded-full",
  );
  const imageUrl = thumbnail_img_url || getThumbnailImageUrl(profile_img_url);

  return (
    <div className={cn("flx min-w-0 gap-2.5", className)}>
      {imageUrl ? (
        <div className={avatarClassName}>
          <Image
            src={imageUrl}
            alt={name}
            className="size-full object-cover bg-primary/10"
            fallbackClassName="rounded-full"
            type="user"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </div>
      ) : (
        <div
          className={cn(
            "center bg-primary/10 text-primary font-medium",
            avatarClassName,
          )}
        >
          {name?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <Title variant="xs">{name}</Title>
        <Text variant="xs">{email}</Text>
      </div>
    </div>
  );
}

function getThumbnailImageUrl(url) {
  if (!url) return "";

  try {
    const imageUrl = new URL(url, window.location.origin);
    const host = imageUrl.hostname;

    if (host.includes("cloudinary.com")) {
      imageUrl.pathname = imageUrl.pathname.replace(
        "/upload/",
        "/upload/c_fill,w_96,h_96,q_auto,f_auto/",
      );
      return imageUrl.toString();
    }

    if (host.includes("images.unsplash.com")) {
      imageUrl.searchParams.set("w", "96");
      imageUrl.searchParams.set("h", "96");
      imageUrl.searchParams.set("fit", "crop");
      imageUrl.searchParams.set("q", "60");
      return imageUrl.toString();
    }

    if (host.includes("imagekit.io")) {
      imageUrl.searchParams.set("tr", "w-96,h-96,q-60");
      return imageUrl.toString();
    }

    return url;
  } catch {
    return url;
  }
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableProfile,
};
