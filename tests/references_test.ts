// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The references registry, `docs/references.json`, held to the code that
// cites it. Every threshold in the app cites its source (AGENTS.md, rule
// three); a module does it with a `[ref:<id>]` tag beside the number, and the
// registry carries the full record — who, where, the DOI or URL, the words
// the number was taken from, and how strong the evidence is. OSS_SPEC.md §24
// asks for the same, and `oss-spec validate` checks it too; this test is the
// one a contributor sees first.
//
// What is pinned: every tag in `src/` names an entry; every entry is cited
// somewhere; each entry's `usedBy` lists exactly the files that cite it; each
// entry carries enough to find the source again, and the app's own fields
// the Sources screen reads; and `references.ts` lists and cites them the way
// that screen shows them.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  byline,
  byTopic,
  CITATION_TAG,
  EVIDENCE,
  publication,
  referenceList,
  sourceLink,
  unlistedTopics,
  type Registry,
} from "../src/app/references.ts";

const root = join(import.meta.dirname, "..");
const registry = JSON.parse(
  readFileSync(join(root, "docs", "references.json"), "utf8"),
) as Registry;
const refs = registry.references;
const TRACKERS = ["diapers", "sleep", "growth", "food", "vaccines"] as const;

/** Every source file under `src/`, as a repo-relative path. */
function sourceFiles(dir = join(root, "src")): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(ts|tsx)$/.test(name)) out.push(relative(root, path));
  }
  return out;
}

/** Which files cite which ids. */
function citations(): Map<string, Set<string>> {
  const byId = new Map<string, Set<string>>();
  for (const file of sourceFiles()) {
    const text = readFileSync(join(root, file), "utf8");
    for (const [, id] of text.matchAll(CITATION_TAG)) {
      if (!byId.has(id!)) byId.set(id!, new Set());
      byId.get(id!)!.add(file);
    }
  }
  return byId;
}

describe("the references registry", () => {
  const cited = citations();

  it("has an entry for every [ref:…] tag in the code", () => {
    const missing = [...cited.keys()].filter((id) => !(id in refs));
    expect(missing).toEqual([]);
  });

  it("cites every entry somewhere, and says where", () => {
    for (const [id, ref] of Object.entries(refs)) {
      const files = [...(cited.get(id) ?? [])].sort();
      expect({ id, usedBy: [...ref.usedBy].sort() }).toEqual({
        id,
        usedBy: files,
      });
      expect(files.length).toBeGreaterThan(0);
    }
  });

  it("carries enough of each source to find it again", () => {
    for (const [id, ref] of Object.entries(refs)) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(ref.title.length, id).toBeGreaterThan(0);
      expect(Number.isInteger(ref.year), id).toBe(true);
      expect(ref.authors?.length || ref.organization, id).toBeTruthy();
      expect(ref.doi || ref.url || ref.isbn, id).toBeTruthy();
      if (ref.doi) expect(ref.doi, id).toMatch(/^10\.\d{4,}\/\S+$/);
      if (ref.url) expect(ref.url, id).toMatch(/^https:\/\//);
      if (ref.accessed) {
        expect(ref.accessed, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(["en", "sv"]).toContain(ref.language);
      expect(EVIDENCE).toContain(ref.evidence);
      expect(ref.supports.length, id).toBeGreaterThan(0);
      expect(ref.quotes.length, id).toBeGreaterThan(0);
      for (const q of ref.quotes) expect(q.text.length, id).toBeGreaterThan(0);
    }
  });

  it("gives the Sources screen a line for a parent in both languages, and a tracker", () => {
    for (const [id, ref] of Object.entries(refs)) {
      expect(ref.summary.en.trim().length, id).toBeGreaterThan(0);
      expect(ref.summary.sv.trim().length, id).toBeGreaterThan(0);
      expect(ref.topics.length, id).toBeGreaterThan(0);
      for (const topic of ref.topics) expect(TRACKERS, id).toContain(topic);
    }
  });
});

describe("the references, as the Sources screen lists them", () => {
  const list = referenceList(registry);

  it("lists every entry once, strongest evidence first", () => {
    expect(list.map((r) => r.id).sort()).toEqual(Object.keys(refs).sort());
    const ranks = list.map((r) => EVIDENCE.indexOf(r.evidence));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    // The WHO guideline leads; the health services' pages come last.
    expect(list[0]!.id).toBe("who-2019-under5");
    expect(list.at(-1)!.evidence).toBe("health-service");
  });

  it("ranks within a kind by who published it, then when", () => {
    const consensus = list.filter((r) => r.evidence === "consensus");
    expect(consensus.map((r) => r.id)).toEqual([
      "hirshkowitz-2015",
      "paruthi-2016",
    ]);
  });

  it("groups by tracker in the bar's order, and names the trackers still to come", () => {
    const groups = byTopic(list, TRACKERS);
    expect(groups.map((g) => g.topic)).toEqual(["sleep"]);
    expect(groups[0]!.refs).toHaveLength(list.length);
    expect(unlistedTopics(list, TRACKERS)).toEqual([
      "diapers",
      "growth",
      "food",
      "vaccines",
    ]);
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

  it("lists up to three authors in full", () => {
    const paper = { ...list.find((r) => r.id === "galland-2012")! };
    paper.authors = ["Paruthi S", "Brooks LJ", "D'Ambrosio C"];
    expect(byline(paper)).toBe("Paruthi S, Brooks LJ, D'Ambrosio C");
  });
});
