"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Github,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/site/reveal";
import { postSubscribe, useStats, DISCORD_URL, REPO_URL } from "@/hooks/use-site-data";
import { toast } from "sonner";

export function Cta() {
  const { stats } = useStats();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [joinedCount, setJoinedCount] = useState<number | null>(null);

  // Derived: prefer the post-subscribe count, fall back to the server stats.
  const subscriberCount =
    joinedCount ?? (stats.site.subscribers > 0 ? stats.site.subscribers : null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    const result = await postSubscribe(trimmed);
    setSubmitting(false);

    if (result.ok) {
      setJoinedCount(result.subscribers ?? null);
      setSubscribed(true);
      setEmail("");
      toast.success("You're on the list.", {
        description: "Release notes and plugin updates will land in your inbox.",
      });
    } else {
      toast.error(result.error ?? "Something went wrong. Try again.");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied", {
        description: "Share it with your studio team.",
      });
    } catch {
      toast.error("Couldn't access the clipboard.");
    }
  }

  return (
    <section aria-label="Stay updated" className="relative py-20 sm:py-28 border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl border bg-card px-6 py-14 sm:px-12 sm:py-16 text-center">
            <div aria-hidden className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,black_20%,transparent_100%)]" />
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            <div className="relative mx-auto max-w-xl flex flex-col items-center gap-5">
              <div className="flex size-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
                Ship day, shipped to your inbox
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Get release notes, plugin updates, and new feature announcements for
                ValencyStudio — Spoofer. No spam, unsubscribe anytime.
              </p>

              {subscribed ? (
                <div
                  className="mt-2 flex w-full max-w-md items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3.5 text-left"
                  role="status"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      You're on the list
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Watch your inbox for release notes and plugin updates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubscribed(false)}
                    className="shrink-0 rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
                  >
                    Add another
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="mt-2 flex w-full max-w-md flex-col sm:flex-row gap-2.5"
                  aria-label="Subscribe for updates"
                >
                  <label htmlFor="cta-email" className="sr-only">
                    Email address
                  </label>
                  <Input
                    id="cta-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.dev"
                    autoComplete="email"
                    className="h-11 flex-1 bg-background/80"
                  />
                  <Button type="submit" disabled={submitting} className="h-11 gap-2 font-medium">
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                    Subscribe
                  </Button>
                </form>
              )}

              <p className="font-mono text-[11px] text-muted-foreground/80" aria-live="polite">
                {subscriberCount !== null
                  ? `Joined by ${subscriberCount.toLocaleString("en-US")} developer${subscriberCount === 1 ? "" : "s"}`
                  : "Be among the first on the list"}
              </p>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                    <Github className="size-4" />
                    Star on GitHub
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    Join the Discord
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void copyLink()}
                >
                  <Link2 className="size-4" />
                  Copy link
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
