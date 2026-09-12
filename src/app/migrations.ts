// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The persistence pipeline: raw JSON in, a validated `AppData` out, and back.
// Every read — from localStorage, from a cloud backend, from an imported
// backup file — goes through `parseDoc`, so no other module has to trust the
// bytes it was handed.
//
// The framework owns the migration *runner* (`createMigrator`); this module
// owns the step table and the shape validation. Adding a schema change means
// bumping `DOC_VERSION` in `types.ts` and appending one step here — never
// editing an existing step, which would silently rewrite documents that
// already migrated through it. v1 is the first published shape.

import { createMigrator } from "@niclaslindstedt/oss-framework/storage";

import {
  defaultMilk,
  DOC_VERSION,
  emptyDoc,
  NUTRIENT_KEYS,
  type AppData,
  type Child,
  type DiaperChange,
  type Food,
  type Measurement,
  type MilkFeeding,
  type Nutrients,
  type Vaccination,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const EPOCH = new Date(0).toISOString();

function parseTimestamp(value: unknown): string {
  return typeof value === "string" ? value : EPOCH;
}

/** A `YYYY-MM-DD` day, or null. The shape check only — a "2026-02-31" is a
 *  day the calendar helpers refuse later, and refusing it here would drop a
 *  whole record for a typo the form never lets through anyway. */
function parseDay(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;
}

/** A finite, non-negative number, or null. Measurements and nutrients are
 *  all quantities; a negative one is a typo, not a reading. */
function parseQuantity(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

/** Coerce the stored child profile, or null when it can't be one. A child
 *  needs a birth date and a sex — the two facts every derivation reads. */
function parseChild(value: unknown): Child | null {
  if (!isRecord(value)) return null;
  const birthDate = parseDay(value.birthDate);
  if (birthDate === null) return null;
  const sex = value.sex === "male" || value.sex === "female" ? value.sex : null;
  if (sex === null) return null;
  return {
    name: typeof value.name === "string" ? value.name.trim() : "",
    birthDate,
    sex,
    motherHeightCm: parseQuantity(value.motherHeightCm),
    fatherHeightCm: parseQuantity(value.fatherHeightCm),
    updatedAt: parseTimestamp(value.updatedAt),
  };
}

/** Coerce one stored measurement, or drop it when it carries no reading at
 *  all — a row with a date and three blanks says nothing. */
function parseMeasurement(id: string, value: unknown): Measurement | null {
  if (!isRecord(value)) return null;
  const date = parseDay(value.date);
  if (date === null) return null;
  const weightKg = parseQuantity(value.weightKg);
  const lengthCm = parseQuantity(value.lengthCm);
  const headCm = parseQuantity(value.headCm);
  if (weightKg === null && lengthCm === null && headCm === null) return null;
  return {
    id: typeof value.id === "string" ? value.id : id,
    date,
    weightKg,
    lengthCm,
    headCm,
    updatedAt: parseTimestamp(value.updatedAt),
  };
}

function parseDiaper(id: string, value: unknown): DiaperChange | null {
  if (!isRecord(value)) return null;
  const kind =
    value.kind === "pee" || value.kind === "poo" || value.kind === "both"
      ? value.kind
      : null;
  if (kind === null) return null;
  if (typeof value.at !== "string" || Number.isNaN(Date.parse(value.at))) {
    return null;
  }
  return {
    id: typeof value.id === "string" ? value.id : id,
    kind,
    at: value.at,
  };
}

/** Coerce a nutrient block. Calories are required (a food without them
 *  cannot take part in the one comparison every regimen is asked for);
 *  everything else is kept only when it is a real quantity, so "not
 *  entered" survives as absence rather than turning into zero. */
function parseNutrients(value: unknown): Nutrients | null {
  if (!isRecord(value)) return null;
  const kcal = parseQuantity(value.kcal);
  if (kcal === null) return null;
  const out: Nutrients = { kcal };
  for (const key of NUTRIENT_KEYS) {
    if (key === "kcal") continue;
    const q = parseQuantity(value[key]);
    if (q !== null) out[key] = q;
  }
  return out;
}

function parseFood(id: string, value: unknown): Food | null {
  if (!isRecord(value)) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const amount = parseQuantity(value.amount);
  const per100 = parseNutrients(value.per100);
  if (name === "" || amount === null || per100 === null) return null;
  return {
    id: typeof value.id === "string" ? value.id : id,
    name,
    amount,
    unit: value.unit === "ml" ? "ml" : "g",
    per100,
    updatedAt: parseTimestamp(value.updatedAt),
  };
}

function parseMilk(value: unknown): MilkFeeding {
  if (!isRecord(value)) return defaultMilk();
  const kind =
    value.kind === "breast" ||
    value.kind === "formula" ||
    value.kind === "mixed" ||
    value.kind === "none"
      ? value.kind
      : "breast";
  return {
    kind,
    formulaMlPerDay: parseQuantity(value.formulaMlPerDay),
    updatedAt: parseTimestamp(value.updatedAt),
  };
}

function parseVaccination(id: string, value: unknown): Vaccination | null {
  if (!isRecord(value)) return null;
  const date = parseDay(value.date);
  const doseId = typeof value.doseId === "string" ? value.doseId : "";
  if (date === null || doseId === "") return null;
  return {
    id: typeof value.id === "string" ? value.id : id,
    doseId,
    date,
    vaccineName: typeof value.vaccineName === "string" ? value.vaccineName : "",
    label: typeof value.label === "string" ? value.label : "",
    note: typeof value.note === "string" ? value.note : "",
    updatedAt: parseTimestamp(value.updatedAt),
  };
}

const migrator = createMigrator({
  latestVersion: DOC_VERSION,
  migrations: {
    // v0 → v1: documents that predate versioning (the runner reads a missing
    // `version` as 0) carry the v1 shape already — this step exists so the
    // stored number moves and later steps have a floor to build on.
    0: (doc) => ({ ...doc, version: 1 }),
  },
});

function parseMap<T>(
  raw: unknown,
  parse: (id: string, value: unknown) => T | null,
  idOf: (item: T) => string,
): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isRecord(raw)) return out;
  for (const [id, value] of Object.entries(raw)) {
    const item = parse(id, value);
    if (item) out[idOf(item)] = item;
  }
  return out;
}

/** Validate and normalise an arbitrary parsed value into an `AppData`. Used
 *  by both `parseDoc` and the Settings import flow, which has already turned
 *  a picked file into JSON. */
export function normalizeDoc(value: unknown): AppData {
  if (!isRecord(value)) return emptyDoc();
  const { data } = migrator.migrate(value);
  const migrated = data as unknown as Record<string, unknown>;
  const idOf = (item: { id: string }) => item.id;
  return {
    version: DOC_VERSION,
    child: parseChild(migrated.child),
    measurements: parseMap(migrated.measurements, parseMeasurement, idOf),
    diapers: parseMap(migrated.diapers, parseDiaper, idOf),
    foods: parseMap(migrated.foods, parseFood, idOf),
    milk: parseMilk(migrated.milk),
    vaccinations: parseMap(migrated.vaccinations, parseVaccination, idOf),
  };
}

/** Parse serialized document bytes. Throws on malformed JSON so the caller
 *  can decide whether to quarantine the stored copy — a *shape* problem is
 *  recoverable (unknown fields are dropped), a *syntax* problem is not. */
export function parseDoc(raw: string): AppData {
  return normalizeDoc(JSON.parse(raw) as unknown);
}

function sortedMap<T>(map: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const key of Object.keys(map).sort()) out[key] = map[key]!;
  return out;
}

/** Serialize a document for storage. Keys are emitted in sorted order so the
 *  bytes are stable — two devices holding the same document produce the same
 *  string, which keeps cloud revisions from churning on no-op saves. */
export function serializeDoc(data: AppData): string {
  return JSON.stringify({
    version: DOC_VERSION,
    child: data.child,
    measurements: sortedMap(data.measurements),
    diapers: sortedMap(data.diapers),
    foods: sortedMap(data.foods),
    milk: data.milk,
    vaccinations: sortedMap(data.vaccinations),
  });
}
