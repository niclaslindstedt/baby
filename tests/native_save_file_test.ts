// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The save-file bridge (`native/src/saveFileProtocol.ts`) against the
// framework's side of the contract (`saveFile` in
// `@niclaslindstedt/oss-framework/files`).
//
// Like the sign-in bridge, every failure here is silent: a descriptor the
// framework cannot read leaves the page downloading into a WebView that
// ignores downloads, and a result script with the wrong event name leaves the
// export waiting forever — on a build nobody can run without Xcode. So the
// injected scripts are RUN against a stand-in for the WebView's window, and
// a backup export is walked from the page to the share sheet and back.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SAVE_FILE_MESSAGE,
  SAVE_FILE_RESULT_EVENT,
} from "@niclaslindstedt/oss-framework/files";
import {
  isNativeShell,
  nativeShellCan,
} from "@niclaslindstedt/oss-framework/pwa";

import {
  SAVE_FILE_DESCRIPTOR,
  SAVE_FILE_TYPE,
  bareName,
  isSaveFileRequest,
  saveFileResultScript,
} from "../native/src/saveFileProtocol.ts";
import { saveBackup } from "../src/app/backup.ts";
import { emptyDoc } from "../src/app/types.ts";

const native = join(dirname(fileURLToPath(import.meta.url)), "..", "native");

type ShellWindow = EventTarget & Record<string, unknown>;

/** The WebView's window before the page runs: the bridge
 *  `react-native-webview` installs, and whatever descriptor is already there. */
function webViewWindow(descriptor?: unknown): {
  win: ShellWindow;
  posted: string[];
} {
  const posted: string[] = [];
  const win = new EventTarget() as ShellWindow;
  win.ReactNativeWebView = { postMessage: (data: string) => posted.push(data) };
  if (descriptor !== undefined) win.__ossShell = descriptor;
  return { win, posted };
}

/** Run an injected script against `win`, the way the WebView would. */
function run(script: string, win: ShellWindow): void {
  new Function("window", "CustomEvent", script)(win, CustomEvent);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the names", () => {
  it("are the framework's", () => {
    expect(SAVE_FILE_TYPE).toBe(SAVE_FILE_MESSAGE);
    expect(saveFileResultScript("x", true)).toContain(
      JSON.stringify(SAVE_FILE_RESULT_EVENT),
    );
  });
});

describe("the descriptor", () => {
  it("tells the framework the shell takes files", () => {
    const { win } = webViewWindow();
    run(SAVE_FILE_DESCRIPTOR, win);
    vi.stubGlobal("window", win);
    expect(isNativeShell()).toBe(true);
    expect(nativeShellCan("save-file")).toBe(true);
  });

  it("joins a descriptor another contract set, once", () => {
    const { win } = webViewWindow({ version: 1, capabilities: ["other"] });
    run(SAVE_FILE_DESCRIPTOR, win);
    run(SAVE_FILE_DESCRIPTOR, win); // a reload re-runs it
    expect(win.__ossShell).toEqual({
      version: 1,
      capabilities: ["other", "save-file"],
    });
  });

  it("imports nothing, since the root tests load it without native/'s dependencies", () => {
    const source = readFileSync(
      join(native, "src", "saveFileProtocol.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/^\s*import\b/m);
  });
});

describe("a request", () => {
  it("is recognised in the shape the framework sends", () => {
    expect(
      isSaveFileRequest({
        type: SAVE_FILE_MESSAGE,
        version: 1,
        id: "sf1",
        filename: "baby-backup-2026-09-28.json",
        mimeType: "application/json",
        base64: "e30=",
      }),
    ).toBe(true);
  });

  it("is not confused with the page's other messages", () => {
    expect(isSaveFileRequest(null)).toBe(false);
    expect(isSaveFileRequest({ type: "baby-native/theme" })).toBe(false);
    expect(
      isSaveFileRequest({ type: SAVE_FILE_MESSAGE, id: "sf1", filename: "a" }),
    ).toBe(false);
  });

  it("never names a path outside the export directory", () => {
    expect(bareName("baby-backup.json")).toBe("baby-backup.json");
    expect(bareName("../../Documents/x.json")).toBe("x.json");
    expect(bareName("a\\b.json")).toBe("b.json");
    expect(bareName("..")).toBe("file");
    expect(bareName("dir/")).toBe("file");
  });
});

describe("a backup export in the phone app", () => {
  it("goes to the shell and settles on its answer", async () => {
    const { win, posted } = webViewWindow();
    run(SAVE_FILE_DESCRIPTOR, win);
    vi.stubGlobal("window", win);

    const exported = saveBackup(emptyDoc(), "2026-09-28");
    await vi.waitFor(() => expect(posted).toHaveLength(1));

    const request = JSON.parse(posted[0]!) as unknown;
    expect(isSaveFileRequest(request)).toBe(true);
    if (!isSaveFileRequest(request)) return;
    expect(bareName(request.filename)).toBe("baby-backup-2026-09-28.json");

    run(saveFileResultScript(request.id, true), win);
    await expect(exported).resolves.toBe("shared");
  });

  it("rejects with the shell's error when sharing failed", async () => {
    const { win, posted } = webViewWindow();
    run(SAVE_FILE_DESCRIPTOR, win);
    vi.stubGlobal("window", win);

    const exported = saveBackup(emptyDoc(), "2026-09-28");
    await vi.waitFor(() => expect(posted).toHaveLength(1));
    const { id } = JSON.parse(posted[0]!) as { id: string };

    run(saveFileResultScript("someone-else", true), win); // not this export
    run(saveFileResultScript(id, false, "Sharing is not available."), win);
    await expect(exported).rejects.toThrow("Sharing is not available.");
  });
});

describe("the wrapper", () => {
  const app = readFileSync(join(native, "App.tsx"), "utf8");

  it("advertises the contract before the page loads", () => {
    expect(app).toMatch(
      /injectedJavaScriptBeforeContentLoaded=\{`\$\{BEFORE_LOAD_SCRIPT\}\\n\$\{SAVE_FILE_DESCRIPTOR\}`\}/,
    );
  });

  it("answers the request it advertised", () => {
    expect(app).toMatch(
      /if \(isSaveFileRequest\(parsed\)\) \{\s*void answerSaveFile\(parsed,/,
    );
  });

  it("never sends a blob: or data: URL to the system browser", () => {
    const guard = app.indexOf(
      "if (/^(blob|data):/i.test(request.url)) return false;",
    );
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(
      app.indexOf("void Linking.openURL(request.url)"),
    );
  });
});
