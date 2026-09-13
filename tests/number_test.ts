// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Typing a number: what a measurement field keeps while it is being typed,
// and what the draft it holds turns into. A Swedish scale reads 7,4 kg, so
// the comma has to survive both halves.

import { describe, expect, it } from "vitest";

import { parseNumber, sanitizeDecimal } from "../src/app/number.ts";

describe("sanitizeDecimal", () => {
  it("keeps a draft typed with either separator", () => {
    expect(sanitizeDecimal("7,4")).toBe("7,4");
    expect(sanitizeDecimal("7.4")).toBe("7.4");
    expect(sanitizeDecimal("68,5")).toBe("68,5");
    expect(sanitizeDecimal("")).toBe("");
  });

  it("keeps a half-typed decimal so the separator can be tapped", () => {
    expect(sanitizeDecimal("7,")).toBe("7,");
    expect(sanitizeDecimal(",")).toBe(",");
  });

  it("ignores a second separator and keeps the digits around it", () => {
    expect(sanitizeDecimal("7,4,2")).toBe("7,42");
    expect(sanitizeDecimal("7.4,2")).toBe("7.42");
    expect(sanitizeDecimal("7,4.2")).toBe("7,42");
  });

  it("drops everything a number is not", () => {
    expect(sanitizeDecimal("-7,4")).toBe("7,4");
    expect(sanitizeDecimal("7 kg")).toBe("7");
    expect(sanitizeDecimal("1e3")).toBe("13");
    expect(sanitizeDecimal("abc")).toBe("");
  });
});

describe("parseNumber", () => {
  it("reads both separators as the same number", () => {
    expect(parseNumber("7,4")).toBe(7.4);
    expect(parseNumber("7.4")).toBe(7.4);
    expect(parseNumber("68,5")).toBe(68.5);
    expect(parseNumber(" 42 ")).toBe(42);
  });

  it("treats a half-typed decimal as the whole number so far", () => {
    expect(parseNumber("7,")).toBe(7);
    expect(parseNumber("7.")).toBe(7);
  });

  it("is null for anything that isn't a number", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("   ")).toBeNull();
    expect(parseNumber(",")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
});
