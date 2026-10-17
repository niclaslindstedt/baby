// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Where the record lives: which backends a build offers, and what a stored
// choice from an older build normalises to.

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AVAILABLE_BACKENDS,
  LOCAL_BACKEND,
  parseBackend,
} from "../src/app/useSyncEngine.ts";

describe("parseBackend", () => {
  it("keeps a backend this build still offers", () => {
    expect(parseBackend("folder")).toBe("folder");
    expect(parseBackend("dropbox")).toBe("dropbox");
    expect(parseBackend("idb")).toBe("idb");
  });

  it("reads the retired 'local' choice as this device", () => {
    // Older builds offered "This device" (which connected nothing) beside
    // "IndexedDB". Both were this device; the merged choice is this device,
    // and the record in localStorage is pushed into IndexedDB on the first
    // pull rather than being touched here.
    expect(parseBackend("local")).toBe("idb");
    expect(LOCAL_BACKEND).toBe("idb");
  });

  it("reads a stored iCloud choice as this device", () => {
    // A pre-release phone build offered iCloud Drive. The app keeps a child's
    // health data out of iCloud (App Store guideline 5.1.3(ii)), so that
    // choice lands on this device — never on a backend that no longer exists.
    expect(parseBackend("icloud")).toBe(LOCAL_BACKEND);
  });

  it("falls back to this device for anything unreadable", () => {
    // Never a backend the build can't serve, and never nothing: a picker
    // with no value selected is worse than the one choice that always works.
    expect(parseBackend(null)).toBe(LOCAL_BACKEND);
    expect(parseBackend(undefined)).toBe(LOCAL_BACKEND);
    expect(parseBackend("")).toBe(LOCAL_BACKEND);
    expect(parseBackend("s3")).toBe(LOCAL_BACKEND);
    expect(parseBackend(7)).toBe(LOCAL_BACKEND);
  });
});

describe("AVAILABLE_BACKENDS", () => {
  it("always offers this device, and offers it first", () => {
    expect(AVAILABLE_BACKENDS[0]).toBe(LOCAL_BACKEND);
  });

  it("hides the folder picker where the browser has none", () => {
    // Node has no `window.showDirectoryPicker`, which is the same answer a
    // phone browser gives — so the choice is not on the list rather than on
    // it and failing when tapped.
    expect(AVAILABLE_BACKENDS).not.toContain("folder");
  });

  it("hides a cloud provider this build has no client id for", () => {
    // The test environment configures none, so none is offered.
    expect(AVAILABLE_BACKENDS).not.toContain("dropbox");
  });

  it("never offers iCloud", () => {
    expect(AVAILABLE_BACKENDS as string[]).not.toContain("icloud");
  });

  it("no longer answers for the retired Drive backend", () => {
    // A device that had it selected reads back as this device, so the stored
    // preference resolves rather than sticking on a backend that is gone.
    expect(parseBackend("gdrive")).toBe("idb");
  });
});

describe("the phone build", () => {
  // The store app keeps the record on the device: its build leaves Dropbox
  // out whatever key the environment holds, while the website and the
  // desktop app offer it exactly as before.
  async function build(env: Record<string, string>) {
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
    vi.resetModules();
    return import("../src/app/useSyncEngine.ts");
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("offers no Dropbox, even with a key configured", async () => {
    const sync = await build({
      VITE_NATIVE_BUILD: "on",
      VITE_DROPBOX_APP_KEY: "key",
    });
    expect(sync.PHONE_BUILD).toBe(true);
    expect(sync.DROPBOX_APP_KEY).toBe("");
    expect(sync.AVAILABLE_BACKENDS).toEqual(["idb"]);
  });

  it("reads a Dropbox choice left by a pre-release install as this device", async () => {
    const sync = await build({
      VITE_NATIVE_BUILD: "on",
      VITE_DROPBOX_APP_KEY: "key",
    });
    expect(sync.parseBackend("dropbox")).toBe(sync.LOCAL_BACKEND);
    expect(sync.parseBackend("idb")).toBe("idb");
  });

  it("leaves the website's Dropbox as it was", async () => {
    const sync = await build({ VITE_DROPBOX_APP_KEY: "key" });
    expect(sync.PHONE_BUILD).toBe(false);
    expect(sync.DROPBOX_APP_KEY).toBe("key");
    expect(sync.AVAILABLE_BACKENDS).toContain("dropbox");
    expect(sync.parseBackend("dropbox")).toBe("dropbox");
  });

  it("is the build the phone wrapper makes, and only that one", async () => {
    // The desktop shell sets the embedded flag too, never the native one.
    const desktop = await build({
      VITE_EMBEDDED_BUILD: "on",
      VITE_SHELL_BUILD: "on",
      VITE_DROPBOX_APP_KEY: "key",
    });
    expect(desktop.AVAILABLE_BACKENDS).toContain("dropbox");
  });
});
