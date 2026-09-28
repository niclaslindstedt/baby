// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import { DropIcon, DropPooIcon, PooIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import type { DiaperKind } from "./types.ts";
import { WhenModal } from "./WhenModal.tsx";

// The three buttons — pee, poo, both — that are the whole of diaper logging.
// Two places render them, the Diapers tab and the sheet behind the top
// bar's `+`, and both write through the same `addDiaper` edit; one component
// so they cannot drift into two ways to claim the same thing.
//
// A tap says what the diaper held; the "when?" sheet (`WhenModal.tsx`) it
// opens says when — **Now**, or the few minutes it took to get the phone out
// once the baby was dressed again.
//
// Big on purpose: the tap happens at a changing table with one hand on the
// baby, so each target is a third of the row and at least 3.5rem tall.
//
// The marks are the app's own glyphs (`icons.tsx`), not emoji: "both" is
// literally the other two side by side, which an emoji pair could only
// imitate — and only in the platform's colours, at the platform's weight,
// deaf to `currentColor` and to the accent the button is wearing.

const KINDS: DiaperKind[] = ["pee", "poo", "both"];

/** Each kind's single mark, for the "when?" sheet. */
const KIND_ICON = { pee: DropIcon, poo: PooIcon, both: DropPooIcon };

type Props = {
  onLog: (kind: DiaperKind, at: Date) => void;
  /** Taller buttons, for the sheet where they are the only thing. */
  large?: boolean;
};

export function DiaperButtons({ onLog, large }: Props) {
  const t = useT();
  const [asking, setAsking] = useState<DiaperKind | null>(null);
  return (
    <>
      <div
        role="group"
        aria-label={t("diapers.title")}
        className="grid grid-cols-3 gap-2"
      >
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setAsking(kind)}
            aria-haspopup="dialog"
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-accent bg-accent/10 font-medium text-fg-bright transition-colors hover:bg-accent/20 active:bg-accent/30 ${
              large ? "min-h-24 text-base" : "min-h-14 text-sm"
            }`}
          >
            <span className="flex items-center gap-0.5 text-accent">
              {kind !== "poo" && (
                <DropIcon className={large ? "h-7 w-7" : "h-5 w-5"} />
              )}
              {kind !== "pee" && (
                <PooIcon className={large ? "h-7 w-7" : "h-5 w-5"} />
              )}
            </span>
            {t(`diapers.${kind}` as const)}
          </button>
        ))}
      </div>
      <WhenModal
        open={asking !== null}
        icon={KIND_ICON[asking ?? "pee"]}
        title={t(`diapers.${asking ?? "pee"}` as const)}
        question={t("diapers.when")}
        onPick={(at) => {
          if (asking) onLog(asking, at);
          setAsking(null);
        }}
        onClose={() => setAsking(null)}
      />
    </>
  );
}
