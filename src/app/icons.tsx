// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// App-owned glyphs — the marks the framework's set has no vocabulary for
// because they are this app's domain: a diaper, a scale, a bowl, a syringe.
// Everything else (cog, check, chevrons, cloud, plus) comes from
// `@niclaslindstedt/oss-framework/components`, so the two sets only ever
// differ where the domain does.
//
// Traced on the same Lucide 24×24 grid at the same 2px stroke weight as the
// framework glyphs, and stroked with `currentColor`, so a mark from either
// set sits on the same line without retuning.

import type { ReactNode } from "react";

export type IconProps = { className?: string };

function Glyph({
  className,
  filled = false,
  children,
}: IconProps & { filled?: boolean; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * The app mark — the same pacifier that is the favicon and the install
 * icon, drawn in `currentColor` on nothing.
 *
 * `public/icons/icon.svg` paints the mark green on the dark install surface,
 * because an icon's job is to be found on a home screen next to its sibling
 * apps and it has to carry its own background to do that. This one drops the
 * background and swaps the ink for `currentColor`, so inside the app the
 * mark is whatever the element around it is — the accent, in the top bar.
 * The ring's hole is a real hole here rather than the tile's surface colour,
 * because this mark sits on no background.
 *
 * Geometry is copied from `public/icons/icon.svg` and mirrored a second time
 * into `scripts/generate-icons.mjs`, which rasterises it. All three are kept
 * in step by hand — change one, change the other two.
 */
export function AppMarkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="27" r="13" fill="currentColor" />
      <path
        d="M50 27 L50 46"
        stroke="currentColor"
        strokeWidth={12}
        strokeLinecap="round"
      />
      <path
        d="M24 52 L76 52"
        stroke="currentColor"
        strokeWidth={22}
        strokeLinecap="round"
      />
      <circle cx="50" cy="74" r="12" stroke="currentColor" strokeWidth={6} />
    </svg>
  );
}

/** A baby — the Today tab, and the profile card. A round head with a curl. */
export function BabyIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 5c0-1.5 1-2.5 2.5-2.5" />
      <path d="M9.5 12.5h.01" />
      <path d="M14.5 12.5h.01" />
      <path d="M9.5 15.5c1.5 1.2 3.5 1.2 5 0" />
    </Glyph>
  );
}

/** A diaper change — a droplet. */
export function DropIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M12 2.5c3 4 6.5 7.5 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 9 6.5 12 2.5Z" />
    </Glyph>
  );
}

/** A filled droplet, for the tally chips. */
export function DropFilledIcon({ className }: IconProps) {
  return (
    <Glyph className={className} filled>
      <path d="M12 2.5c3 4 6.5 7.5 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 9 6.5 12 2.5Z" />
    </Glyph>
  );
}

/** Growth — a rising curve over an axis. */
export function GrowthIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M3 21h18" />
      <path d="M3 21V3" />
      <path d="M6 17c3-9 7-12 14-13" />
      <circle cx="10" cy="11.5" r="1.3" />
      <circle cx="15" cy="6.5" r="1.3" />
    </Glyph>
  );
}

/** Food — a bowl with a spoon. */
export function BowlIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M3 12h18a9 9 0 0 1-18 0Z" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M15 12 20 4" />
      <circle cx="20.5" cy="3.5" r="1.3" />
    </Glyph>
  );
}

/** A vaccination — a syringe. */
export function SyringeIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
      <path d="m14 4 6 6" />
    </Glyph>
  );
}

/** A ruler, for length. */
export function RulerIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z" />
      <path d="m14.5 6.5 1.5 1.5" />
      <path d="m11.5 9.5 1.5 1.5" />
      <path d="m8.5 12.5 1.5 1.5" />
    </Glyph>
  );
}

/** A scale, for weight. */
export function ScaleIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 9a5 5 0 0 1 8 0" />
      <path d="m12 12 2-2.5" />
    </Glyph>
  );
}

/** A head, for head circumference. */
export function HeadIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="11" r="7.5" />
      <path d="M4.5 11h15" strokeDasharray="2 2" />
    </Glyph>
  );
}

/** A warning triangle, for a regimen that no longer covers the day. */
export function AlertIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M12 3 2.5 19.5h19L12 3Z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </Glyph>
  );
}

/** A trash can, for the one destructive row action. */
export function TrashIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </Glyph>
  );
}
