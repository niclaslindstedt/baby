// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useId, type ReactNode } from "react";

import { Button, Modal } from "@niclaslindstedt/oss-framework/components";

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
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-3 px-4 py-3">
          <Button onClick={onClose}>{t("common.close")}</Button>
        </div>
      }
    >
      <div className="shrink-0 border-b border-line bg-surface-3 px-4 py-3">
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
      {/* `bg-page` rather than the modal's own surface: the body is a column
          of the same cards Today is built from, and on the wide layout a card
          on a bare surface reads as a panel inside a panel. The page ground
          puts them on the ground they have everywhere else. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-page px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">{children}</div>
      </div>
    </Modal>
  );
}
