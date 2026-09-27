// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The references registry, `docs/references.json`, held to the code that
// cites it. Every threshold in the app cites its source (AGENTS.md, rule
// three); a module does it with a `[ref:<id>]` tag beside the number, and the
// registry carries the full record — who, where, the DOI or URL, the words
// the number was taken from, and how strong the evidence is.
//
// What is pinned: every tag in `src/` names an entry; every entry is cited
// somewhere; each entry's `usedBy` lists exactly the files that cite it; and
// each entry carries enough to find the source again.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

type Reference = {
  evidence: string;
  title: string;
  year: number;
  authors?: string[];
  organization?: string;
  container?: string;
  doi?: string;
  url?: string;
  isbn?: string;
  language: string;
  accessed?: string;
  quotes: { text: string; at?: string }[];
  supports: string;
  usedBy: string[];
};

const root = join(import.meta.dirname, "..");
const registry = JSON.parse(
  readFileSync(join(root, "docs", "references.json"), "utf8"),
) as { references: Record<string, Reference> };
const refs = registry.references;

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
    for (const [, id] of text.matchAll(/\[ref:([a-z0-9-]+)\]/g)) {
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
      expect([
        "guideline",
        "consensus",
        "systematic-review",
        "cohort",
        "review",
        "clinical-study",
        "health-service",
      ]).toContain(ref.evidence);
      expect(ref.supports.length, id).toBeGreaterThan(0);
      expect(ref.quotes.length, id).toBeGreaterThan(0);
      for (const q of ref.quotes) expect(q.text.length, id).toBeGreaterThan(0);
    }
  });
});
