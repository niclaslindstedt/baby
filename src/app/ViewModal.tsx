// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useId, type ReactNode } from "react";

import { Modal } from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";

// The shell every *reading* surface in the app now sits in.
//
// The four tabs are where a parent puts things in; the answers those things
// add up to are all on Today, one tap from a card into one of these. A modal
// rather than a fifth, sixth and seventh screen because reading a chart is
// something you do and then leave — the same argument that keeps the diaper
// sheet off the bar (see `BottomNav.tsx`) — and because closing it puts the
// parent back exactly where they were rather than on a tab they now have to
// navigate out of.
//
// The framework's `Modal` in its non-centred mode is already the shape this
// wants: full screen on a phone, where a growth chart needs every pixel it
// can get, and a card floating over a blurred page from `sm:` up, where the
// page behind it is wide enough to stay visible without competing. The blur
// itself is `--modal-backdrop-blur`, set once in `styles.css`.
//
// It closes the way the contacts app's card does, and for the same reason: a
// swipe down on a phone, the backdrop or Escape on a desktop, and no footer
// bar in either. A row holding one Close button costs a chart three lines of
// height on the screen that has the least of it, to repeat a gesture the
// modal already carries (the framework's `Modal` drags to dismiss by default
// whenever it isn't `centered`). The grab handle below is that gesture's only
// cost — ten pixels saying the sheet can be pulled away.
//
// Nothing in here writes. A view modal that could edit would be a second
// write path for data the tab behind it already owns, and the point of
// splitting reading from writing is that there is exactly one of each.

type Props = {
  open: boolean;
  onClose: () => void;
  /** The small-caps line at the top — what this view answers. */
  title: string;
  /** The app glyph beside it. */
  icon: ReactNode;
  /** A sentence under the title: the headline the view is about to draw. */
  summary?: ReactNode;
  /** Pinned under the title, above the scrolling body — the growth view's
   *  indicator tabs. */
  toolbar?: ReactNode;
  children: ReactNode;
};

export function ViewModal({
  open,
  onClose,
  title,
  icon,
  summary,
  toolbar,
  children,
}: Props) {
  const t = useT();
  const titleId = useId();
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      closeLabel={t("common.close")}
    >
      <div className="shrink-0 border-b border-line bg-surface-3 px-4 pt-2 pb-3 sm:pt-3">
        {/* The swipe-down-to-dismiss affordance, as on the contacts card.
            Phones only: from `sm:` up the modal is a floating card with a
            backdrop to click and an Escape key to press. */}
        <div
          aria-hidden="true"
          className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line sm:hidden"
        />
        <h2
          id={titleId}
          className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-accent uppercase"
        >
          {icon}
          {title}
        </h2>
        {summary && <p className="mt-1 text-sm text-fg-bright">{summary}</p>}
        {toolbar && <div className="mt-3">{toolbar}</div>}
      </div>
      {/* The page ground rather than the modal's own surface: the body is a
          column of the same cards Today is built from, and on the wide layout
          a card on a bare surface reads as a panel inside a panel.

          `bg-page-bg`, not `bg-page`: the token the theme engine writes is
          `--page-bg`, so Tailwind's colour utility for it is spelled with the
          suffix. A bare `bg-page` names no colour, resolves to transparent,
          and silently does nothing. */}
      {/* The body carries the bottom inset itself. With no footer there is no
          safe-area spacer under it either, so without this the last card would
          end under the home indicator. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-page-bg px-4 pt-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">{children}</div>
      </div>
    </Modal>
  );
}
