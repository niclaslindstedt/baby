// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The document merge: stamped records (sleeps among them) by last edit,
// diaper changes by union.

import { describe, expect, it } from "vitest";

import { mergeDocs } from "../src/app/merge.ts";
import { emptyDoc, type AppData } from "../src/app/types.ts";

function child(name: string, updatedAt: string): AppData["child"] {
  return {
    name,
    birthDate: "2026-01-15",
    sex: "female",
    motherHeightCm: null,
    fatherHeightCm: null,
    updatedAt,
  };
}

describe("mergeDocs", () => {
  it("keeps the later edit of the child and of each record", () => {
    const local: AppData = {
      ...emptyDoc(),
      child: child("Alva", "2026-02-01T00:00:00.000Z"),
      foods: {
        f: {
          id: "f",
          name: "Porridge",
          amount: 100,
          unit: "g",
          per100: { kcal: 104 },
          times: [],
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      },
    };
    const remote: AppData = {
      ...emptyDoc(),
      child: child("Alva Maria", "2026-02-02T00:00:00.000Z"),
      foods: {
        f: {
          id: "f",
          name: "Porridge",
          amount: 150,
          unit: "g",
          per100: { kcal: 104 },
          times: [],
          updatedAt: "2026-02-20T00:00:00.000Z",
        },
        g: {
          id: "g",
          name: "Egg",
          amount: 30,
          unit: "g",
          per100: { kcal: 136 },
          times: [],
          updatedAt: "2026-02-20T00:00:00.000Z",
        },
      },
    };
    const merged = mergeDocs(local, remote);
    expect(merged.child?.name).toBe("Alva Maria");
    expect(merged.foods.f?.amount).toBe(100);
    expect(merged.foods.g?.name).toBe("Egg");
  });

  it("unions diaper changes and keeps the only child there is", () => {
    const local: AppData = {
      ...emptyDoc(),
      diapers: { a: { id: "a", kind: "pee", at: "2026-03-01T08:00:00.000Z" } },
    };
    const remote: AppData = {
      ...emptyDoc(),
      child: child("Alva", "2026-02-01T00:00:00.000Z"),
      diapers: { b: { id: "b", kind: "poo", at: "2026-03-01T09:00:00.000Z" } },
    };
    const merged = mergeDocs(local, remote);
    expect(Object.keys(merged.diapers).sort()).toEqual(["a", "b"]);
    expect(merged.child?.name).toBe("Alva");
  });

  it("takes the device that ended a sleep over the one still showing it open", () => {
    const start = "2026-03-01T18:30:00.000Z";
    const open: AppData = {
      ...emptyDoc(),
      sleeps: {
        s: { id: "s", kind: "night", start, end: null, updatedAt: start },
      },
    };
    const ended: AppData = {
      ...emptyDoc(),
      sleeps: {
        s: {
          id: "s",
          kind: "night",
          start,
          end: "2026-03-02T05:10:00.000Z",
          updatedAt: "2026-03-02T05:10:00.000Z",
        },
        n: {
          id: "n",
          kind: "nap",
          start: "2026-03-02T08:00:00.000Z",
          end: null,
          updatedAt: "2026-03-02T08:00:00.000Z",
        },
      },
    };
    for (const merged of [mergeDocs(open, ended), mergeDocs(ended, open)]) {
      expect(merged.sleeps.s?.end).toBe("2026-03-02T05:10:00.000Z");
      expect(Object.keys(merged.sleeps).sort()).toEqual(["n", "s"]);
    }
  });

  it("agrees on content whichever side is local", () => {
    const a: AppData = {
      ...emptyDoc(),
      milk: {
        kind: "formula",
        formulaMlPerDay: 700,
        formulaType: "infant",
        updatedAt: "2026-03-05T00:00:00.000Z",
      },
    };
    const b: AppData = {
      ...emptyDoc(),
      milk: {
        kind: "breast",
        formulaMlPerDay: null,
        formulaType: "infant",
        updatedAt: "2026-03-01T00:00:00.000Z",
      },
    };
    expect(mergeDocs(a, b).milk.kind).toBe("formula");
    expect(mergeDocs(b, a).milk.kind).toBe("formula");
  });
});
