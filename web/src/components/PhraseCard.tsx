import Link from "next/link";
import type { PhraseWithCategory } from "@/db/repository";
import { CopyButton } from "./CopyButton";

const LANGS = [
  { key: "vi", label: "VI" },
  { key: "en", label: "EN" },
  { key: "zh", label: "ZH" },
] as const;

export function PhraseCard({
  phrase,
  showCategory = false,
}: {
  phrase: PhraseWithCategory;
  showCategory?: boolean;
}) {
  const heading = phrase.code ? `${phrase.code} ${phrase.title ?? ""}`.trim() : phrase.title;

  return (
    <article className="rounded-xl border border-border bg-surface p-4" data-testid="phrase-card">
      {(heading || showCategory || phrase.needsReview) && (
        <header className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          {heading && <h3 className="text-sm font-semibold text-foreground">{heading}</h3>}
          {showCategory && (
            <Link href={`/c/${phrase.categoryNumber}`} className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">
              {phrase.categoryNumber}. {phrase.categoryTitle}
            </Link>
          )}
          {phrase.needsReview && (
            <span className="rounded bg-warn-soft px-1.5 py-0.5 text-warn">Bản VI chờ xác nhận</span>
          )}
        </header>
      )}
      <dl className="space-y-3">
        {LANGS.map(({ key, label }) => {
          const text = phrase[key];
          if (!text) return null;
          return (
            <div key={key} className="flex items-start gap-3">
              <dt className="mt-0.5 w-7 shrink-0 text-xs font-semibold text-muted">{label}</dt>
              <dd lang={key === "zh" ? "zh-Hans" : key} className="flex-1 whitespace-pre-line text-[15px] leading-relaxed">
                {text}
              </dd>
              <CopyButton text={text} label={label} />
            </div>
          );
        })}
      </dl>
    </article>
  );
}
