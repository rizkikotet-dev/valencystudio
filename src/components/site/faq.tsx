"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { useLocale } from "@/hooks/use-locale";
import {
  BUG_REPORT_URL,
  DISCORD_URL,
  FEATURE_REQUEST_URL,
  RELEASES_URL,
  REPO_URL,
} from "@/hooks/use-site-data";

const LINK_CLASS =
  "text-primary underline underline-offset-2 hover:no-underline";
const CODE_CLASS = "font-mono text-xs";

export function Faq() {
  const { t } = useLocale();

  // Built during render so every segment resolves in the active locale.
  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: t("faq.q1"),
      a: (
        <>
          {t("faq.a1a")}{" "}
          <a className={LINK_CLASS} href={REPO_URL} target="_blank" rel="noopener noreferrer">
            {t("faq.a1l1")}
          </a>
          {t("faq.a1b")}{" "}
          <a className={LINK_CLASS} href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
            {t("faq.a1l2")}
          </a>
          {t("faq.a1c")}
        </>
      ),
    },
    {
      q: t("faq.q2"),
      a: t("faq.a2"),
    },
    {
      q: t("faq.q3"),
      a: (
        <>
          {t("faq.a3a")}
          <code className={CODE_CLASS}>x64-setup.exe</code>
          {t("faq.a3b")}
          <code className={CODE_CLASS}>x64.dmg</code>
          {t("faq.a3c")}
          <code className={CODE_CLASS}>amd64.AppImage</code>
          {t("faq.a3d")}
          <code className={CODE_CLASS}>ValencyStudioSpoofer.rbxmx</code>
          {t("faq.a3e")}
        </>
      ),
    },
    {
      q: t("faq.q4"),
      a: t("faq.a4"),
    },
    {
      q: t("faq.q5"),
      a: t("faq.a5"),
    },
    {
      q: t("faq.q6"),
      a: (
        <>
          {t("faq.a6a")}
          <a className={LINK_CLASS} href={BUG_REPORT_URL} target="_blank" rel="noopener noreferrer">
            {t("faq.a6l1")}
          </a>
          {t("faq.a6b")}
          <a className={LINK_CLASS} href={FEATURE_REQUEST_URL} target="_blank" rel="noopener noreferrer">
            {t("faq.a6l2")}
          </a>
          {t("faq.a6c")}
          <a className={LINK_CLASS} href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
            {t("faq.a6l3")}
          </a>
          {t("faq.a6d")}
        </>
      ),
    },
  ];

  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
          <SectionHeading
            index="07"
            eyebrow={t("nav.faq")}
            title={t("faq.title")}
            description={t("faq.description")}
            className="lg:sticky lg:top-24 self-start"
          />

          <Reveal>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={`faq-${i}`} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left font-display text-[15px] font-medium tracking-tight hover:text-primary hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
