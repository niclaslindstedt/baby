// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Where the record lives: which backends a build offers, and what a stored
// choice from an older build normalises to.

import { describe, expect, it } from "vitest";

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

  it("no longer answers for the retired Drive backend", () => {
    // A device that had it selected reads back as this device, so the stored
    // preference resolves rather than sticking on a backend that is gone.
    expect(parseBackend("gdrive")).toBe("idb");
  });
});
