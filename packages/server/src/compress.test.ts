import { describe, expect, it } from "vitest";
import { ALGORITHMS, compressAll, compressOne, decompress } from "./compress.js";

const SAMPLE = "BustaClaw ".repeat(500);

describe("compressOne", () => {
  it.each(ALGORITHMS)("produces smaller output for repetitive input with %s", (algorithm) => {
    const result = compressOne(algorithm, SAMPLE);
    expect(result.algorithm).toBe(algorithm);
    expect(result.originalBytes).toBe(Buffer.byteLength(SAMPLE));
    expect(result.compressedBytes).toBeLessThan(result.originalBytes);
    expect(result.savingsPercent).toBeGreaterThan(0);
  });

  it.each(ALGORITHMS)("round-trips losslessly with %s", (algorithm) => {
    const result = compressOne(algorithm, SAMPLE);
    const restored = decompress(algorithm, Buffer.from(result.compressedBase64, "base64"));
    expect(restored.toString("utf8")).toBe(SAMPLE);
  });

  it("handles empty input without dividing by zero", () => {
    const result = compressOne("gzip", "");
    expect(result.originalBytes).toBe(0);
    expect(result.ratio).toBe(0);
    expect(result.savingsPercent).toBe(0);
  });
});

describe("compressAll", () => {
  it("returns a result for every algorithm", () => {
    const results = compressAll(SAMPLE);
    expect(results.map((r) => r.algorithm).sort()).toEqual([...ALGORITHMS].sort());
  });
});
