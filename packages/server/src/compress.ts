import zlib from "node:zlib";

export type Algorithm = "gzip" | "deflate" | "brotli";

export const ALGORITHMS: Algorithm[] = ["gzip", "deflate", "brotli"];

export interface CompressionResult {
  algorithm: Algorithm;
  originalBytes: number;
  compressedBytes: number;
  /** Ratio of compressed size to original size (0-1). Lower is better. */
  ratio: number;
  /** Percentage of size saved compared to the original. Higher is better. */
  savingsPercent: number;
  /** Base64 encoding of the compressed payload. */
  compressedBase64: string;
}

function compressWith(algorithm: Algorithm, input: Buffer): Buffer {
  switch (algorithm) {
    case "gzip":
      return zlib.gzipSync(input, { level: zlib.constants.Z_BEST_COMPRESSION });
    case "deflate":
      return zlib.deflateSync(input, { level: zlib.constants.Z_BEST_COMPRESSION });
    case "brotli":
      return zlib.brotliCompressSync(input, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
        },
      });
    default: {
      const exhaustive: never = algorithm;
      throw new Error(`Unsupported algorithm: ${String(exhaustive)}`);
    }
  }
}

/**
 * Compress `input` with a single algorithm and return size statistics.
 */
export function compressOne(algorithm: Algorithm, input: string | Buffer): CompressionResult {
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  const compressed = compressWith(algorithm, source);
  const originalBytes = source.byteLength;
  const compressedBytes = compressed.byteLength;
  const ratio = originalBytes === 0 ? 0 : compressedBytes / originalBytes;
  const savingsPercent = originalBytes === 0 ? 0 : (1 - ratio) * 100;

  return {
    algorithm,
    originalBytes,
    compressedBytes,
    ratio: Number(ratio.toFixed(4)),
    savingsPercent: Number(savingsPercent.toFixed(2)),
    compressedBase64: compressed.toString("base64"),
  };
}

/**
 * Compress `input` with every supported algorithm.
 */
export function compressAll(input: string | Buffer): CompressionResult[] {
  return ALGORITHMS.map((algorithm) => compressOne(algorithm, input));
}

/**
 * Round-trip helper used by tests to prove compression is lossless.
 */
export function decompress(algorithm: Algorithm, compressed: Buffer): Buffer {
  switch (algorithm) {
    case "gzip":
      return zlib.gunzipSync(compressed);
    case "deflate":
      return zlib.inflateSync(compressed);
    case "brotli":
      return zlib.brotliDecompressSync(compressed);
    default: {
      const exhaustive: never = algorithm;
      throw new Error(`Unsupported algorithm: ${String(exhaustive)}`);
    }
  }
}
