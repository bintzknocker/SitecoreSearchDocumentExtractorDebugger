"use client";

import { useEffect, useState } from "react";

const SNAPSHOTS_KEY = "sitecore-extractor-snapshots";

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

interface Snapshot {
  id: string;
  name: string;
  createdAt: number;
  inputMode: InputMode;
  rawInput: string;
  requestJson: string;
  extractorCode: string;
}

function loadSnapshots(): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSnapshots(snapshots: Snapshot[]) {
  window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("html");
  const [rawInput, setRawInput] = useState(DEFAULT_HTML);
  const [requestJson, setRequestJson] = useState("{}");
  const [extractorCode, setExtractorCode] = useState(DEFAULT_EXTRACTOR);
  const [response, setResponse] = useState<ExecuteResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");

  useEffect(() => {
    setSnapshots(loadSnapshots());
  }, []);

  function saveSnapshot() {
    const name = snapshotName.trim();
    if (!name) return;

    const existing = snapshots.find((s) => s.name === name);
    if (existing) {
      const confirmed = window.confirm(
        `A snapshot named "${name}" already exists. Overwrite it?`
      );
      if (!confirmed) return;
    }

    const newSnapshot: Snapshot = {
      id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      createdAt: Date.now(),
      inputMode,
      rawInput,
      requestJson,
      extractorCode,
    };

    const next = existing
      ? snapshots.map((s) => (s.id === existing.id ? newSnapshot : s))
      : [...snapshots, newSnapshot];

    setSnapshots(next);
    persistSnapshots(next);
    setSelectedSnapshotId(newSnapshot.id);
  }

  function loadSnapshot() {
    const snapshot = snapshots.find((s) => s.id === selectedSnapshotId);
    if (!snapshot) return;
    setInputMode(snapshot.inputMode);
    setRawInput(snapshot.rawInput);
    setRequestJson(snapshot.requestJson);
    setExtractorCode(snapshot.extractorCode);
  }

  function deleteSnapshot() {
    const snapshot = snapshots.find((s) => s.id === selectedSnapshotId);
    if (!snapshot) return;
    const next = snapshots.filter((s) => s.id !== snapshot.id);
    setSnapshots(next);
    persistSnapshots(next);
    setSelectedSnapshotId("");
  }

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

      <section className="panel snapshot-bar">
        <div className="panel-header">
          <h2>Saved Snapshots</h2>
        </div>
        <div className="snapshot-controls">
          <input
            type="text"
            className="snapshot-name-input"
            placeholder="Snapshot name"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
          />
          <button className="save-button" onClick={saveSnapshot} disabled={!snapshotName.trim()}>
            Save
          </button>

          <select
            className="snapshot-select"
            value={selectedSnapshotId}
            onChange={(e) => setSelectedSnapshotId(e.target.value)}
          >
            <option value="">Select a snapshot…</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({new Date(s.createdAt).toLocaleString()})
              </option>
            ))}
          </select>
          <button className="save-button" onClick={loadSnapshot} disabled={!selectedSnapshotId}>
            Load
          </button>
          <button className="save-button" onClick={deleteSnapshot} disabled={!selectedSnapshotId}>
            Delete
          </button>
        </div>
      </section>

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
