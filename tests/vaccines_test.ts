// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The vaccination timeline: the programme's doses at their expected dates for
// one child, and which of them a record fulfils.

import { describe, expect, it } from "vitest";

import { emptyDoc, type AppData, type Vaccination } from "../src/app/types.ts";
import {
  doseApplies,
  dueDate,
  extraRecords,
  nextDose,
  PROGRAMME,
  timeline,
} from "../src/app/vaccines.ts";

function docWith(records: Vaccination[], birthDate = "2026-01-15"): AppData {
  return {
    ...emptyDoc(),
    child: {
      name: "",
      birthDate,
      sex: "male",
      motherHeightCm: null,
      fatherHeightCm: null,
      updatedAt: "",
    },
    vaccinations: Object.fromEntries(records.map((v) => [v.id, v])),
  };
}

function given(doseId: string, date: string): Vaccination {
  return {
    id: `v-${doseId}`,
    doseId,
    date,
    vaccineName: "",
    label: "",
    note: "",
    updatedAt: `${date}T10:00:00.000Z`,
  };
}

describe("the programme", () => {
  it("has the Folkhälsomyndigheten ages", () => {
    const ages = Object.fromEntries(PROGRAMME.map((d) => [d.id, d.timing]));
    expect(ages["rota-1"]).toEqual({ kind: "weeks", weeks: 6 });
    expect(ages["dtp-1"]).toEqual({ kind: "months", months: 3 });
    expect(ages["dtp-2"]).toEqual({ kind: "months", months: 5 });
    expect(ages["dtp-3"]).toEqual({ kind: "months", months: 12 });
    expect(ages["mpr-1"]).toEqual({ kind: "months", months: 18 });
    expect(ages["dtp-4"]).toEqual({ kind: "years", years: 5 });
    expect(ages["mpr-2"]).toEqual({
      kind: "school",
      grade: "1–2",
      turnsAge: 7,
    });
    expect(ages["hpv-1"]).toEqual({ kind: "school", grade: "5", turnsAge: 11 });
    expect(ages["dtp-5"]).toEqual({
      kind: "school",
      grade: "8–9",
      turnsAge: 14,
    });
  });

  it("gives every dose a unique id", () => {
    const ids = PROGRAMME.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("dueDate", () => {
  it("counts weeks, calendar months and school autumns from the birth date", () => {
    expect(dueDate("2026-01-15", { kind: "weeks", weeks: 6 })).toBe(
      "2026-02-26",
    );
    expect(dueDate("2026-01-15", { kind: "months", months: 3 })).toBe(
      "2026-04-15",
    );
    expect(dueDate("2026-01-31", { kind: "months", months: 1 })).toBe(
      "2026-02-28",
    );
    expect(dueDate("2026-01-15", { kind: "years", years: 5 })).toBe(
      "2031-01-15",
    );
    expect(
      dueDate("2026-01-15", { kind: "school", grade: "1–2", turnsAge: 7 }),
    ).toBe("2033-08-15");
  });
});

describe("doseApplies", () => {
  it("gates varicella on the cohort and the programme's start", () => {
    const var1 = PROGRAMME.find((d) => d.id === "var-1")!;
    expect(doseApplies(var1, "2026-01-15", "2026-09-12")).toBe(false);
    expect(doseApplies(var1, "2026-01-15", "2027-01-01")).toBe(true);
    expect(doseApplies(var1, "2025-06-30", "2027-06-01")).toBe(false);
    const dtp1 = PROGRAMME.find((d) => d.id === "dtp-1")!;
    expect(doseApplies(dtp1, "2020-01-01", "2026-09-12")).toBe(true);
  });
});

describe("timeline", () => {
  it("marks given, due and upcoming doses for the child's age", () => {
    const data = docWith([
      given("rota-1", "2026-02-27"),
      given("dtp-1", "2026-04-16"),
      given("pcv-1", "2026-04-16"),
      given("rota-2", "2026-04-16"),
    ]);
    const entries = timeline(data, "2026-09-12");
    const byId = Object.fromEntries(entries.map((e) => [e.dose.id, e]));
    expect(byId["rota-1"]!.status).toBe("given");
    expect(byId["dtp-1"]!.status).toBe("given");
    // Five-month doses were due 15 June and are not recorded.
    expect(byId["dtp-2"]!.status).toBe("due");
    expect(byId["dtp-2"]!.due).toBe("2026-06-15");
    expect(byId["dtp-3"]!.status).toBe("upcoming");
    expect(byId["dtp-3"]!.due).toBe("2027-01-15");
    // Varicella is not in the timeline before 2027.
    expect(byId["var-1"]).toBeUndefined();
  });

  it("names the first dose not yet given as next", () => {
    const data = docWith([given("rota-1", "2026-02-27")]);
    const next = nextDose(timeline(data, "2026-03-01"))!;
    expect(next.dose.id).toBe("dtp-1");
    expect(next.status).toBe("upcoming");
  });

  it("is empty without a child", () => {
    expect(timeline(emptyDoc(), "2026-09-12")).toEqual([]);
  });
});

describe("extraRecords", () => {
  it("lists records that point outside the programme", () => {
    const data = docWith([
      given("dtp-1", "2026-04-16"),
      given("bcg", "2026-03-01"),
      given("other", "2026-08-01"),
    ]);
    expect(extraRecords(data).map((v) => v.doseId)).toEqual(["bcg", "other"]);
  });
});
