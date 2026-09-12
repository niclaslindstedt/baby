// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The Swedish childhood vaccination programme, and where the child is on it.
//
// The schedule is data: every dose of the general programme
// ("allmänna vaccinationsprogrammet för barn", Folkhälsomyndigheten) as a
// row with the age it is given at, plus the vaccinations offered outside the
// programme — to risk groups, to a region's newborns, or as a self-paid
// extra — so a parent can record those too without them muddling the
// programme's own timeline.
//
// What the app derives from it is a timeline for one child: each programme
// dose with its expected date (from the birth date), whether it has been
// recorded as given, and if not whether it is upcoming or already due. That
// is the whole of what the Vaccinations screen shows. The app does not
// decide anything — the child health centre calls the family in; the
// timeline is there so the parent knows what the appointment is for and what
// comes after it.
//
// Sources, as of September 2026:
//   - Folkhälsomyndigheten, "Barnvaccinationsprogram" (table updated
//     2026-04-16): 6 veckor · 3 månader · 5 månader · 12 månader · 18 månader
//     · 5 år · årskurs 1–2 · årskurs 5 · årskurs 8–9.
//   - 1177.se, "Vaccinationsprogrammet för barn" (2025-11-18).
//   - Rotavirus: three oral doses at 6 weeks, 3 and 5 months (RotaTeq, the
//     nationally procured product since September 2023).
//   - Hepatit B: not formally in the national programme, but recommended by
//     Folkhälsomyndigheten and offered free by every region as part of the
//     hexavalent shot at 3, 5 and 12 months — so it is listed with the
//     programme, where a parent will see it on the vaccination card.
//   - Vattkoppor (varicella) joins the general programme on 1 January 2027
//     for children born from 1 July 2025: two doses, with MPR at 18 months
//     and in årskurs 1–2. Until then it is a self-paid extra from 12 months.
//
// Pure and clock-free: `today` is a parameter.

import {
  addDays,
  addMonths,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import { sortedVaccinations, type AppData, type Vaccination } from "./types.ts";

/** The diseases the programme covers, as catalog keys for the i18n layer. */
export type Disease =
  | "diphtheria"
  | "tetanus"
  | "pertussis"
  | "polio"
  | "hib"
  | "hepatitisB"
  | "pneumococcus"
  | "rotavirus"
  | "measles"
  | "mumps"
  | "rubella"
  | "hpv"
  | "varicella"
  | "tuberculosis"
  | "influenza"
  | "tbe"
  | "rsv"
  | "meningococcus";

/** When a dose is given: at an age from birth, or in a school year. */
export type DoseTiming =
  | { kind: "weeks"; weeks: number }
  | { kind: "months"; months: number }
  | { kind: "years"; years: number }
  /** A school year. The date is the autumn term of the calendar year the
   *  child turns `turnsAge` — årskurs 1 starts the year a child turns 7. */
  | { kind: "school"; grade: string; turnsAge: number };

export type VaccineGroup =
  "dtp" | "pneumococcal" | "rotavirus" | "mpr" | "hpv" | "varicella";

/** One dose of the general programme. */
export type ProgrammeDose = {
  id: string;
  group: VaccineGroup;
  /** Which dose in its series this is. */
  doseNumber: number;
  diseases: Disease[];
  timing: DoseTiming;
  where: "bvc" | "school";
  route: "injection" | "oral";
  /** A note the screen shows under the row, as an i18n key. */
  note?: "rotavirusThird" | "hepatitisBRegional" | "hpvGrade";
  /** Only children born on or after this day get the row — for a vaccine
   *  that entered the programme for a cohort. */
  bornFrom?: DayKey;
  /** The row only exists from this day on — for a vaccine whose entry into
   *  the programme is dated. */
  from?: DayKey;
};

const born2025 = "2025-07-01";
const varicellaStart = "2027-01-01";

export const PROGRAMME: ProgrammeDose[] = [
  {
    id: "rota-1",
    group: "rotavirus",
    doseNumber: 1,
    diseases: ["rotavirus"],
    timing: { kind: "weeks", weeks: 6 },
    where: "bvc",
    route: "oral",
  },
  {
    id: "dtp-1",
    group: "dtp",
    doseNumber: 1,
    diseases: [
      "diphtheria",
      "tetanus",
      "pertussis",
      "polio",
      "hib",
      "hepatitisB",
    ],
    timing: { kind: "months", months: 3 },
    where: "bvc",
    route: "injection",
    note: "hepatitisBRegional",
  },
  {
    id: "pcv-1",
    group: "pneumococcal",
    doseNumber: 1,
    diseases: ["pneumococcus"],
    timing: { kind: "months", months: 3 },
    where: "bvc",
    route: "injection",
  },
  {
    id: "rota-2",
    group: "rotavirus",
    doseNumber: 2,
    diseases: ["rotavirus"],
    timing: { kind: "months", months: 3 },
    where: "bvc",
    route: "oral",
  },
  {
    id: "dtp-2",
    group: "dtp",
    doseNumber: 2,
    diseases: [
      "diphtheria",
      "tetanus",
      "pertussis",
      "polio",
      "hib",
      "hepatitisB",
    ],
    timing: { kind: "months", months: 5 },
    where: "bvc",
    route: "injection",
  },
  {
    id: "pcv-2",
    group: "pneumococcal",
    doseNumber: 2,
    diseases: ["pneumococcus"],
    timing: { kind: "months", months: 5 },
    where: "bvc",
    route: "injection",
  },
  {
    id: "rota-3",
    group: "rotavirus",
    doseNumber: 3,
    diseases: ["rotavirus"],
    timing: { kind: "months", months: 5 },
    where: "bvc",
    route: "oral",
    note: "rotavirusThird",
  },
  {
    id: "dtp-3",
    group: "dtp",
    doseNumber: 3,
    diseases: [
      "diphtheria",
      "tetanus",
      "pertussis",
      "polio",
      "hib",
      "hepatitisB",
    ],
    timing: { kind: "months", months: 12 },
    where: "bvc",
    route: "injection",
  },
  {
    id: "pcv-3",
    group: "pneumococcal",
    doseNumber: 3,
    diseases: ["pneumococcus"],
    timing: { kind: "months", months: 12 },
    where: "bvc",
    route: "injection",
  },
  {
    id: "mpr-1",
    group: "mpr",
    doseNumber: 1,
    diseases: ["measles", "mumps", "rubella"],
    timing: { kind: "months", months: 18 },
    where: "bvc",
    route: "injection",
  },
  {
    id: "var-1",
    group: "varicella",
    doseNumber: 1,
    diseases: ["varicella"],
    timing: { kind: "months", months: 18 },
    where: "bvc",
    route: "injection",
    bornFrom: born2025,
    from: varicellaStart,
  },
  {
    id: "dtp-4",
    group: "dtp",
    doseNumber: 4,
    diseases: ["diphtheria", "tetanus", "pertussis", "polio"],
    timing: { kind: "years", years: 5 },
    where: "bvc",
    route: "injection",
  },
  {
    id: "mpr-2",
    group: "mpr",
    doseNumber: 2,
    diseases: ["measles", "mumps", "rubella"],
    timing: { kind: "school", grade: "1–2", turnsAge: 7 },
    where: "school",
    route: "injection",
  },
  {
    id: "var-2",
    group: "varicella",
    doseNumber: 2,
    diseases: ["varicella"],
    timing: { kind: "school", grade: "1–2", turnsAge: 7 },
    where: "school",
    route: "injection",
    bornFrom: born2025,
    from: varicellaStart,
  },
  {
    id: "hpv-1",
    group: "hpv",
    doseNumber: 1,
    diseases: ["hpv"],
    timing: { kind: "school", grade: "5", turnsAge: 11 },
    where: "school",
    route: "injection",
    note: "hpvGrade",
  },
  {
    id: "hpv-2",
    group: "hpv",
    doseNumber: 2,
    diseases: ["hpv"],
    timing: { kind: "school", grade: "5", turnsAge: 11 },
    where: "school",
    route: "injection",
    note: "hpvGrade",
  },
  {
    id: "dtp-5",
    group: "dtp",
    doseNumber: 5,
    diseases: ["diphtheria", "tetanus", "pertussis"],
    timing: { kind: "school", grade: "8–9", turnsAge: 14 },
    where: "school",
    route: "injection",
  },
];

/** A vaccination offered outside the general programme — to a risk group,
 *  by a region, or as a self-paid extra. Listed so it can be recorded and
 *  so the parent can see what exists; never scheduled, never "due". */
export type ExtraVaccine = {
  id: string;
  diseases: Disease[];
  /** The typical age, as an i18n key the screen phrases. */
  typicalAge:
    | "birth"
    | "sixWeeks"
    | "sixMonths"
    | "twelveMonths"
    | "oneYear"
    | "threeYears"
    | "season";
  /** Who it is for, as an i18n key. */
  offer: "riskGroup" | "regional" | "optional" | "programmeFrom2027";
};

export const EXTRAS: ExtraVaccine[] = [
  {
    id: "bcg",
    diseases: ["tuberculosis"],
    typicalAge: "sixWeeks",
    offer: "riskGroup",
  },
  {
    id: "hepb-birth",
    diseases: ["hepatitisB"],
    typicalAge: "birth",
    offer: "riskGroup",
  },
  { id: "rsv", diseases: ["rsv"], typicalAge: "birth", offer: "regional" },
  {
    id: "influenza",
    diseases: ["influenza"],
    typicalAge: "season",
    offer: "riskGroup",
  },
  {
    id: "varicella-extra",
    diseases: ["varicella"],
    typicalAge: "twelveMonths",
    offer: "programmeFrom2027",
  },
  { id: "tbe", diseases: ["tbe"], typicalAge: "threeYears", offer: "optional" },
  {
    id: "meningococcal",
    diseases: ["meningococcus"],
    typicalAge: "sixWeeks",
    offer: "riskGroup",
  },
  {
    id: "pneumococcal-extra",
    diseases: ["pneumococcus"],
    typicalAge: "oneYear",
    offer: "riskGroup",
  },
];

/** The day a dose is expected, from the birth date. School doses land on
 *  15 August of the year the child turns the grade's age — the autumn term's
 *  start, near enough for a row a parent reads years ahead. */
export function dueDate(birthDate: DayKey, timing: DoseTiming): DayKey {
  switch (timing.kind) {
    case "weeks":
      return addDays(birthDate, timing.weeks * 7);
    case "months":
      return addMonths(birthDate, timing.months);
    case "years":
      return addMonths(birthDate, timing.years * 12);
    case "school": {
      const year = Number(birthDate.slice(0, 4)) + timing.turnsAge;
      return `${year}-08-15`;
    }
  }
}

/** Where one programme dose stands for this child. */
export type DoseStatus = "given" | "due" | "upcoming";

export type TimelineEntry = {
  dose: ProgrammeDose;
  due: DayKey;
  status: DoseStatus;
  /** The record that fulfilled it, when given. */
  record: Vaccination | null;
};

/** Whether a programme row applies to this child, today. */
export function doseApplies(
  dose: ProgrammeDose,
  birthDate: DayKey,
  today: DayKey,
): boolean {
  if (dose.bornFrom && birthDate < dose.bornFrom) return false;
  if (dose.from && today < dose.from) return false;
  return true;
}

/**
 * The child's timeline: every applicable programme dose, in schedule order,
 * with its expected date and whether it has been recorded.
 *
 * A dose is *due* once its expected date has passed with nothing recorded.
 * There is no "overdue" grade — the child health centre works to windows the
 * app does not know, and a row that turns red a day late would only alarm.
 */
export function timeline(data: AppData, today: DayKey): TimelineEntry[] {
  const child = data.child;
  if (!child) return [];
  const records = new Map<string, Vaccination>();
  for (const v of sortedVaccinations(data)) {
    // The earliest record for a dose is the one that fulfilled it.
    if (!records.has(v.doseId)) records.set(v.doseId, v);
  }
  return PROGRAMME.filter((dose) =>
    doseApplies(dose, child.birthDate, today),
  ).map((dose) => {
    const due = dueDate(child.birthDate, dose.timing);
    const record = records.get(dose.id) ?? null;
    return {
      dose,
      due,
      record,
      status: record ? "given" : due <= today ? "due" : "upcoming",
    };
  });
}

/** The next dose not yet given — the one line the Today screen quotes. */
export function nextDose(entries: TimelineEntry[]): TimelineEntry | null {
  return entries.find((e) => e.status !== "given") ?? null;
}

/** Records that point at no programme dose — the extras and the "other"
 *  vaccinations, listed separately from the timeline. */
export function extraRecords(data: AppData): Vaccination[] {
  const programmeIds = new Set(PROGRAMME.map((d) => d.id));
  return sortedVaccinations(data).filter((v) => !programmeIds.has(v.doseId));
}

/** The extra-vaccine catalog entry a record points at, if any. */
export function extraFor(doseId: string): ExtraVaccine | null {
  return EXTRAS.find((e) => e.id === doseId) ?? null;
}
