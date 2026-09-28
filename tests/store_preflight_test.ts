// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// `make store-preflight` reads the bundle id the way the build does.
//
// The id is a build variable (APP_BUNDLE_ID, resolved in
// `native/identifiers.js`), never a literal in `app.config.js`, and the
// fastlane Appfile reads the same variable. The preflight once looked for the
// literal and reported that it "could not read BUNDLE_ID" on every run; this
// pins that it follows the variable instead.

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function preflight(env: Record<string, string | undefined>): string {
  const merged: Record<string, string | undefined> = { ...process.env, ...env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete merged[key];
  }
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--disable-warning=ExperimentalWarning",
      join(root, "scripts", "store-preflight.mjs"),
    ],
    { cwd: root, encoding: "utf8", env: merged },
  );
  expect(run.stderr).toBe("");
  return run.stdout;
}

describe("store-preflight's bundle id", () => {
  it("reads APP_BUNDLE_ID and finds fastlane reading it too", () => {
    const out = preflight({ APP_BUNDLE_ID: "se.example.baby" });
    expect(out).not.toContain("could not read");
    expect(out).toContain(
      "✓ bundle id se.example.baby, read by fastlane as by the build",
    );
  });

  it("never fails to read the development id", () => {
    const out = preflight({ APP_BUNDLE_ID: undefined });
    expect(out).not.toContain("could not read");
    expect(out).not.toContain("bundle id drift");
  });
});
