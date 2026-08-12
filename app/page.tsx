"use client";

import { useState } from "react";

const DEFAULT_EXTRACTOR = `function extract(request, response) {
    // response.body is your HTML string or parsed JSON object
    // for HTML, you can do: const $ = cheerio.load(response.body);

    var retVal = [];

    return retVal;
}`;

const DEFAULT_HTML = `<html>
  <body>
    <h1>Sample Title</h1>
    <p class="description">Sample description text.</p>
  </body>
</html>`;

type InputMode = "html" | "json";

interface LogEntry {
  level: "log" | "warn" | "error";
  message: string;
}

interface ExecuteResponse {
  result: unknown;
  logs: LogEntry[];
  error: string | null;
}

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("html");
  const [rawInput, setRawInput] = useState(DEFAULT_HTML);
  const [requestJson, setRequestJson] = useState("{}");
  const [extractorCode, setExtractorCode] = useState(DEFAULT_EXTRACTOR);
  const [response, setResponse] = useState<ExecuteResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  function saveResultToFile() {
    if (!response || response.error) return;
    const blob = new Blob([JSON.stringify(response.result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extractor-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runExtractor() {
    setIsRunning(true);
    setResponse(null);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputMode, rawInput, requestJson, extractorCode }),
      });
      const data = (await res.json()) as ExecuteResponse;
      setResponse(data);
    } catch (err) {
      setResponse({ result: null, logs: [], error: (err as Error).message });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="container">
      <h1>Sitecore Search Document Extractor Debugger</h1>
      <p className="subtitle">
        Test a document extractor function against sample HTML or JSON input.
      </p>

      <div className="grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Input</h2>
            <div className="mode-toggle">
              <label>
                <input
                  type="radio"
                  name="inputMode"
                  value="html"
                  checked={inputMode === "html"}
                  onChange={() => setInputMode("html")}
                />
                HTML
              </label>
              <label>
                <input
                  type="radio"
                  name="inputMode"
                  value="json"
                  checked={inputMode === "json"}
                  onChange={() => setInputMode("json")}
                />
                JSON
              </label>
            </div>
          </div>
          <textarea
            className="code-input"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            spellCheck={false}
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Request object (optional)</h2>
          </div>
          <textarea
            className="code-input small"
            value={requestJson}
            onChange={(e) => setRequestJson(e.target.value)}
            spellCheck={false}
          />
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <h2>Extractor function</h2>
          </div>
          <textarea
            className="code-input tall"
            value={extractorCode}
            onChange={(e) => setExtractorCode(e.target.value)}
            spellCheck={false}
          />
        </section>
      </div>

      <button className="run-button" onClick={runExtractor} disabled={isRunning}>
        {isRunning ? "Running..." : "Run Extractor"}
      </button>

      {response && (
        <div className="grid">
          <section className="panel wide">
            <div className="panel-header">
              <h2>Result</h2>
              <button
                className="save-button"
                onClick={saveResultToFile}
                disabled={!!response.error}
              >
                Save Result to File
              </button>
            </div>
            {response.error ? (
              <pre className="output error">{response.error}</pre>
            ) : (
              <pre className="output">{JSON.stringify(response.result, null, 2)}</pre>
            )}
          </section>

          <section className="panel wide">
            <div className="panel-header">
              <h2>Console output</h2>
            </div>
            <pre className="output">
              {response.logs.length === 0
                ? "(no console output)"
                : response.logs.map((l, i) => `[${l.level}] ${l.message}`).join("\n")}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}
