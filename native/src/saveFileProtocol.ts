// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// THE SAVE-FILE CONTRACT, THE WRAPPER'S SIDE OF THE WORDS.
//
// A backup export in a browser is a download: an anchor clicked at a `blob:`
// URL. Inside the WebView that click goes nowhere, so the framework's
// `saveFile` (`@niclaslindstedt/oss-framework/files`) sends the bytes here
// instead — but only when this wrapper has said it can take them, in the
// descriptor below. The contract is the framework's
// (`docs/native-shell.md`, "Contract `save-file`"); the names here are its
// names, and `tests/native_save_file_test.ts` pins them against it.
//
// This file exports STRINGS for the page (dependency-free, ES5-ish — nothing
// in them is transpiled) plus the pure narrowing and settling helpers. It is
// exercised from the root test suite, so it imports nothing that reaches
// `expo`; the effect — writing the file and opening the share sheet — is
// `saveFileBridge.ts`.

export const SAVE_FILE_TYPE = "oss-framework/save-file";
const RESULT_EVENT = "oss-framework/save-file-result";

/** Injected before the page loads, beside the other before-load script: it
 *  adds `save-file` to the shell descriptor the framework reads. */
export const SAVE_FILE_DESCRIPTOR = `(function () {
  var shell = window.__ossShell || { version: 1, capabilities: [] };
  if (shell.capabilities.indexOf("save-file") < 0) shell.capabilities.push("save-file");
  window.__ossShell = shell;
})(); true;`;

export type SaveFileRequest = {
  type: string;
  version: number;
  id: string;
  filename: string;
  mimeType: string;
  base64: string;
};

export function isSaveFileRequest(value: unknown): value is SaveFileRequest {
  const m = value as Partial<SaveFileRequest> | null;
  return (
    typeof m === "object" &&
    m !== null &&
    m.type === SAVE_FILE_TYPE &&
    typeof m.id === "string" &&
    typeof m.filename === "string" &&
    typeof m.mimeType === "string" &&
    typeof m.base64 === "string"
  );
}

/** iOS picks share targets by UTI, not MIME type. The backup is JSON; the
 *  rest are the framework reference's, kept so a later export needs no
 *  change here. */
export const UTI: Record<string, string> = {
  "application/json": "public.json",
  "application/pdf": "com.adobe.pdf",
  "application/zip": "public.zip-archive",
  "image/jpeg": "public.jpeg",
  "image/png": "public.png",
  "image/svg+xml": "public.svg-image",
  "text/calendar": "public.calendar-event",
  "text/csv": "public.comma-separated-values-text",
  "text/markdown": "net.daringfireball.markdown",
  "text/plain": "public.plain-text",
  "text/vcard": "public.vcard",
};

/** Never trust the name: its last path component, or `file`. */
export function bareName(name: string): string {
  const last = name.split(/[\\/]/).pop()?.trim() ?? "";
  return last === "" || last === "." || last === ".." ? "file" : last;
}

/** The script that settles the page's promise. */
export function saveFileResultScript(
  id: string,
  ok: boolean,
  error?: string,
): string {
  const detail = ok ? { id, ok } : { id, ok, error };
  return `window.dispatchEvent(new CustomEvent(${JSON.stringify(
    RESULT_EVENT,
  )}, { detail: ${JSON.stringify(detail)} })); true;`;
}
