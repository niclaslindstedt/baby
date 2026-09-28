// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The backup export, both ways it leaves the page: a download in a browser,
// and the share sheet inside the phone app (the framework's `saveFile` over
// the `save-file` contract). The page is a stand-in — a `window` that is a
// real `EventTarget`, and a `document` that records the anchor it is asked to
// click — so what is pinned is exactly what the framework does with it.

import { afterEach, describe, expect, it, vi } from "vitest";

import { SAVE_FILE_MESSAGE } from "@niclaslindstedt/oss-framework/files";

import {
  backupFileName,
  readBackupFile,
  saveBackup,
} from "../src/app/backup.ts";
import { parseDoc } from "../src/app/migrations.ts";
import { emptyDoc, type AppData } from "../src/app/types.ts";

const TODAY = "2026-09-28";

function doc(): AppData {
  const data = emptyDoc();
  data.diapers["d1"] = {
    id: "d1",
    kind: "pee",
    at: "2026-09-28T07:30:00.000Z",
  };
  return data;
}

type Anchor = { href: string; download: string; rel: string; clicks: number };

/** A browser page: a window with no shell in it, and a document whose
 *  anchors record the download they were clicked for. */
function browser() {
  const anchors: Anchor[] = [];
  const blobs: Blob[] = [];
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("document", {
    createElement: () => {
      const a: Anchor & { click(): void; remove(): void } = {
        href: "",
        download: "",
        rel: "",
        clicks: 0,
        click() {
          this.clicks += 1;
        },
        remove() {},
      };
      anchors.push(a);
      return a;
    },
    body: { appendChild: () => {} },
  });
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    blobs.push(blob as Blob);
    return "blob:backup";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  return { anchors, blobs };
}

/** The phone app's page: the WebView's bridge, and a shell descriptor that
 *  may or may not list `save-file`. Answers every request with `answer`. */
function shell(
  capabilities: string[],
  answer: (id: string) => { ok: boolean; error?: string } | null,
) {
  const posted: Record<string, unknown>[] = [];
  const win = new EventTarget() as EventTarget & Record<string, unknown>;
  win.__ossShell = { version: 1, capabilities };
  win.ReactNativeWebView = {
    postMessage(data: string) {
      const message = JSON.parse(data) as Record<string, unknown>;
      posted.push(message);
      const result = answer(String(message.id));
      if (result) {
        queueMicrotask(() =>
          win.dispatchEvent(
            new CustomEvent("oss-framework/save-file-result", {
              detail: { id: message.id, ...result },
            }),
          ),
        );
      }
    },
  };
  vi.stubGlobal("window", win);
  return { posted };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the backup file", () => {
  it("is named for the day, so a folder of them sorts itself", () => {
    expect(backupFileName(TODAY)).toBe("baby-backup-2026-09-28.json");
  });

  it("reads back as the document it was saved from", async () => {
    const { blobs } = browser();
    await saveBackup(doc(), TODAY);
    const file = new File([blobs[0]!], "backup.json");
    expect(await readBackupFile(file)).toEqual(doc());
  });
});

describe("exporting in a browser", () => {
  it("downloads the pretty-printed document under its dated name", async () => {
    const { anchors, blobs } = browser();
    await expect(saveBackup(doc(), TODAY)).resolves.toBe("downloaded");

    expect(anchors).toHaveLength(1);
    expect(anchors[0]).toMatchObject({
      download: "baby-backup-2026-09-28.json",
      href: "blob:backup",
      clicks: 1,
    });
    expect(blobs[0]!.type).toBe("application/json;charset=utf-8");
    const text = await blobs[0]!.text();
    expect(text).toContain('\n  "diapers"');
    expect(parseDoc(text)).toEqual(doc());
  });

  it("still downloads in a WebView whose shell has not said it takes files", async () => {
    const { posted } = shell([], () => ({ ok: true }));
    vi.stubGlobal("document", {
      createElement: () => ({ click() {}, remove() {} }),
      body: { appendChild: () => {} },
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:backup");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await expect(saveBackup(doc(), TODAY)).resolves.toBe("downloaded");
    expect(posted).toHaveLength(0);
  });
});

describe("exporting in the phone app", () => {
  it("hands the file to the shell's share sheet instead of downloading", async () => {
    const { posted } = shell(["save-file"], () => ({ ok: true }));
    vi.stubGlobal("document", {
      createElement: () => {
        throw new Error("a shell export must not download");
      },
    });

    await expect(saveBackup(doc(), TODAY)).resolves.toBe("shared");

    expect(posted).toHaveLength(1);
    const message = posted[0]!;
    expect(message).toMatchObject({
      type: SAVE_FILE_MESSAGE,
      version: 1,
      filename: "baby-backup-2026-09-28.json",
      mimeType: "application/json",
    });
    const text = Buffer.from(String(message.base64), "base64").toString("utf8");
    expect(parseDoc(text)).toEqual(doc());
  });

  it("rejects when the shell could not share it, so Settings can say so", async () => {
    shell(["save-file"], () => ({ ok: false, error: "No space left." }));
    await expect(saveBackup(doc(), TODAY)).rejects.toThrow("No space left.");
  });
});
