# Sitecore Search Document Extractor Debugger

Helps with debugging Sitecore Search Document Extractors.

Test a Sitecore Search [JavaScript document extractor](https://doc.sitecore.com/search/en/users/search-user-guide/configuring-document-extractors.html#using-a-javascript-document-extractor) function against sample HTML or JSON input, locally, without needing a live Sitecore Search crawl.

**\*\*SECURITY NOTE**\*\*<br/>
***This application is not meant to be deployed to a server.  Instead is meant to be run locally by developers for troubleshooting purposes.  The application contains some security vulnerabilities that could be compromised if deployed publicly.  (eg - Running malicious code inside the Request Extractor code.)  If the desire is to deploy this to a public server, do so at your own risk.***

## Getting started

```
npm install
npm run dev
```

Open the printed URL (defaults to `http://localhost:3000`, falls back to the next free port if that's taken).

## Using the tool

1. **Paste your sample input** into the **Input** box. The tool auto-detects the type: if the input parses as valid JSON, it's treated as JSON; otherwise it's treated as HTML. A **Detected: HTML/JSON** label above the box shows which one was picked.  The input should be either the source of the page that the crawler sends to the document extractor, or the Json from an API crawler.
2. *(Optional)* Paste a **Request object** as JSON. This is passed as the `request` argument to your extractor function (defaults to `{}` if left blank).
3. Paste your extractor function into the **Extractor function** box. It must define a top-level function:
   ```js
   function extract(request, response) {
     // For HTML input, response.body is already loaded into $ for you.
     $ = response.body;

     return {
       title: $('#title').text().trim()
     };
   }
   ```
   - `$` works like cheerio (`$('selector')`, `.text()`, `.attr()`, etc.) — the same convention used by Sitecore's real extractor runtime.
   - For JSON input, `response.body` is the parsed JSON value instead.
   - `console.log` / `console.warn` / `console.error` calls inside your extractor are captured and shown in the **Console output** panel rather than printed to a terminal.
   - Return either a single document object or an array of documents.
4. Click **Run Extractor**. The result appears in the **Result** panel (or an error message/stack trace if the extractor throws or fails to parse), with any console output alongside it.
5. Use **Save Result to File** to download the last successful result as a `.json` file.

## Saving and reusing snapshots

A "snapshot" bundles your current input, request object, and extractor function so you can save and reload full debugging sessions. Snapshots are stored locally in your browser (`localStorage`) — nothing is sent to a server.

- **Save** — type a name in the Saved Snapshots toolbar and click **Save**. If a snapshot with that name already exists, you'll be asked to confirm before it's overwritten.
- **Load** — pick a snapshot from the dropdown and click **Load** to restore its input, request object, and extractor function.
- **Rename** — with a snapshot selected, click **Rename** and enter a new name.
- **Delete** — with a snapshot selected, click **Delete** to remove it. You'll be asked to confirm before it's deleted.
- **Update Snapshot** — after loading a snapshot, editing the extractor function enables an **Update Snapshot** button in the Extractor function panel, letting you push your edits back into that snapshot without re-typing its name.

## Development

```
npm run build       # production build
npm run start        # run the production build
npx tsc --noEmit      # type-check (no separate test suite)
```
