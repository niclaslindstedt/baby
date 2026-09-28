// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState, type ComponentType } from "react";

import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Modal,
} from "@niclaslindstedt/oss-framework/components";

import { durationLabel } from "./copy.ts";
import { formatInstant } from "./format.ts";
import { ClockIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { useTick } from "./live.tsx";
import { TimeDial } from "./TimeDial.tsx";
import { LAGS, lagMoment, whenAllowed, whenDialStart } from "./when.ts";

// "When?" — the sheet every logging button opens once it knows *what*
// happened. The Diapers buttons, the sleep buttons and the `+` sheet all
// ask it the same way, so a lag is picked with the same thumb movement
// wherever the tap was.
//
// Three depths, loudest first. **Now** fills the top of the sheet: most
// taps are, and they cost one more tap than they used to and nothing else.
// Under it the usual lags — five minutes to an hour — each a tile with the
// clock time it stands for, so "15 min" reads as "12:30" before it is
// tapped; a tap on a tile logs and closes. **Another time** turns the sheet
// over to a dial (`TimeDial.tsx`) for anything further back, up to a day.
//
// A caller can bound the answer from below (`earliest`) — a wake can't come
// before the sleep began — and the tiles that would break it are dimmed
// and the dial stops at it, with `earliestNote` saying why. Nothing is
// written here: `onPick` gets the moment, and the caller writes it.
//
// Every string comes in from the caller or the `when` catalog, and the
// thing being logged is only an icon and a word, so a new tracker's button
// opens this as it is.

type Props = {
  open: boolean;
  /** The thing being logged, as its button showed it — a component, so the
   *  sheet can draw it at the header's size and in the dial's handle. */
  icon: ComponentType<{ className?: string }>;
  /** Its name: "Poop", "Nap", "Woke up". */
  title: string;
  /** The question, in the tracker's words: "When did Maja fall asleep?" */
  question: string;
  /** The earliest moment allowed, inclusive, or null for none. */
  earliest?: number | null;
  /** Why nothing before `earliest` can be picked. */
  earliestNote?: string;
  onPick: (at: Date) => void;
  onClose: () => void;
};

const TITLE_ID = "when-title";

export function WhenModal({
  open,
  icon: Icon,
  title,
  question,
  earliest = null,
  earliestNote,
  onPick,
  onClose,
}: Props) {
  const t = useT();
  const [dial, setDial] = useState<number | null>(null);

  const close = () => {
    setDial(null);
    onClose();
  };
  const pick = (at: number) => {
    setDial(null);
    onPick(new Date(at));
  };

  return (
    <Modal
      open={open}
      onClose={close}
      labelledBy={TITLE_ID}
      centered
      size="max-w-sm"
      closeLabel={t("common.close")}
      footer={
        <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-3 px-4 py-3">
          {dial === null ? (
            <>
              <span />
              <Button onClick={close}>{t("common.cancel")}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setDial(null)}>
                <span className="flex items-center gap-1">
                  <ChevronLeftIcon className="h-4 w-4" />
                  {t("when.back")}
                </span>
              </Button>
              <DialConfirm
                value={dial}
                earliest={earliest}
                onPick={() => pick(dial)}
              />
            </>
          )}
        </div>
      }
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface-3 px-4 py-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2
            id={TITLE_ID}
            className="text-xs font-bold tracking-wide text-accent uppercase"
          >
            {title}
          </h2>
          <p className="text-base text-fg-bright">{question}</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 py-4">
        {dial === null ? (
          <Choices
            earliest={earliest}
            earliestNote={earliestNote}
            onPick={pick}
            onDial={(now) => setDial(whenDialStart(now, earliest))}
          />
        ) : (
          <>
            <TimeDial
              value={dial}
              onChange={setDial}
              earliest={earliest}
              icon={<Icon className="h-4 w-4" />}
              label={question}
            />
            {earliestNote && earliest !== null && (
              <p className="text-center text-xs text-muted">{earliestNote}</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

/** The first face of the sheet: **Now**, the lag tiles, and the way to the
 *  dial. Its own component so only it ticks. */
function Choices({
  earliest,
  earliestNote,
  onPick,
  onDial,
}: {
  earliest: number | null;
  earliestNote?: string;
  onPick: (at: number) => void;
  onDial: (now: number) => void;
}) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  // The tiles' times move with the clock; a tap reads the clock itself.
  const now = useTick(10_000);
  const nowAllowed = whenAllowed(now, now, earliest);
  const blocked = LAGS.some(
    (lag) => !whenAllowed(lagMoment(now, lag), now, earliest),
  );

  return (
    <>
      <button
        type="button"
        disabled={!nowAllowed}
        onClick={() => onPick(Date.now())}
        className="live-pop flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl bg-accent px-5 text-page-bg shadow-sm transition-transform active:scale-[0.98] disabled:opacity-40"
      >
        <span className="text-2xl font-bold">{t("when.now")}</span>
        <span className="text-lg font-medium tabular-nums opacity-80">
          {formatInstant(now, locale)}
        </span>
      </button>

      <p className="mt-1 text-xs font-medium tracking-wide text-muted uppercase">
        {t("when.earlier")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {LAGS.map((lag) => {
          const at = lagMoment(now, lag);
          const ok = whenAllowed(at, now, earliest);
          return (
            <button
              key={lag}
              type="button"
              disabled={!ok}
              onClick={() => onPick(lagMoment(Date.now(), lag))}
              aria-label={t("when.agoAt", {
                duration: durationLabel(t, lag),
                time: formatInstant(at, locale),
              })}
              className="flex min-h-16 flex-col items-center justify-center rounded-xl border border-line bg-surface-2 transition-colors hover:border-accent active:bg-accent/20 disabled:opacity-30 disabled:hover:border-line"
            >
              <span className="text-base font-semibold text-fg-bright tabular-nums">
                {durationLabel(t, lag)}
              </span>
              <span className="text-xs text-muted tabular-nums">
                {formatInstant(at, locale)}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onDial(Date.now())}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-dashed border-line px-4 text-left text-sm text-fg-bright transition-colors hover:border-accent"
      >
        <ClockIcon className="h-5 w-5 shrink-0 text-accent" />
        <span className="flex-1">{t("when.other")}</span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {blocked && earliestNote && (
        <p className="text-xs text-muted">{earliestNote}</p>
      )}
    </>
  );
}

/** The dial's confirm, naming the time it will log. */
function DialConfirm({
  value,
  earliest,
  onPick,
}: {
  value: number;
  earliest: number | null;
  onPick: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const now = useTick(30_000);
  return (
    <Button
      variant="primary"
      disabled={!whenAllowed(value, Math.max(now, value), earliest)}
      onClick={onPick}
    >
      {t("when.logAt", { time: formatInstant(value, locale) })}
    </Button>
  );
}
