// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The persistence pipeline. `parseDoc` is the trust boundary every read
// crosses — localStorage, a folder, the cloud, imported backups — so what is
// pinned here is its manners with bytes it did not write: keep everything
// readable, drop what is not, and never throw on a shape problem.

import { describe, expect, it } from "vitest";

import { normalizeDoc, parseDoc, serializeDoc } from "../src/app/migrations.ts";
import { DOC_VERSION, emptyDoc } from "../src/app/types.ts";

const CHILD = {
  name: "Elias",
  birthDate: "2026-01-15",
  sex: "male",
  motherHeightCm: 167,
  fatherHeightCm: 182,
  updatedAt: "2026-01-15T10:00:00.000Z",
};

describe("normalizeDoc", () => {
  it("returns an empty document for non-objects", () => {
    expect(normalizeDoc(null)).toEqual(emptyDoc());
    expect(normalizeDoc("nope")).toEqual(emptyDoc());
    expect(normalizeDoc([1, 2])).toEqual(emptyDoc());
  });

  it("keeps a well-formed document intact", () => {
    const doc = normalizeDoc({
      version: DOC_VERSION,
      child: CHILD,
      measurements: {
        a: {
          id: "a",
          date: "2026-03-01",
          weightKg: 5.2,
          lengthCm: null,
          headCm: 39.5,
          updatedAt: "2026-03-01T10:00:00.000Z",
        },
      },
      diapers: {
        d1: { id: "d1", kind: "both", at: "2026-03-01T08:15:00.000Z" },
      },
      foods: {},
      milk: {
        kind: "mixed",
        formulaMlPerDay: 200,
        updatedAt: "2026-03-01T10:00:00.000Z",
      },
      vaccinations: {
        v1: {
          id: "v1",
          doseId: "rota-1",
          date: "2026-02-27",
          vaccineName: "RotaTeq",
          label: "",
          note: "",
          updatedAt: "2026-02-27T10:00:00.000Z",
        },
      },
    });
    expect(doc.child).toEqual(CHILD);
    expect(doc.measurements.a?.headCm).toBe(39.5);
    expect(doc.diapers.d1?.kind).toBe("both");
    expect(doc.milk.formulaMlPerDay).toBe(200);
    expect(doc.vaccinations.v1?.vaccineName).toBe("RotaTeq");
  });

  it("lifts an unversioned document to the current version", () => {
    const doc = normalizeDoc({ child: CHILD });
    expect(doc.version).toBe(DOC_VERSION);
    expect(doc.child).toEqual(CHILD);
  });

  it("drops a child without a birth date or sex", () => {
    expect(
      normalizeDoc({ child: { ...CHILD, birthDate: "soon" } }).child,
    ).toBeNull();
    expect(
      normalizeDoc({ child: { ...CHILD, sex: "other" } }).child,
    ).toBeNull();
  });

  it("drops records that cannot mean anything", () => {
    const doc = normalizeDoc({
      measurements: {
        blank: {
          id: "blank",
          date: "2026-03-01",
          weightKg: null,
          lengthCm: null,
          headCm: null,
        },
        negative: { id: "negative", date: "2026-03-01", weightKg: -1 },
        ok: { id: "ok", date: "2026-03-01", weightKg: 5 },
      },
      diapers: {
        badKind: { id: "badKind", kind: "wet", at: "2026-03-01T08:15:00.000Z" },
        badTime: { id: "badTime", kind: "pee", at: "yesterday" },
        ok: { id: "ok", kind: "pee", at: "2026-03-01T08:15:00.000Z" },
      },
      foods: {
        noKcal: {
          id: "noKcal",
          name: "Mystery",
          amount: 10,
          unit: "g",
          per100: {},
        },
        ok: {
          id: "ok",
          name: "Porridge",
          amount: 150,
          unit: "g",
          per100: { kcal: 104, ironMg: -2, fatG: 3.7 },
        },
      },
      vaccinations: {
        noDose: { id: "noDose", date: "2026-03-01" },
      },
    });
    expect(Object.keys(doc.measurements)).toEqual(["ok"]);
    expect(Object.keys(doc.diapers)).toEqual(["ok"]);
    expect(Object.keys(doc.foods)).toEqual(["ok"]);
    // A negative nutrient is dropped, not zeroed.
    expect(doc.foods.ok?.per100).toEqual({ kcal: 104, fatG: 3.7 });
    expect(Object.keys(doc.vaccinations)).toEqual([]);
  });

  it("falls back to breast milk for an unreadable milk record", () => {
    expect(normalizeDoc({ milk: 7 }).milk.kind).toBe("breast");
    expect(normalizeDoc({ milk: { kind: "goat" } }).milk.kind).toBe("breast");
  });

  it("reads a v1 document's bottles as infant formula", () => {
    // v1 had no `formulaType`, and what it recorded was infant formula's
    // values — so that is what those millilitres keep meaning until the
    // parent says otherwise. Anything unrecognised lands on the same side.
    const doc = normalizeDoc({
      version: 1,
      milk: { kind: "formula", formulaMlPerDay: 600, updatedAt: "" },
    });
    expect(doc.version).toBe(DOC_VERSION);
    expect(doc.milk.formulaType).toBe("infant");
    expect(doc.milk.formulaMlPerDay).toBe(600);
    expect(
      normalizeDoc({ milk: { kind: "formula", formulaType: "goat" } }).milk
        .formulaType,
    ).toBe("infant");
  });

  it("keeps a stated follow-on formula", () => {
    const doc = normalizeDoc({
      version: DOC_VERSION,
      milk: { kind: "mixed", formulaMlPerDay: 400, formulaType: "followOn" },
    });
    expect(doc.milk.formulaType).toBe("followOn");
  });

  it("reads a v2 food as given sometime during the day", () => {
    // v2 had no `Food.times`. An empty list is that claim exactly — the
    // coverage curve spreads such a food across the day rather than inventing
    // a meal for it.
    const doc = normalizeDoc({
      version: 2,
      foods: {
        f: { id: "f", name: "Porridge", amount: 150, per100: { kcal: 104 } },
      },
    });
    expect(doc.version).toBe(DOC_VERSION);
    expect(doc.foods.f!.times).toEqual([]);
  });

  it("keeps, sorts and de-duplicates a food's times, dropping non-times", () => {
    const doc = normalizeDoc({
      version: DOC_VERSION,
      foods: {
        f: {
          id: "f",
          name: "Porridge",
          amount: 150,
          per100: { kcal: 104 },
          times: ["17:00", "08:00", "08:00", "25:00", "8:00", 12, null],
        },
      },
    });
    expect(doc.foods.f!.times).toEqual(["08:00", "17:00"]);
  });

  it("keeps a food whose times are unreadable", () => {
    const doc = normalizeDoc({
      version: DOC_VERSION,
      foods: {
        f: {
          id: "f",
          name: "Porridge",
          amount: 150,
          per100: { kcal: 104 },
          times: "08:00",
        },
      },
    });
    expect(doc.foods.f!.times).toEqual([]);
  });
});

describe("parseDoc / serializeDoc", () => {
  it("round-trip a document with stable, sorted bytes", () => {
    const doc = normalizeDoc({
      child: CHILD,
      diapers: {
        b: { id: "b", kind: "pee", at: "2026-03-01T09:00:00.000Z" },
        a: { id: "a", kind: "poo", at: "2026-03-01T08:00:00.000Z" },
      },
    });
    const text = serializeDoc(doc);
    expect(parseDoc(text)).toEqual(doc);
    expect(text.indexOf('"a"')).toBeLessThan(text.indexOf('"b"'));
  });

  it("throws on malformed JSON so the caller can quarantine it", () => {
    expect(() => parseDoc("{not json")).toThrow();
  });
});
