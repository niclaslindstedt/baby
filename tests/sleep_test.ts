// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The sleep log, read: the spans and the sleep day a night belongs to, the
// totals and averages, the recommendation and observed range for the age,
// the wake windows, and the next-sleep suggestion. Every moment is a local
// wall-clock time on a real date, built the way a tap stores one.

import { addDays } from "@niclaslindstedt/oss-framework/calendar";
import { describe, expect, it } from "vitest";

import {
  averageSleep,
  currentSleep,
  lastCompleteSleepDay,
  lastEndedSleep,
  lastNight,
  LONG_NAP_MINUTES,
  MIN_LOGGED_DAYS,
  nextSleep,
  recentSleepsByDay,
  SHORT_NAP_MINUTES,
  sleepDayOf,
  sleepDays,
  sleepDiary,
  sleepNormFor,
  sleepRhythm,
  sleepSpans,
  sleepStatus,
  sleptInLast,
  spansInLast,
  unfinishedSleeps,
  wakeWindowFor,
  type SleepAverage,
} from "../src/app/sleep.ts";
import {
  latestClockTime,
  sleepDraft,
  sleepEditProblem,
  sleepTimeProblem,
} from "../src/app/sleepEdit.ts";
import {
  emptyDoc,
  type AppData,
  type SleepKind,
  type SleepSession,
} from "../src/app/types.ts";

/** A local wall-clock moment: `day` at `h:m`, with `h` past 24 running into
 *  the next morning. */
function local(day: string, h: number, m = 0): Date {
  const [y, mo, d] = day.split("-").map(Number);
  return new Date(y!, mo! - 1, d!, h, m);
}

let seq = 0;
/** A sleep from `from` to `to` (hours as [h, m] on `day`), or open. */
function sleep(
  kind: SleepKind,
  day: string,
  from: [number, number],
  to: [number, number] | null,
  id = `s${seq++}`,
): SleepSession {
  const start = local(day, from[0], from[1]).toISOString();
  return {
    id,
    kind,
    start,
    end: to === null ? null : local(day, to[0], to[1]).toISOString(),
    updatedAt: start,
  };
}

function docWith(sleeps: SleepSession[]): AppData {
  return {
    ...emptyDoc(),
    sleeps: Object.fromEntries(sleeps.map((s) => [s.id, s])),
  };
}

/** A regular day for a seven-month-old: naps at 8:30–9:30 and 12:00–13:30,
 *  a catnap 16:00–16:30, and a night 19:00 to 6:00 the next morning. */
function regularDay(day: string): SleepSession[] {
  return [
    sleep("nap", day, [8, 30], [9, 30]),
    sleep("nap", day, [12, 0], [13, 30]),
    sleep("nap", day, [16, 0], [16, 30]),
    sleep("night", day, [19, 0], [30, 0]),
  ];
}

/** `regularDay` for every day from `from` to `to`. */
function regularDays(from: string, to: string): SleepSession[] {
  const out: SleepSession[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(...regularDay(d));
  return out;
}

describe("the spans", () => {
  it("reads the open sleep that began last as the current one", () => {
    const data = docWith([
      sleep("nap", "2026-09-26", [12, 0], [13, 0]),
      sleep("nap", "2026-09-26", [16, 0], null, "open"),
    ]);
    expect(currentSleep(data, local("2026-09-26", 16, 40))?.id).toBe("open");
    // Not before it began.
    expect(currentSleep(data, local("2026-09-26", 15, 0))).toBeNull();
  });

  it("stops reading an open sleep as current once a later one began, or once it is stale", () => {
    const forgotten = sleep("nap", "2026-09-26", [9, 0], null, "forgotten");
    const later = sleep("nap", "2026-09-26", [12, 0], [13, 0], "later");
    const data = docWith([forgotten, later]);
    const now = local("2026-09-26", 14, 0);
    expect(currentSleep(data, now)).toBeNull();
    expect(unfinishedSleeps(data, now).map((s) => s.id)).toEqual(["forgotten"]);
    // Neither counted: its end is unknown.
    expect(sleepSpans(data, now).map((s) => s.id)).toEqual(["later"]);

    const stale = docWith([sleep("night", "2026-09-25", [19, 0], null, "x")]);
    // Sixteen hours on it is still the night…
    expect(currentSleep(stale, local("2026-09-26", 10, 59))?.id).toBe("x");
    // …and past them it is a "woke up" nobody tapped.
    expect(currentSleep(stale, local("2026-09-26", 11, 1))).toBeNull();
    expect(unfinishedSleeps(stale, local("2026-09-26", 11, 1))).toHaveLength(1);
  });

  it("runs the current sleep up to now and clips overlaps so no minute counts twice", () => {
    const data = docWith([
      sleep("nap", "2026-09-26", [12, 0], [13, 0], "a"),
      // The same nap, logged on the other phone ten minutes later.
      sleep("nap", "2026-09-26", [12, 10], [13, 20], "b"),
      sleep("nap", "2026-09-26", [16, 0], null, "c"),
    ]);
    const now = local("2026-09-26", 16, 30);
    const spans = sleepSpans(data, now);
    expect(spans.map((s) => [s.id, s.ongoing])).toEqual([
      ["a", false],
      ["b", false],
      ["c", true],
    ]);
    expect(spans[1]!.start).toBe(local("2026-09-26", 13, 0).getTime());
    expect(spans[2]!.end).toBe(now.getTime());
    expect(sleptInLast(data, now).dayMinutes).toBe(60 + 20 + 30);
  });
});

describe("the sleep day", () => {
  it("counts a night toward the evening it began and a nap toward its own day", () => {
    const at = (day: string, h: number, m = 0) => local(day, h, m).getTime();
    expect(sleepDayOf({ kind: "night", start: at("2026-09-26", 19, 30) })).toBe(
      "2026-09-26",
    );
    // A night resumed after a logged waking belongs to the same night.
    expect(sleepDayOf({ kind: "night", start: at("2026-09-27", 2, 40) })).toBe(
      "2026-09-26",
    );
    expect(sleepDayOf({ kind: "nap", start: at("2026-09-27", 9, 0) })).toBe(
      "2026-09-27",
    );
  });

  it("adds up a day's naps and the whole of the night that follows it", () => {
    const data = docWith([
      sleep("nap", "2026-09-26", [9, 0], [10, 0]),
      sleep("nap", "2026-09-26", [13, 0], [14, 30]),
      sleep("night", "2026-09-26", [19, 0], [26, 30]),
      sleep("night", "2026-09-26", [26, 45], [30, 15]),
    ]);
    const [day] = sleepDays(
      data,
      "2026-09-26",
      "2026-09-26",
      local("2026-09-27", 12, 0),
    );
    expect(day).toMatchObject({
      day: "2026-09-26",
      dayMinutes: 150,
      nightMinutes: 450 + 210,
      totalMinutes: 150 + 660,
      naps: 2,
      logged: true,
      ongoing: false,
    });
  });

  it("is over at noon the day after", () => {
    expect(lastCompleteSleepDay(local("2026-09-27", 9, 41))).toBe("2026-09-25");
    expect(lastCompleteSleepDay(local("2026-09-27", 12, 0))).toBe("2026-09-26");
  });

  it("lists the week by sleep day, newest first, open sleeps included", () => {
    const data = docWith([
      sleep("nap", "2026-09-26", [9, 0], [10, 0], "n1"),
      sleep("night", "2026-09-26", [19, 0], [26, 0], "night-a"),
      sleep("night", "2026-09-26", [26, 20], null, "night-b"),
      sleep("nap", "2026-09-10", [9, 0], [10, 0], "old"),
    ]);
    const days = recentSleepsByDay(data, "2026-09-27", 7);
    expect(days.map((d) => d.day)).toEqual(["2026-09-26"]);
    expect(days[0]!.sleeps.map((s) => s.id)).toEqual([
      "night-b",
      "night-a",
      "n1",
    ]);
  });
});

describe("the averages", () => {
  it("divide by the days that have a log, ending with the last full day", () => {
    const data = docWith([
      ...regularDays("2026-09-17", "2026-09-26"),
      // Today's first nap, not yet part of any complete day.
      sleep("nap", "2026-09-28", [8, 30], [9, 30]),
    ]);
    const avg = averageSleep(data, local("2026-09-28", 13, 0), 30)!;
    expect(avg.through).toBe("2026-09-27");
    // 17–26 September: ten days logged of the thirty (the 27th's night was
    // never entered, and the 26th's ends on the 27th's morning).
    expect(avg.loggedDays).toBe(10);
    expect(avg.dayMinutes).toBe(60 + 90 + 30);
    expect(avg.nightMinutes).toBe(11 * 60);
    expect(avg.totalMinutes).toBe(180 + 660);
    expect(avg.napsPerDay).toBe(3);
  });

  it("is null with nothing logged, and leaves out a day still being slept", () => {
    expect(averageSleep(emptyDoc(), local("2026-09-28", 13, 0), 30)).toBeNull();
    // At 03:00 the night of the 26th is still going; at noon on the 27th it
    // would count, but by then it is over.
    const data = docWith([sleep("night", "2026-09-26", [19, 0], null)]);
    expect(averageSleep(data, local("2026-09-27", 3, 0), 30)).toBeNull();
  });

  it("reads the rolling day at any hour", () => {
    const data = docWith(regularDays("2026-09-25", "2026-09-26"));
    const last24 = sleptInLast(data, local("2026-09-27", 10, 0));
    // 10:00 on the 26th to 10:00 on the 27th: the 12:00 and 16:00 naps and
    // the whole night (the 26th's 8:30 nap ended before the window).
    expect(last24.dayMinutes).toBe(90 + 30);
    expect(last24.nightMinutes).toBe(11 * 60);
    expect(last24.totalMinutes).toBe(120 + 660);
  });

  it("clips the rolling day's spans to the window, as the dial draws them", () => {
    const data = docWith([
      ...regularDays("2026-09-25", "2026-09-26"),
      sleep("nap", "2026-09-27", [9, 40], null),
    ]);
    const now = local("2026-09-27", 10, 0);
    const spans = spansInLast(data, now);
    // From 10:00 yesterday: the 12:00 and 16:00 naps, the night, and the
    // nap running now — the 8:30 nap ended before the window opened.
    expect(spans.map((s) => [s.kind, s.ongoing])).toEqual([
      ["nap", false],
      ["nap", false],
      ["night", false],
      ["nap", true],
    ]);
    expect(spans.at(-1)!.end).toBe(now.getTime());
    // A night that began before the window is cut at its edge.
    const short = spansInLast(data, local("2026-09-27", 4, 0), 6);
    expect(short).toHaveLength(1);
    expect(short[0]!.start).toBe(local("2026-09-26", 22, 0).getTime());
  });

  it("adds a night logged in halves into one last night, and waits while it goes on", () => {
    const halves = docWith([
      sleep("night", "2026-09-26", [19, 10], [26, 35]),
      sleep("night", "2026-09-26", [26, 50], [30, 5]),
    ]);
    const night = lastNight(halves, local("2026-09-27", 9, 41))!;
    expect(night.day).toBe("2026-09-26");
    expect(night.minutes).toBe(445 + 195);
    const going = docWith([
      sleep("night", "2026-09-26", [19, 10], [26, 35]),
      sleep("night", "2026-09-26", [26, 50], null),
    ]);
    expect(lastNight(going, local("2026-09-27", 4, 0))).toBeNull();
  });
});

describe("the recommendation", () => {
  it("is the WHO's range for the age", () => {
    // 0–3 months 14–17 h, 4–11 months 12–16 h, 1–2 years 11–14 h, 3–4 years
    // (carried to five) 10–13 h.
    expect(sleepNormFor(0)!.recommended.hours).toEqual([14, 17]);
    expect(sleepNormFor(121)!.recommended.hours).toEqual([14, 17]);
    expect(sleepNormFor(122)!.recommended.hours).toEqual([12, 16]);
    expect(sleepNormFor(364)!.recommended.hours).toEqual([12, 16]);
    expect(sleepNormFor(365)!.recommended.hours).toEqual([11, 14]);
    expect(sleepNormFor(1096)!.recommended.hours).toEqual([10, 13]);
    expect(sleepNormFor(2192)).toBeNull();
    expect(sleepNormFor(-1)).toBeNull();
  });

  it("carries the observed mean and 95 % range of Galland et al. 2012", () => {
    expect(sleepNormFor(20)!.observed).toMatchObject({
      mean: 14.6,
      range: [9.3, 20.0],
    });
    expect(sleepNormFor(200)!.observed).toMatchObject({
      mean: 12.9,
      range: [8.8, 17.0],
    });
    expect(sleepNormFor(275)!.observed).toMatchObject({
      mean: 12.6,
      range: [9.4, 15.8],
    });
    expect(sleepNormFor(600)!.observed).toMatchObject({
      mean: 12.6,
      range: [10.0, 15.2],
    });
    expect(sleepNormFor(1400)!.observed).toMatchObject({
      mean: 11.5,
      range: [9.1, 13.9],
    });
  });

  it("reads an average against both, once a week is logged", () => {
    const norm = sleepNormFor(600)!; // 11–14 h recommended, 10.0–15.2 observed
    const avg = (hours: number, loggedDays = 30): SleepAverage => ({
      windowDays: 30,
      loggedDays,
      totalMinutes: hours * 60,
      nightMinutes: 0,
      dayMinutes: 0,
      napsPerDay: 0,
      through: "2026-09-26",
    });
    expect(sleepStatus(norm, avg(12.5))).toBe("within");
    expect(sleepStatus(norm, avg(10.5))).toBe("littleShort");
    expect(sleepStatus(norm, avg(14.5))).toBe("littleLong");
    expect(sleepStatus(norm, avg(9.5))).toBe("short");
    expect(sleepStatus(norm, avg(15.5))).toBe("long");
    expect(sleepStatus(norm, avg(9.5, MIN_LOGGED_DAYS - 1))).toBe("tooEarly");
    expect(sleepStatus(norm, null)).toBe("tooEarly");
  });
});

describe("the wake windows", () => {
  it("follow Tresillian to a year and Karitane after it", () => {
    const band = (days: number) => {
      const w = wakeWindowFor(days);
      return w && [w.min, w.max];
    };
    expect(band(10)).toEqual([60, 120]); // newborn to 6 weeks: 1–2 h
    expect(band(50)).toEqual([60, 150]); // 6–12 weeks: 1–2.5 h
    expect(band(100)).toEqual([90, 120]); // 3 months: 1.5–2 h
    expect(band(150)).toEqual([120, 180]); // 5 months: 2–3 h
    expect(band(228)).toEqual([120, 180]); // 6–8 months: 2–3 h
    expect(band(300)).toEqual([150, 210]); // 9–10 months: 2.5–3.5 h
    expect(band(345)).toEqual([180, 240]); // 11–12 months: 3–4 h
    expect(band(400)).toEqual([240, 360]); // 12–18 months: 4–6 h
    expect(band(700)).toEqual([300, 420]); // 18 months–3 years: 5–7 h
    expect(band(1100)).toBeNull();
    expect(band(-3)).toBeNull();
  });

  it("reads the child's own rhythm from the last two weeks", () => {
    const data = docWith(regularDays("2026-09-13", "2026-09-26"));
    const rhythm = sleepRhythm(
      data,
      local("2026-09-27", 9, 0),
      wakeWindowFor(228)!,
    );
    // Mornings 6:00 → 8:30, and after each nap 2.5 h (9:30 → 12:00,
    // 13:30 → 16:00, 16:30 → 19:00).
    expect(new Set(rhythm.afterNight)).toEqual(new Set([150]));
    expect(new Set(rhythm.afterNap)).toEqual(new Set([150]));
    expect(rhythm.bedtime).toBe(7 * 60); // 19:00 is seven hours past noon
    expect(rhythm.earliestMorning).toBe(6 * 60);
  });
});

describe("the next sleep", () => {
  const AGE = 228; // seven and a half months: 2–3 h awake

  it("says how long the child has been asleep", () => {
    const data = docWith([sleep("nap", "2026-09-27", [12, 0], null)]);
    expect(nextSleep(data, AGE, local("2026-09-27", 12, 45))).toEqual({
      state: "asleep",
      kind: "nap",
      since: local("2026-09-27", 12, 0).getTime(),
      minutes: 45,
    });
  });

  it("takes the middle of the band with nothing of the child's own to go on", () => {
    const data = docWith([sleep("nap", "2026-09-27", [8, 30], [9, 30])]);
    const next = nextSleep(data, AGE, local("2026-09-27", 10, 0))!;
    expect(next.state).toBe("awake");
    if (next.state !== "awake") return;
    expect(next.minutes).toBe(30);
    const s = next.suggestion!;
    // 9:30 + 2.5 h, and no bedtime known yet: just "sleep".
    expect(s.at).toBe(local("2026-09-27", 12, 0).getTime());
    expect(s.earliest).toBe(local("2026-09-27", 11, 45).getTime());
    expect(s.latest).toBe(local("2026-09-27", 12, 15).getTime());
    expect(s.kind).toBe("sleep");
    expect(s.own).toBeNull();
    expect(s.lastNap).toBeNull();
    expect(s.overdue).toBe(false);
  });

  it("moves the window halfway toward the short end after a short nap, and toward the long end after a long one", () => {
    const short = docWith([
      sleep("nap", "2026-09-27", [9, 0], [9, SHORT_NAP_MINUTES - 5]),
    ]);
    const s1 = nextSleep(short, AGE, local("2026-09-27", 10, 0));
    if (s1?.state !== "awake") throw new Error("expected awake");
    // 150 → 135 minutes after 9:40.
    expect(s1.suggestion!.lastNap).toBe("short");
    expect(s1.suggestion!.at).toBe(local("2026-09-27", 11, 55).getTime());

    const long = docWith([
      sleep("nap", "2026-09-27", [9, 0], [9 + LONG_NAP_MINUTES / 60, 0]),
    ]);
    const s2 = nextSleep(long, AGE, local("2026-09-27", 11, 30))!;
    if (s2.state !== "awake") throw new Error("expected awake");
    // 150 → 165 minutes after 11:00.
    expect(s2.suggestion!.lastNap).toBe("long");
    expect(s2.suggestion!.at).toBe(local("2026-09-27", 13, 45).getTime());
  });

  it("follows the child's own windows, clamped into the band", () => {
    // Three-hour-twenty windows every day: longer than the band allows.
    const days: SleepSession[] = [];
    for (let d = "2026-09-17"; d <= "2026-09-26"; d = addDays(d, 1)) {
      days.push(
        sleep("nap", d, [9, 0], [10, 0]),
        sleep("nap", d, [13, 20], [14, 20]),
        sleep("night", d, [19, 0], [29, 0]),
      );
    }
    const today = sleep("nap", "2026-09-27", [9, 0], [10, 0]);
    const next = nextSleep(
      docWith([...days, today]),
      AGE,
      local("2026-09-27", 10, 30),
    )!;
    if (next.state !== "awake") throw new Error("expected awake");
    expect(next.suggestion!.own).toBe(180);
    expect(next.suggestion!.kind).toBe("nap");
    expect(next.suggestion!.at).toBe(local("2026-09-27", 13, 0).getTime());
  });

  it("makes the next sleep bedtime when the usual bedtime is within reach", () => {
    const data = docWith([
      ...regularDays("2026-09-17", "2026-09-26"),
      sleep("nap", "2026-09-27", [8, 30], [9, 30]),
      sleep("nap", "2026-09-27", [12, 0], [13, 30]),
      sleep("nap", "2026-09-27", [16, 0], [16, 30]),
    ]);
    const next = nextSleep(data, AGE, local("2026-09-27", 17, 0))!;
    if (next.state !== "awake") throw new Error("expected awake");
    expect(next.suggestion!.kind).toBe("night");
    expect(next.suggestion!.at).toBe(local("2026-09-27", 19, 0).getTime());
    // After the midday nap, bedtime is out of reach: a nap comes first.
    const midday = nextSleep(
      docWith([
        ...regularDays("2026-09-17", "2026-09-26"),
        sleep("nap", "2026-09-27", [8, 30], [9, 30]),
        sleep("nap", "2026-09-27", [12, 0], [13, 30]),
      ]),
      AGE,
      local("2026-09-27", 14, 0),
    )!;
    if (midday.state !== "awake") throw new Error("expected awake");
    expect(midday.suggestion!.kind).toBe("nap");
    expect(midday.suggestion!.at).toBe(local("2026-09-27", 16, 0).getTime());
  });

  it("suggests the first nap from the morning, and nothing after a night waking", () => {
    const history = regularDays("2026-09-17", "2026-09-25");
    // The night of the 26th, with a waking at 2:30.
    const firstHalf = sleep("night", "2026-09-26", [19, 0], [26, 30]);
    const waking = nextSleep(
      docWith([...history, ...regularDay("2026-09-26").slice(0, 3), firstHalf]),
      AGE,
      local("2026-09-27", 2, 40),
    )!;
    expect(waking.state).toBe("nightWaking");

    const morning = nextSleep(
      docWith(regularDays("2026-09-17", "2026-09-26")),
      AGE,
      local("2026-09-27", 6, 30),
    )!;
    if (morning.state !== "awake") throw new Error("expected awake");
    expect(morning.suggestion!.kind).toBe("nap");
    expect(morning.suggestion!.at).toBe(local("2026-09-27", 8, 30).getTime());

    // With no mornings of the child's own, a night that ends before five is
    // still a waking.
    const fresh = docWith([sleep("night", "2026-09-26", [19, 0], [27, 0])]);
    expect(nextSleep(fresh, AGE, local("2026-09-27", 3, 10))!.state).toBe(
      "nightWaking",
    );
  });

  it("marks a suggestion whose time has passed", () => {
    const data = docWith([sleep("nap", "2026-09-27", [8, 30], [9, 30])]);
    const next = nextSleep(data, AGE, local("2026-09-27", 12, 20))!;
    if (next.state !== "awake") throw new Error("expected awake");
    expect(next.suggestion!.overdue).toBe(true);
  });

  it("says nothing once the log has gone quiet, and stops suggesting times from three", () => {
    const data = docWith([sleep("nap", "2026-09-27", [8, 30], [9, 30])]);
    // Twice the band's six hours: a sleep went unlogged.
    expect(nextSleep(data, AGE, local("2026-09-27", 15, 31))).toBeNull();
    expect(nextSleep(emptyDoc(), AGE, local("2026-09-27", 10, 0))).toBeNull();
    const older = nextSleep(data, 1200, local("2026-09-27", 12, 0))!;
    expect(older).toMatchObject({ state: "awake", suggestion: null });
  });
});

describe("the diary", () => {
  it("draws each calendar day midnight to midnight, cutting a night at twelve", () => {
    const data = docWith([
      sleep("nap", "2026-09-26", [12, 0], [13, 30]),
      sleep("night", "2026-09-26", [19, 0], [30, 0]),
    ]);
    const diary = sleepDiary(
      data,
      "2026-09-26",
      "2026-09-27",
      local("2026-09-27", 9, 0),
    );
    expect(diary[0]!.segments).toEqual([
      { kind: "nap", from: 720, to: 810, ongoing: false },
      { kind: "night", from: 1140, to: 1440, ongoing: false },
    ]);
    expect(diary[1]!.segments).toEqual([
      { kind: "night", from: 0, to: 360, ongoing: false },
    ]);
  });
});

describe("logging after the fact", () => {
  it("reads a picked clock time as its latest occurrence", () => {
    // 13:05 picked at 13:40 is today; 23:50 picked at 00:10 is last night.
    expect(latestClockTime("13:05", local("2026-09-27", 13, 40))).toEqual(
      local("2026-09-27", 13, 5),
    );
    expect(latestClockTime("23:50", local("2026-09-27", 0, 10))).toEqual(
      local("2026-09-26", 23, 50),
    );
    // The minute of the tap itself is now, not yesterday.
    expect(latestClockTime("09:41", local("2026-09-27", 9, 41))).toEqual(
      local("2026-09-27", 9, 41),
    );
  });

  it("refuses a start before the last sleep ended, and a time in the future", () => {
    const data = docWith([sleep("nap", "2026-09-27", [9, 0], [10, 0])]);
    const now = local("2026-09-27", 12, 30);
    expect(lastEndedSleep(data, now)).toBe(
      local("2026-09-27", 10, 0).getTime(),
    );
    // Fell asleep twenty minutes ago: fine.
    expect(sleepTimeProblem(data, local("2026-09-27", 12, 10), now)).toBeNull();
    expect(sleepTimeProblem(data, local("2026-09-27", 9, 45), now)).toBe(
      "beforeLastSleep",
    );
    expect(sleepTimeProblem(data, local("2026-09-27", 12, 31), now)).toBe(
      "future",
    );
  });

  it("refuses a wake before the running sleep began", () => {
    const data = docWith([sleep("nap", "2026-09-27", [12, 10], null)]);
    const now = local("2026-09-27", 14, 0);
    // Woke up a quarter of an hour ago: fine.
    expect(sleepTimeProblem(data, local("2026-09-27", 13, 45), now)).toBeNull();
    expect(sleepTimeProblem(data, local("2026-09-27", 12, 10), now)).toBe(
      "beforeStart",
    );
  });
});

describe("correcting a sleep on the dial", () => {
  const at = (day: string, h: number, m = 0) => local(day, h, m).getTime();

  it("opens a new sleep as the hour up to now, on the five-minute grid", () => {
    const draft = sleepDraft(null, at("2026-09-27", 13, 42));
    expect(draft).toEqual({
      kind: "nap",
      start: at("2026-09-27", 12, 40),
      end: at("2026-09-27", 13, 40),
    });
  });

  it("opens a recorded sleep as it was, and keeps the running one open", () => {
    const now = at("2026-09-27", 14, 0);
    const ended = sleep("night", "2026-09-26", [19, 7], [30, 4]);
    expect(sleepDraft(ended, now)).toEqual({
      kind: "night",
      start: at("2026-09-26", 19, 7),
      end: at("2026-09-27", 6, 4),
    });
    const running = sleep("nap", "2026-09-27", [13, 10], null);
    expect(sleepDraft(running, now).end).toBeNull();
  });

  it("guesses an end for a sleep being finished — never past now", () => {
    const now = at("2026-09-27", 14, 0);
    const night = sleep("night", "2026-09-26", [19, 30], null);
    // Ten hours on: 5:30 the next morning.
    expect(sleepDraft(night, now, true).end).toBe(at("2026-09-27", 5, 30));
    const nap = sleep("nap", "2026-09-27", [13, 20], null);
    // An hour on would be 14:20, which hasn't happened: the grid step
    // before now instead.
    expect(sleepDraft(nap, now, true).end).toBe(at("2026-09-27", 14, 0));
  });

  it("refuses a time to come, an end before the start, and a sleep too long to be one", () => {
    const now = at("2026-09-27", 14, 0);
    const ok = { start: at("2026-09-26", 19, 0), end: at("2026-09-27", 6, 0) };
    expect(sleepEditProblem(ok, now)).toBeNull();
    expect(
      sleepEditProblem({ start: ok.start, end: at("2026-09-27", 14, 5) }, now),
    ).toBe("future");
    expect(sleepEditProblem({ start: ok.end, end: ok.start }, now)).toBe(
      "endBeforeStart",
    );
    // Seventeen hours: past STALE_SLEEP_HOURS.
    expect(
      sleepEditProblem({ start: ok.start, end: at("2026-09-27", 12, 0) }, now),
    ).toBe("tooLong");
    // An open sleep runs to now for the length check.
    expect(
      sleepEditProblem({ start: at("2026-09-27", 13, 0), end: null }, now),
    ).toBeNull();
    expect(
      sleepEditProblem({ start: at("2026-09-26", 20, 0), end: null }, now),
    ).toBe("tooLong");
  });
});
