// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useT } from "./i18n/index.ts";
import type { DiaperKind } from "./types.ts";

// The three buttons — pee, poo, both — that are the whole of diaper logging.
// Two places render them, the Today screen and the sheet behind the top
// bar's `+`, and both write through the same `addDiaper` edit; one component
// so they cannot drift into two ways to claim the same thing.
//
// Big on purpose: the tap happens at a changing table with one hand on the
// baby, so each target is a third of the row and at least 3.5rem tall.

const KINDS: DiaperKind[] = ["pee", "poo", "both"];

type Props = {
  onLog: (kind: DiaperKind) => void;
  /** Taller buttons, for the sheet where they are the only thing. */
  large?: boolean;
};

export function DiaperButtons({ onLog, large }: Props) {
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("today.diapers")}
      className="grid grid-cols-3 gap-2"
    >
      {KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onLog(kind)}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-accent bg-accent/10 font-medium text-fg-bright transition-colors hover:bg-accent/20 active:bg-accent/30 ${
            large ? "min-h-24 text-base" : "min-h-14 text-sm"
          }`}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {kind === "pee" ? "💧" : kind === "poo" ? "💩" : "💧💩"}
          </span>
          {t(`today.${kind}` as const)}
        </button>
      ))}
    </div>
  );
}
