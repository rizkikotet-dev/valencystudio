"use client";

import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  index: string; // e.g. "01"
  eyebrow: string; // e.g. "HOW IT WORKS"
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <div className="flex items-center gap-3 font-mono text-xs tracking-[0.22em] uppercase">
        <span className="text-primary">{index}</span>
        <span
          aria-hidden
          className="h-px w-10 bg-gradient-to-r from-primary via-primary/50 to-transparent"
        />
        <span className="text-muted-foreground">{eyebrow}</span>
      </div>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-balance leading-[1.1]">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
