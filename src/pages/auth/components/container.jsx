import React from "react";
import {
  AudioLines,
  MessageSquareText,
  SlidersHorizontal,
  ShoppingBag,
  Mic,
  Clock,
  Coins,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/assets/icons/logo";

/* ---------- Content ---------- */
const APP = {
  name: "Vegabot",
  headline: "AI assistants you can talk to, type to, and tune.",
  description:
    "Chat by voice or text with assistants trained on real products, services and knowledge bases.",
};

const FEATURES = [
  {
    icon: AudioLines,
    title: "Live voice chat",
    text: "Talk in real time and hear spoken replies.",
  },
  {
    icon: MessageSquareText,
    title: "Text chat",
    text: "Type and get rich, formatted answers.",
  },
  {
    icon: SlidersHorizontal,
    title: "Custom personas",
    text: "Change tone, voice and rules.",
  },
  {
    icon: ShoppingBag,
    title: "Smart recommendations",
    text: "Product and service picks, with tokens, cost and latency shown.",
  },
];

/* ---------- Pieces ---------- */
const Waveform = () => (
  <div className="flex h-5 items-center gap-[3px]">
    {[6, 12, 18, 10, 16, 8, 14, 20, 12, 6, 16, 10, 14, 8].map((h, i) => (
      <span
        key={i}
        className="w-[3px] rounded-full bg-primary-foreground/80"
        style={{ height: h }}
      />
    ))}
  </div>
);

const Intro = () => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2.5">
      <Logo className="size-9" />
      <span className="text-lg font-semibold text-foreground">{APP.name}</span>
    </div>

    <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-foreground xl:text-4xl">
      {APP.headline}
    </h1>
    <p className="mt-3 max-w-lg text-base text-muted-foreground">
      {APP.description}
    </p>

    <ul className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {FEATURES.map((feature) => {
        const Icon = feature.icon;

        return (
          <li key={feature.title} className="flex gap-3">
            <div className="center size-9 shrink-0 rounded-xl border border-border bg-background/70">
              <Icon className="size-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {feature.title}
              </p>
              <p className="text-sm text-muted-foreground">{feature.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  </div>
);

/* ---------- Container ---------- */
const AuthContainer = ({
  title,
  description,
  children,
  containerClassName,
  panelClassName,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-background to-cyan-50 dark:from-lime-950/40 dark:via-background dark:to-cyan-950/30 lg:h-screen lg:overflow-hidden">
      <div
        className={cn(
          "mx-auto grid max-w-7xl gap-10 px-6 py-8 md:px-10 lg:h-full lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:py-0",
          containerClassName,
        )}
      >
        <section>
          <Intro />
        </section>

        <section className="flex justify-center">
          <div
            className={cn(
              "w-full max-w-md rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-xl shadow-black/5 md:p-8",
              panelClassName,
            )}
          >
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                {title}
              </h2>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthContainer;
