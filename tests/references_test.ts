// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The references registry, `docs/references.json`, held to the code that
// cites it. Every threshold in the app cites its source (AGENTS.md, rule
// three); a module does it with a `[ref:<id>]` tag beside the number, and the
// registry carries the full record — who, where, the DOI or URL, the words
// the number was taken from, and how strong the evidence is. OSS_SPEC.md §24
// asks for the same, and `oss-spec validate` checks it too; this test is the
// one a contributor sees first.
//
// The rules are the framework's `auditReferences`: every tag in `src/` names
// an entry; every entry is cited somewhere; each entry's `usedBy` lists
// exactly the files that cite it; each entry carries enough to find the
// source again — plus this app's own fields, a parent's line in both
// languages and a tracker to list it under. Below that, the list the About
// screen shows is pinned against the real entries.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  auditReferences,
  byline,
  byTopic,
  evidenceRank,
  publication,
  referenceList,
  sourceLink,
  unlistedTopics,
} from "@niclaslindstedt/oss-framework/references";

import { SUMMARY_LANGUAGES, type Registry } from "../src/app/references.ts";
import { FEATURES } from "../src/app/useAppSettings.ts";

const root = join(import.meta.dirname, "..");
const registry = JSON.parse(
  readFileSync(join(root, "docs", "references.json"), "utf8"),
) as Registry;

/** Every source file under `src/`, as repo-relative path → text. */
function sources(dir = join(root, "src")): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) Object.assign(out, sources(path));
    else if (/\.(ts|tsx)$/.test(name)) {
      out[relative(root, path)] = readFileSync(path, "utf8");
    }
  }
  return out;
}

describe("the references registry", () => {
  it("agrees with the [ref:…] tags in the code, and every entry is complete", () => {
    expect(
      auditReferences(registry, sources(), {
        languages: SUMMARY_LANGUAGES,
        topics: FEATURES,
      }),
    ).toEqual([]);
  });

  it("quotes sources in the app's own languages", () => {
    for (const [id, ref] of Object.entries(registry.references)) {
      expect(SUMMARY_LANGUAGES, id).toContain(ref.language);
    }
  });
});

describe("the references, as the Sources screen lists them", () => {
  const list = referenceList(registry);

  it("lists every entry once, strongest evidence first", () => {
    expect(list.map((r) => r.id).sort()).toEqual(
      Object.keys(registry.references).sort(),
    );
    const ranks = list.map((r) => evidenceRank(r.evidence));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    // A guideline leads; the health services' pages come last.
    expect(list[0]!.evidence).toBe("guideline");
    expect(list.at(-1)!.evidence).toBe("health-service");
  });

  it("ranks within a kind by who published it, then when", () => {
    const consensus = list.filter((r) => r.evidence === "consensus");
    expect(consensus.map((r) => r.id)).toEqual([
      "hirshkowitz-2015",
      "paruthi-2016",
    ]);
  });

  it("groups by tracker in the bar's order, with every tracker listed", () => {
    const groups = byTopic(list, FEATURES);
    expect(groups.map((g) => g.topic)).toEqual([...FEATURES]);
    expect(unlistedTopics(list, FEATURES)).toEqual([]);
  });

  it("cites a paper by its authors and journal, and links its DOI", () => {
    const galland = list.find((r) => r.id === "galland-2012")!;
    expect(byline(galland)).toBe("Galland BC et al.");
    expect(publication(galland)).toBe("Sleep Medicine Reviews 16(3):213–222");
    expect(sourceLink(galland)).toBe(
      "https://doi.org/10.1016/j.smrv.2011.06.001",
    );
  });

  it("cites a health service by its organization, and links its page", () => {
    const fhm = list.find((r) => r.id === "fohm-2026-somnvanor")!;
    expect(byline(fhm)).toBe("Folkhälsomyndigheten");
    expect(publication(fhm)).toBe("Folkhälsomyndigheten (art.nr 26026)");
    expect(sourceLink(fhm)).toBe(fhm.url);
  });
});
