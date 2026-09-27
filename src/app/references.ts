// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The references: every source the app's numbers and claims rest on, as the
// app reads them.
//
// The registry itself is `docs/references.json` (OSS_SPEC.md §24): one entry
// per source, keyed by the id the code cites as `[ref:<id>]` beside the
// number it supports. The machinery over it — the shape, the evidence
// vocabulary and its ranking, how an entry is cited, the audit that holds
// the file to the tags, the lazy loader and the card — is the framework's
// `references` module, shared with the sibling apps. What is left here is
// what makes it this app's: the entries' `topics` are the trackers, and the
// registry is this repository's file, loaded in a chunk of its own when the
// About screen opens.

import {
  useReferences as useRegistry,
  type Reference as AnyReference,
  type Registry as AnyRegistry,
} from "@niclaslindstedt/oss-framework/references";

import type { FeatureId } from "./useAppSettings.ts";

/** One source, listed under the trackers it serves. */
export type Reference = AnyReference<FeatureId>;

/** `docs/references.json`, as stored. */
export type Registry = AnyRegistry<FeatureId>;

/** The languages every entry's `summary` is written in — the app's own. */
export const SUMMARY_LANGUAGES = ["en", "sv"] as const;

// Module level, so the framework's cache knows it on every mount. Bundled
// with the app like the growth standards, never fetched from anywhere else.
const loadRegistry = () =>
  import("../../docs/references.json").then(
    // The JSON's inferred type widens the vocabularies to `string`;
    // `tests/references_test.ts` is what holds the file to `Registry`.
    (m) => m.default as unknown as Registry,
  );

/** Every reference, strongest evidence first, or `null` until the chunk has
 *  landed. */
export function useReferences(): Reference[] | null {
  return useRegistry(loadRegistry);
}
