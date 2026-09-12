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

/** The bordered-field look, matching the framework's own fields. */
export const INPUT_CLASS =
  "w-full min-w-0 rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg-bright outline-none focus:border-accent";

export const INPUT_INVALID_CLASS =
  "w-full min-w-0 rounded-md border border-danger bg-surface px-3 py-2 text-sm text-fg-bright outline-none focus:border-danger";

/** A card: the surface every screen is built from. */
export function Card({
  children,
  className = "",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  /** `accent` for a card that carries good news, `warn` for one that asks
   *  for a look. */
  tone?: "default" | "accent" | "warn";
}) {
  const skin =
    tone === "accent"
      ? "border-accent/40 bg-accent/10"
      : tone === "warn"
        ? "border-danger/40 bg-danger/10"
        : "border-line bg-surface-3";
  return (
    <div className={`rounded-2xl border p-4 ${skin} ${className}`}>
      {children}
    </div>
  );
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

/** A text input the forms share. */
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
  type?: "text" | "number" | "date";
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
  step?: string;
  min?: string;
  max?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      inputMode={inputMode}
      step={step}
      min={min}
      max={max}
      autoFocus={autoFocus}
      autoComplete="off"
      enterKeyHint="done"
      aria-invalid={invalid || undefined}
      onInput={(e) => onChange(e.currentTarget.value)}
      className={invalid ? INPUT_INVALID_CLASS : INPUT_CLASS}
    />
  );
}

/** A number typed into a text field, or null when it isn't one. Accepts a
 *  decimal comma, because a Swedish keyboard offers one. */
export function parseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
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
