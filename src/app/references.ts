// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The references: every source the app's numbers and claims rest on, as the
// app reads them.
//
// The registry itself is `docs/references.json` (OSS_SPEC.md §24): one entry
// per source, keyed by the id the code cites as `[ref:<id>]` beside the
// number it supports — who wrote it, where it was published, the DOI or URL,
// the kind of evidence it is, the words the number was taken from, and the
// files that cite it. This module is its typed face: the shape, the evidence
// vocabulary and the order it ranks in, and how an entry is cited on the
// Sources screen. `tests/references_test.ts` holds the file to this shape and
// to the tags in the code.
//
// Two fields are the app's own rather than the spec's: `summary`, the line
// a parent reads about what in the app rests on the source, in both of the
// app's languages, and `topics`, the trackers it is listed under.
//
// Pure: the registry is a parameter. It is a few dozen kilobytes nobody needs
// until the Sources screen opens, so it rides in its own chunk
// (`useReferences.ts`), and the tests hand in the file they read.

import type { FeatureId } from "./useAppSettings.ts";

/** The kinds of evidence, strongest first — the order the Sources screen
 *  lists a tracker's references in. The vocabulary is OSS_SPEC.md §24.2's. */
export const EVIDENCE = [
  "guideline",
  "consensus",
  "systematic-review",
  "meta-analysis",
  "randomized-trial",
  "cohort",
  "clinical-study",
  "review",
  "method",
  "dataset",
  "health-service",
] as const;

export type Evidence = (typeof EVIDENCE)[number];

/** A citation tag in a comment: `[ref:` and a kebab-case id. */
export const CITATION_TAG = /\[ref:([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;

export type Quote = {
  /** The source's own words, in its own language. */
  text: string;
  /** Where in the source: a page, a table, a section. */
  at?: string;
};

export type Reference = {
  id: string;
  evidence: Evidence;
  title: string;
  year: number;
  authors?: string[];
  organization?: string;
  /** The journal, publisher or site. */
  container?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  isbn?: string;
  /** The language of the source and its quotes. */
  language: string;
  /** When a web page was read, `YYYY-MM-DD`. */
  accessed?: string;
  quotes: Quote[];
  /** What the app uses the source for, for a contributor. */
  supports: string;
  /** The same, for a parent, in each of the app's languages. */
  summary: { en: string; sv: string };
  /** The trackers the source is listed under. */
  topics: FeatureId[];
  note?: string;
  usedBy: string[];
};

/** The file as stored: entries keyed by id. */
export type Registry = {
  references: Record<string, Omit<Reference, "id">>;
};

/** Every entry, strongest evidence first, then by who published it and when. */
export function referenceList(registry: Registry): Reference[] {
  return Object.entries(registry.references)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort(
      (a, b) =>
        EVIDENCE.indexOf(a.evidence) - EVIDENCE.indexOf(b.evidence) ||
        leadName(a).localeCompare(leadName(b), "en") ||
        a.year - b.year ||
        a.id.localeCompare(b.id, "en"),
    );
}

/** The references under each tracker, in the order given (the bar's), with
 *  trackers that have none left out. A source two trackers rest on is listed
 *  under both. */
export function byTopic(
  refs: Reference[],
  order: readonly FeatureId[],
): { topic: FeatureId; refs: Reference[] }[] {
  return order
    .map((topic) => ({
      topic,
      refs: refs.filter((r) => r.topics.includes(topic)),
    }))
    .filter((group) => group.refs.length > 0);
}

/** The trackers, of those given, with no reference listed under them yet —
 *  the ones whose modules still cite their sources in prose. The Sources
 *  screen names them rather than let a short list pass for a whole one. */
export function unlistedTopics(
  refs: Reference[],
  order: readonly FeatureId[],
): FeatureId[] {
  return order.filter((topic) => !refs.some((r) => r.topics.includes(topic)));
}

/** Who a reference is by: up to three authors, the first and "et al." past
 *  that, or the organization that published it. */
export function byline(ref: Reference): string {
  const authors = ref.authors ?? [];
  if (authors.length === 0) return ref.organization ?? "";
  if (authors.length <= 3) return authors.join(", ");
  return `${authors[0]} et al.`;
}

/** Where it was published, the way a reference list writes it:
 *  `Sleep Medicine Reviews 16(3):213–222`. */
export function publication(ref: Reference): string {
  let out = ref.container ?? "";
  if (ref.volume) {
    out += ` ${ref.volume}`;
    if (ref.issue) out += `(${ref.issue})`;
    if (ref.pages) out += `:${ref.pages}`;
  } else if (ref.pages) {
    out += `, ${ref.pages}`;
  }
  return out.trim();
}

/** Where a reader can open the source: the DOI's resolver when there is a
 *  DOI (it outlives the publisher's URL), else the URL, else nothing — a book
 *  is found by its ISBN. */
export function sourceLink(ref: Reference): string | null {
  if (ref.doi) return `https://doi.org/${ref.doi}`;
  return ref.url ?? null;
}

function leadName(ref: Reference): string {
  return ref.authors?.[0] ?? ref.organization ?? "";
}
