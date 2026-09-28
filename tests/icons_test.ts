// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The phone app's icon is the one image the App Store refuses with an alpha
// channel, even a fully opaque one. `scripts/generate-icons.mjs` writes it as
// RGB; this pins the committed file, so a hand-edited or regenerated-wrong
// icon fails here rather than at upload.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ICON = join(import.meta.dirname, "..", "native", "assets", "icon.png");

/** The chunk types of a PNG, in order. */
function chunkTypes(png: Buffer): string[] {
  const types: string[] = [];
  let pos = 8;
  while (pos + 8 <= png.length) {
    const length = png.readUInt32BE(pos);
    types.push(png.toString("ascii", pos + 4, pos + 8));
    pos += 12 + length;
  }
  return types;
}

describe("the phone app's icon", () => {
  const png = readFileSync(ICON);

  it("is a 1024×1024 PNG", () => {
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(png.readUInt32BE(16)).toBe(1024);
    expect(png.readUInt32BE(20)).toBe(1024);
  });

  it("has no alpha channel", () => {
    // IHDR's colour type: 2 is RGB; 4 and 6 carry alpha.
    expect(png[25]).toBe(2);
    // …and no transparency chunk standing in for one.
    expect(chunkTypes(png)).not.toContain("tRNS");
  });
});
