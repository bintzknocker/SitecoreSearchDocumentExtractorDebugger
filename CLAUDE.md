# SitecoreSearchDocumentExtractorDebugger

A local debugging tool for Sitecore Search **JavaScript document extractors** — the functions Sitecore Search runs against crawled pages to produce index documents (see the [document extractor docs](https://doc.sitecore.com/search/en/users/search-user-guide/configuring-document-extractors.html#using-a-javascript-document-extractor)).

The app lets you paste an `extract(request, response)` function plus sample HTML/JSON input, run it in a sandboxed Node `vm`, and inspect the returned document(s) and any `console` output — without needing a live Sitecore Search crawl.

## Stack

- Next.js 14 (App Router), React 18, TypeScript, strict mode, no CSS framework (plain `app/globals.css`).
- `cheerio` for HTML parsing/querying, matching what Sitecore's extractor runtime provides.
- No test suite, no database, no auth — single-user local tool.

## Structure

- [app/page.tsx](app/page.tsx) — the entire UI: input/request/extractor text areas, run button, result/console output panels, and the snapshot save/load/rename/delete toolbar. Client component (`"use client"`), all state is local `useState`.
- [app/api/execute/route.ts](app/api/execute/route.ts) — `POST` endpoint that actually runs the extractor. Parses the input, builds a `node:vm` sandbox exposing `cheerio`, a pre-loaded `$`, and a `console` that captures log/warn/error into an array instead of printing, evaluates the extractor code, and calls `extract(requestObj, { body: responseBody })`. Returns `{ result, logs, error }` — errors are returned as `200` responses with an `error` string, not HTTP error codes.
- [app/layout.tsx](app/layout.tsx) — root layout, imports `globals.css`.
- [app/globals.css](app/globals.css) — all styling (dark VS Code–like theme); class-based, no CSS modules.
- [globals.d.ts](globals.d.ts) — ambient `declare module "*.css"` so side-effect CSS imports type-check.

## Extractor execution semantics (important, non-obvious)

Sitecore's real runtime hands the extractor an already-loaded document via `response.body`, and extractor code commonly does `$ = response.body;` then queries with `$('#selector')`. To match this:

- For `inputMode === "html"`, `response.body` passed into the sandbox is **`cheerio.load(rawInput)`** (a callable cheerio instance), not the raw HTML string. Passing a plain string here reproduces the `TypeError: $ is not a function` bug this was fixed for.
- For `inputMode === "json"`, `response.body` is the parsed JSON value.
- The sandbox also pre-seeds a global `$` bound to the same loaded document, so extractor code that uses `$` directly (without reassigning from `response.body`) also works.
- The extractor's `request` argument comes from the "Request object (optional)" textarea, parsed as JSON (defaults to `{}`).
- Extractor code is expected to define a top-level `function extract(request, response) { ... }`; the route also supports `module.exports.extract`.

When changing extractor execution behavior, keep both invocation styles (`$` global and `response.body`) working — real extractor scripts in `.claude/resources/pageExtractor/` rely on this pattern.

## Snapshots (localStorage)

Save/load/rename/delete of full debugging sessions (input mode, raw input, request JSON, extractor code) is implemented entirely in [app/page.tsx](app/page.tsx) against `localStorage` under the key `sitecore-extractor-snapshots` — no backend involved. Renaming/saving over an existing name prompts for confirmation via `window.confirm` before overwriting.

## Local resources

`.claude/resources/pageExtractor/` contains real-world sample `input` (large HTML page), `extractorFunction`, and a captured `error` — useful as regression fixtures when touching extractor execution logic.

## Running

```
npm run dev    # http://localhost:3000 (falls back to next free port)
npm run build
npx tsc --noEmit   # typecheck; there is no separate test command
```
