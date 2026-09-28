// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The phone app's wordmark is its store name; the website and the desktop app
// keep the project's. `app-name.ts` decides, from the variables the bundle
// scripts set.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { appName, PROJECT_NAME } from "../app-name.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("appName", () => {
  const phone = { VITE_EMBEDDED_BUILD: "on" };

  it("is the listing name in the phone build", () => {
    expect(appName({ ...phone, APP_DISPLAY_NAME: "Nird Baby" })).toBe(
      "Nird Baby",
    );
    expect(appName({ ...phone, APP_DISPLAY_NAME: "  Nird Baby " })).toBe(
      "Nird Baby",
    );
  });

  it("falls back to the project name when the listing name is unset", () => {
    expect(appName(phone)).toBe(PROJECT_NAME);
    expect(appName({ ...phone, APP_DISPLAY_NAME: " " })).toBe(PROJECT_NAME);
  });

  it("stays the project name on the website and in the desktop app", () => {
    expect(appName({ APP_DISPLAY_NAME: "Nird Baby" })).toBe("Baby");
    expect(
      appName({
        VITE_EMBEDDED_BUILD: "on",
        VITE_SHELL_BUILD: "on",
        APP_DISPLAY_NAME: "Nird Baby",
      }),
    ).toBe("Baby");
  });

  it("is what the phone bundle is built with", () => {
    const script = readFileSync(
      join(root, "native", "scripts", "bundle-web.mjs"),
      "utf8",
    );
    expect(script).toMatch(/APP_DISPLAY_NAME: DISPLAY_NAME/);
    expect(script).toMatch(/VITE_EMBEDDED_BUILD: "on"/);
    expect(script).not.toMatch(/VITE_SHELL_BUILD/);
  });
});
