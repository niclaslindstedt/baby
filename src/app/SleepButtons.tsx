// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { formatClock } from "./format.ts";
import { MoonIcon, SunIcon, SunriseIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import type { SleepKind, SleepSession } from "./types.ts";

// The whole of sleep logging: **Nap** and **Night** while the child is awake,
// **Woke up** while they are asleep. Two places render it — the Sleep tab and
// the sheet behind the top bar's `+` — and both write through the same
// `saveSleep` edit; one component, as with `DiaperButtons`, so the two can't
// drift into two ways of claiming the same thing.
//
// Which of the two a sleep is, is the parent's tap rather than the app's
// guess (see `SleepKind`). Nothing else is asked: the time is the moment of
// the tap, and a time tapped late is corrected in the list afterwards rather
// than typed up front.
//
// Big for the same reason the diaper buttons are: the tap happens in a dark
// room with a sleeping child on one arm.

type Props = {
  /** The sleep running now, or null while the child is awake. */
  current: SleepSession | null;
  onStart: (kind: SleepKind) => void;
  onWake: () => void;
  /** Taller buttons, for the sheet. */
  large?: boolean;
};

const KINDS: SleepKind[] = ["nap", "night"];

export function SleepButtons({ current, onStart, onWake, large }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const button = `flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-accent bg-accent/10 font-medium text-fg-bright transition-colors hover:bg-accent/20 active:bg-accent/30 ${
    large ? "min-h-24 text-base" : "min-h-14 text-sm"
  }`;
  const icon = large ? "h-7 w-7" : "h-5 w-5";

  if (current) {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm text-fg-bright">
          {current.kind === "night" ? (
            <MoonIcon className="h-4 w-4 text-accent" />
          ) : (
            <SunIcon className="h-4 w-4 text-accent" />
          )}
          {t(
            current.kind === "night" ? "sleep.asleepNight" : "sleep.asleepNap",
            { time: formatClock(current.start, locale) },
          )}
        </p>
        <button type="button" onClick={onWake} className={button}>
          <SunriseIcon className={`${icon} text-accent`} />
          {t("sleep.wokeUp")}
        </button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("sleep.title")}
      className="grid grid-cols-2 gap-2"
    >
      {KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onStart(kind)}
          className={button}
        >
          {kind === "night" ? (
            <MoonIcon className={`${icon} text-accent`} />
          ) : (
            <SunIcon className={`${icon} text-accent`} />
          )}
          {t(`sleep.${kind}` as const)}
        </button>
      ))}
    </div>
  );
}
