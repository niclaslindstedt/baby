// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  SpinnerIcon,
} from "@niclaslindstedt/oss-framework/components";
import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { formatDayYear } from "./format.ts";
import { useLang, useT } from "./i18n/index.ts";
import {
  byline,
  byTopic,
  publication,
  sourceLink,
  unlistedTopics,
  type Reference,
} from "./references.ts";
import { Card, Heading } from "./ui.tsx";
import { FEATURES } from "./useAppSettings.ts";
import { useReferences } from "./useReferences.ts";

// About, behind Settings: what the app is, and every published source its
// numbers rest on (OSS_SPEC.md §24.4). The list is the references registry
// itself, read through `references.ts` — never a copy kept by hand — grouped
// by the tracker each source serves and ranked strongest evidence first.
//
// Each source is cited the way a reference list cites it, with a parent's
// line on what in the app rests on it, and — one tap down — the source's own
// words the numbers were taken from, so the claim can be checked against
// them. The link out is the only way this screen reaches the network, and
// only when it is tapped.
//
// Read-only: like the views behind Today, it writes nothing.

type Props = {
  /** Back to Settings, where the screen was opened from. */
  onBack: () => void;
};

export function AboutScreen({ onBack }: Props) {
  const t = useT();
  const lang = useLang();
  const refs = useReferences();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";

  const pending = refs ? unlistedTopics(refs, FEATURES) : [];

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t("nav.settings")}
        </button>
      </div>

      <Card>
        <Heading>{t("about.title")}</Heading>
        <p className="mt-2 text-sm leading-snug text-fg">
          {t("settings.disclaimer")}
        </p>
        <p className="mt-2 text-xs leading-snug text-muted">
          {t("settings.privacy")}
        </p>
      </Card>

      <Card>
        <Heading>{t("about.sources")}</Heading>
        <p className="mt-2 text-sm leading-snug text-fg">
          {t("about.sourcesIntro")}
        </p>
        {pending.length > 0 && (
          <p className="mt-2 text-xs leading-snug text-muted">
            {t("about.pending", {
              trackers: new Intl.ListFormat(locale, {
                type: "conjunction",
              }).format(pending.map((id) => t(`nav.${id}` as const))),
            })}
          </p>
        )}
      </Card>

      {refs === null ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 py-6 text-sm text-muted"
        >
          <SpinnerIcon className="h-4 w-4 animate-spin" />
          {t("about.loading")}
        </p>
      ) : (
        byTopic(refs, FEATURES).map((group) => (
          <section key={group.topic} className="flex flex-col gap-2">
            <h2 className="px-1 pt-2 text-xs font-bold tracking-wide text-muted uppercase">
              {t(`nav.${group.topic}` as const)}
            </h2>
            {group.refs.map((ref) => (
              <ReferenceCard key={ref.id} reference={ref} locale={locale} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function ReferenceCard({
  reference: ref,
  locale,
}: {
  reference: Reference;
  locale: string;
}) {
  const t = useT();
  const lang = useLang();
  const link = sourceLink(ref);
  const where = publication(ref);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent">
          {t(`about.evidence.${ref.evidence}` as const)}
        </span>
        <span className="text-muted">{ref.year}</span>
      </div>
      <p
        lang={ref.language}
        className="mt-2 text-sm leading-snug font-semibold text-fg-bright"
      >
        {ref.title}
      </p>
      <p className="mt-1 text-xs leading-snug text-muted">
        {byline(ref)}
        {where && ` · ${where}`}
      </p>
      <p className="mt-2 text-sm leading-snug text-fg">
        {lang === "sv" ? ref.summary.sv : ref.summary.en}
      </p>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-medium text-accent">
          {t("about.quotes")}
        </summary>
        <ul className="mt-2 flex flex-col gap-2">
          {ref.quotes.map((quote, i) => (
            <li key={i}>
              <blockquote
                lang={ref.language}
                className="border-l-2 border-line pl-3 text-xs leading-snug text-fg"
              >
                “{quote.text}”
              </blockquote>
              {quote.at && (
                <p lang="en" className="mt-0.5 pl-3 text-[11px] text-muted">
                  {quote.at}
                </p>
              )}
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            {ref.doi ? `doi:${ref.doi}` : t("about.openSource")}
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        )}
        {!link && ref.isbn && (
          <span className="text-muted">
            {t("about.isbn", { isbn: ref.isbn })}
          </span>
        )}
        {ref.accessed && (
          <span className="text-muted">
            {t("about.accessed", {
              date: formatDayYear(ref.accessed as DayKey, locale),
            })}
          </span>
        )}
      </div>
    </Card>
  );
}
