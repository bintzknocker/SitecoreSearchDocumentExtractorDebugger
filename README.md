# Sitecore Search Document Extractor Debugger

Helps with debugging Sitecore Search Document Extractors.

Test a Sitecore Search [JavaScript document extractor](https://doc.sitecore.com/search/en/users/search-user-guide/configuring-document-extractors.html#using-a-javascript-document-extractor) function against sample HTML or JSON input, locally, without needing a live Sitecore Search crawl.

## Getting started

```
npm install
npm run dev
```

Open the printed URL (defaults to `http://localhost:3000`, falls back to the next free port if that's taken).

## Using the tool

1. **Choose an input mode** — `HTML` or `JSON` — using the radio buttons above the Input box.
2. **Paste your sample input** into the **Input** box:
   - In `HTML` mode, this is the raw HTML of the page you're extracting from.
   - In `JSON` mode, this must be valid JSON.
3. *(Optional)* Paste a **Request object** as JSON. This is passed as the `request` argument to your extractor function (defaults to `{}` if left blank).
4. Paste your extractor function into the **Extractor function** box. It must define a top-level function:
   ```js
   function extract(request, response) {
     // In HTML mode, response.body is already loaded into $ for you.
     $ = response.body;

     return {
       title: $('#title').text().trim()
     };
   }
   ```
   - `$` works like cheerio (`$('selector')`, `.text()`, `.attr()`, etc.) — the same convention used by Sitecore's real extractor runtime.
   - In `JSON` mode, `response.body` is the parsed JSON value instead.
   - `console.log` / `console.warn` / `console.error` calls inside your extractor are captured and shown in the **Console output** panel rather than printed to a terminal.
   - Return either a single document object or an array of documents.
5. Click **Run Extractor**. The result appears in the **Result** panel (or an error message/stack trace if the extractor throws or fails to parse), with any console output alongside it.
6. Use **Save Result to File** to download the last successful result as a `.json` file.

## Saving and reusing snapshots

A "snapshot" bundles your current input mode, input, request object, and extractor function so you can save and reload full debugging sessions. Snapshots are stored locally in your browser (`localStorage`) — nothing is sent to a server.

- **Save** — type a name in the Saved Snapshots toolbar and click **Save**. If a snapshot with that name already exists, you'll be asked to confirm before it's overwritten.
- **Load** — pick a snapshot from the dropdown and click **Load** to restore its input mode, input, request object, and extractor function.
- **Rename** — with a snapshot selected, click **Rename** and enter a new name.
- **Delete** — with a snapshot selected, click **Delete** to remove it.
- **Update Snapshot** — after loading a snapshot, editing the extractor function enables an **Update Snapshot** button in the Extractor function panel, letting you push your edits back into that snapshot without re-typing its name.

## Development

```
npm run build       # production build
npm run start        # run the production build
npx tsc --noEmit      # type-check (no separate test suite)
```
