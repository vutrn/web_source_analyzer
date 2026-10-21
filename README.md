# Web Flow Analyzer

Web Flow Analyzer is a Manifest V3 Chrome extension designed to inspect JavaScript resources that are currently loaded by the active web page. It helps users surface script files, review their code in a readable format, search for patterns, and export the collected scan results.

## Features

- Collects JavaScript script and bundle URLs visible to the active tab
- Reads inline and external JavaScript when accessible to the browser
- Attempts to resolve `sourceMappingURL` references when the map is retrievable
- Formats minified scripts into a more readable structure for review
- Lets users search file names and code contents
- Supports code selection and copying
- Exports collected source and results as JSON
- Reports inaccessible or blocked resources instead of silently hiding them
- Shows the scan process incrementally, adding each file and step as it is discovered/read, including source-map availability and completion status
- Limits the collapsed code preview to 100 lines; the full source remains available through `Xem thêm`
- Popup state is session-only: closing the extension popup resets scanned files, search, selection, and scan progress

## Usage

1. Open Chrome and navigate to a page with JavaScript loaded.
2. Open the extension popup from the toolbar.
3. Click `Scan Page` to load script metadata and content.
4. Use the file list to browse collected JavaScript and the search box to filter by name or content.
5. Select a file to inspect, copy text, or export the scan results.

## Notes

- The extension reads browser-visible JavaScript and does not modify page behavior.
- Cross-origin or restricted scripts may fail to load because of browser security policies; those failures are surfaced in the UI.
- Source maps are only used when the browser can fetch the referenced map successfully.
- The extension does not reconstruct unavailable original sources or automatically analyze user interactions.

## Loading the extension in Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Choose `Load unpacked`.
4. Select this project directory.

## Project structure

- `manifest.json` – Manifest V3 configuration
- `popup.html` / `popup.css` – popup shell and styling
- `src/` – TypeScript modules for the popup UI, scanner, formatter, exporter, DOM access, and models
- `dist/` – generated JavaScript consumed by Chrome
- `README.md` – usage instructions

## Scripts

Install dependencies with `npm install`, then run `npm run build`. Load the project directory in Chrome after building. Use `npm run typecheck` to validate the TypeScript without emitting files.
