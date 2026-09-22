// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The handful of app-local layout pieces every screen shares: the card, the
// small caps heading, the labelled field, and the input class the forms
// use. Domain-free, but not framework material either — they are this app's
// spacing and rhythm, and the framework deliberately leaves the page layout
// to the app.
//
// The forms use plain controlled inputs rather than the framework's
// commit-on-blur `LabeledInput`: a form with a Save button needs the draft
// to be current the moment Save is tapped, not after a blur the tap may
// race.

import type { ReactNode } from "react";

import {
  DatePicker,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import { formatDayYear } from "./format.ts";
import { useLang, useT } from "./i18n/index.ts";
import { sanitizeDecimal } from "./number.ts";

/** The bordered-field look, matching the framework's own fields.
 *
 *  `max-w-full` is not decoration: a control that sizes itself to its own
 *  content — which is every native control with a platform editor behind it
 *  — ignores `w-full` and renders past the card's padding on iOS. The
 *  framework's own field class pins it for the same reason. */
export const INPUT_CLASS =
  "w-full max-w-full min-w-0 rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg-bright outline-none focus:border-accent";

export const INPUT_INVALID_CLASS =
  "w-full max-w-full min-w-0 rounded-md border border-danger bg-surface px-3 py-2 text-sm text-fg-bright outline-none focus:border-danger";

/** A card: the surface every screen is built from.
 *
 *  With `onClick` the whole card *is* the control — a `<button>` wearing the
 *  same skin, rather than a card with a button parked in the corner. On a
 *  phone that turns a 64×32 target into the width of the screen, which is
 *  the difference between reaching for Today's answers and aiming at them.
 *  The card's own text is the button's accessible name, so it needs no
 *  label of its own. */
export function Card({
  children,
  className = "",
  tone = "default",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  /** `accent` for a card that carries good news, `warn` for one that asks
   *  for a look. */
  tone?: "default" | "accent" | "warn";
  /** Makes the card a button that opens something. */
  onClick?: () => void;
}) {
  const skin =
    tone === "accent"
      ? "border-accent/40 bg-accent/10"
      : tone === "warn"
        ? "border-danger/40 bg-danger/10"
        : "border-line bg-surface-3";
  const base = `rounded-2xl border p-4 ${skin} ${className}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} w-full cursor-pointer text-left transition-colors hover:brightness-110 active:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      >
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

/** The small-caps heading a card opens with. */
export function Heading({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-wide text-accent uppercase">
      {children}
    </p>
  );
}

/** A label above a control, with an optional hint and error line. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-fg">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

/** A text input the forms share.
 *
 *  `type="decimal"` is a measurement field rather than a native
 *  `<input type="number">`: the native control only keeps what parses as a
 *  floating-point literal, so a Swedish keyboard's comma — the separator the
 *  scale and the tape measure are read in — is swallowed before it reaches
 *  `parseNumber`. A text field with `inputMode="decimal"` keeps the numeric
 *  keypad on a phone and lets both separators through. */
export function TextInput({
  value,
  onChange,
  invalid,
  type = "text",
  placeholder,
  inputMode,
  step,
  min,
  max,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
  type?: "text" | "number" | "decimal";
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
  step?: string;
  min?: string;
  max?: string;
  autoFocus?: boolean;
}) {
  const decimal = type === "decimal";
  return (
    <input
      type={decimal ? "text" : type}
      value={value}
      placeholder={placeholder}
      inputMode={decimal ? "decimal" : inputMode}
      step={decimal ? undefined : step}
      min={decimal ? undefined : min}
      max={decimal ? undefined : max}
      autoFocus={autoFocus}
      autoComplete="off"
      enterKeyHint="done"
      aria-invalid={invalid || undefined}
      onInput={(e) => {
        const raw = e.currentTarget.value;
        const next = decimal ? sanitizeDecimal(raw) : raw;
        // The field is controlled, so a rejected character leaves the value
        // prop unchanged and nothing re-renders — the DOM has to be put back
        // by hand or the stray character stays on screen.
        if (next !== raw) e.currentTarget.value = next;
        onChange(next);
      }}
      className={invalid ? INPUT_INVALID_CLASS : INPUT_CLASS}
    />
  );
}

/** The date field every form uses — the framework's `DatePicker`, never an
 *  `<input type="date">`.
 *
 *  The native control loses on both counts on an iPhone, which is most of
 *  the app's traffic. It sizes itself to its own intrinsic width and spills
 *  out of the card it sits in. And its wheel commits a whole date at once:
 *  spinning to a month and confirming it closes the popover, so picking the
 *  day means opening the field a second time. `DatePicker` is a button over
 *  an in-panel grid — it takes the width it is given, and its month grid
 *  drops straight back to that month's days without ever closing.
 *
 *  A record's date is never blank, so the picker is not clearable; the empty
 *  string only ever arrives from the child form before a birth date is set. */
export function DateField({
  label,
  value,
  onChange,
  max,
  invalid,
}: {
  /** The field's caption. A `<label>` cannot name a button, so it is the
   *  trigger's `aria-label` — with the picked date in it, since an
   *  `aria-label` replaces the visible text rather than adding to it. */
  label: string;
  /** The picked day, or "" before one is set (the child's birth date). */
  value: string;
  onChange: (next: DayKey) => void;
  max?: DayKey;
  invalid?: boolean;
}) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  return (
    <DatePicker
      value={value === "" ? null : (value as DayKey)}
      onChange={(next) => next !== null && onChange(next)}
      max={max}
      locale={locale}
      formatValue={(day) => formatDayYear(day, locale)}
      ariaLabel={
        value === ""
          ? label
          : `${label}: ${formatDayYear(value as DayKey, locale)}`
      }
      labels={{
        placeholder: t("datePicker.placeholder"),
        prevMonth: t("datePicker.prevMonth"),
        nextMonth: t("datePicker.nextMonth"),
        prevYear: t("datePicker.prevYear"),
        nextYear: t("datePicker.nextYear"),
        prevYears: t("datePicker.prevYears"),
        nextYears: t("datePicker.nextYears"),
        clear: t("datePicker.clear"),
      }}
      invalid={invalid}
      // The trigger carries the framework's own field skin; these put it on
      // this app's metrics instead. The `!` is load-bearing: a bare
      // `bg-surface` and the component's `bg-surface-2` are the same utility
      // family, so which one wins is stylesheet order, not class order.
      className="w-full px-3! py-2! bg-surface!"
    />
  );
}

/** An empty-state card: a glyph, a sentence, and maybe a button. */
export function EmptyState({
  icon,
  text,
  action,
}: {
  icon: ReactNode;
  text: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto h-8 w-8 text-muted">{icon}</div>
      <p className="mt-3 text-sm text-muted">{text}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}
