import { useMemo, useState } from "react";

interface CompressionResult {
  algorithm: "gzip" | "deflate" | "brotli";
  originalBytes: number;
  compressedBytes: number;
  ratio: number;
  savingsPercent: number;
  compressedBase64: string;
}

interface CompressResponse {
  originalBytes: number;
  results: CompressionResult[];
  best: CompressionResult["algorithm"];
}

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. `.repeat(24);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function App() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [response, setResponse] = useState<CompressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputBytes = useMemo(() => new TextEncoder().encode(text).length, [text]);

  async function handleCompress() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed with ${res.status}`);
      }
      setResponse((await res.json()) as CompressResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  const maxSavings = response
    ? Math.max(...response.results.map((r) => r.savingsPercent), 1)
    : 1;

  return (
    <div className="app">
      <header className="hero">
        <div className="logo">🦞 BustaClaw</div>
        <h1>Compression Playground</h1>
        <p className="subtitle">
          Paste any text and see how <strong>gzip</strong>, <strong>deflate</strong>, and{" "}
          <strong>brotli</strong> stack up in real time.
        </p>
      </header>

      <section className="panel">
        <div className="panel-head">
          <label htmlFor="input">Input</label>
          <span className="byte-badge">{formatBytes(inputBytes)}</span>
        </div>
        <textarea
          id="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text to compress…"
          rows={8}
        />
        <div className="actions">
          <button className="primary" onClick={handleCompress} disabled={loading || inputBytes === 0}>
            {loading ? "Compressing…" : "Compress"}
          </button>
          <button className="ghost" onClick={() => setText(SAMPLE_TEXT)} disabled={loading}>
            Load sample
          </button>
          <button
            className="ghost"
            onClick={() => {
              setText("");
              setResponse(null);
            }}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </section>

      {error && <div className="error">⚠️ {error}</div>}

      {response && (
        <section className="results">
          <h2>
            Original size: <span>{formatBytes(response.originalBytes)}</span>
          </h2>
          <div className="cards">
            {response.results.map((result) => {
              const isBest = result.algorithm === response.best;
              return (
                <article
                  key={result.algorithm}
                  className={`card ${isBest ? "best" : ""}`}
                  data-testid={`result-${result.algorithm}`}
                >
                  <div className="card-head">
                    <h3>{result.algorithm}</h3>
                    {isBest && <span className="tag">Best</span>}
                  </div>
                  <div className="savings">{result.savingsPercent.toFixed(1)}%</div>
                  <div className="savings-label">smaller</div>
                  <div className="bar">
                    <div
                      className="bar-fill"
                      style={{ width: `${(result.savingsPercent / maxSavings) * 100}%` }}
                    />
                  </div>
                  <dl className="stats">
                    <div>
                      <dt>Compressed</dt>
                      <dd>{formatBytes(result.compressedBytes)}</dd>
                    </div>
                    <div>
                      <dt>Ratio</dt>
                      <dd>{result.ratio.toFixed(3)}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <footer className="footer">
        Built with Node, Express, React &amp; Vite · powered by the platform&apos;s zlib codecs
      </footer>
    </div>
  );
}
