export async function scanPageSources(scanId = "") {
    const steps = [];
    const addStep = (label, detail, status = "done", file) => {
        const step = { label, detail, status };
        steps.push(step);
        const message = { type: "scan-progress", scanId, step, file };
        if (scanId && typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            void chrome.runtime.sendMessage(message);
        }
    };
    const createSafeFileName = (url, fallback) => {
        try {
            const parsed = new URL(url);
            const segments = parsed.pathname.split("/").filter(Boolean);
            return segments.length ? decodeURIComponent(segments[segments.length - 1]) : fallback;
        }
        catch {
            return fallback;
        }
    };
    const extractSourceMapUrl = (sourceText) => {
        const match = sourceText.match(/(?:\/\/[@#][ \t]*sourceMappingURL=([^\s'"]+)|\/\*[@#][ \t]*sourceMappingURL=([^\s*]+)[ \t]*\*\/)/);
        return match ? match[1] || match[2] : null;
    };
    const fetchSourceMap = async (sourceMapUrl, scriptUrl) => {
        try {
            const url = /^https?:\/\//i.test(sourceMapUrl) ? sourceMapUrl : new URL(sourceMapUrl, scriptUrl).href;
            const response = await fetch(url, { cache: "no-store", credentials: "include" });
            if (!response.ok)
                return null;
            const payload = (await response.json());
            return {
                url,
                sources: payload.sources || [],
                hasSourcesContent: Array.isArray(payload.sourcesContent) && payload.sourcesContent.length > 0,
                file: payload.file || "",
                version: payload.version || null
            };
        }
        catch {
            return null;
        }
    };
    const entries = [];
    const seenUrls = new Set();
    const addEntry = (entry) => {
        entries.push({
            id: `${entry.url || entry.name}-${Math.random().toString(16).slice(2)}`,
            name: entry.name,
            url: entry.url,
            status: entry.status || "ok",
            code: entry.code || "",
            size: entry.size || 0,
            error: entry.error || "",
            sourceMap: entry.sourceMap || null,
            sourceMapStatus: entry.sourceMapStatus || "unavailable"
        });
    };
    Array.from(document.scripts).forEach((script, index) => {
        if (script.src) {
            const url = new URL(script.src, window.location.href).href;
            if (!seenUrls.has(url)) {
                seenUrls.add(url);
                addEntry({ name: createSafeFileName(url, `script-${index + 1}.js`), url, status: "ok" });
            }
            return;
        }
        const code = (script.text || "").trim();
        if (code)
            addEntry({ name: `inline-script-${index + 1}.js`, url: "inline", code, status: "inline", size: code.length });
    });
    Array.from(performance.getEntriesByType("resource")).forEach((entry) => {
        const resource = entry;
        if (!resource.name || !/\.(?:js|mjs)(?:\?.*)?$/i.test(resource.name))
            return;
        const url = new URL(resource.name, window.location.href).href;
        if (!seenUrls.has(url)) {
            seenUrls.add(url);
            addEntry({ name: createSafeFileName(url, "resource.js"), url, status: "ok" });
        }
    });
    addStep("Collect resources", `${entries.length} JavaScript resource${entries.length === 1 ? "" : "s"} detected.`);
    const results = [];
    for (const item of entries) {
        if (item.status === "inline") {
            results.push(item);
            addStep("Read inline source", `${item.name} (${item.size} bytes)`, "done", item);
            continue;
        }
        try {
            const response = await fetch(item.url, { cache: "no-store", credentials: "include" });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const code = await response.text();
            const sourceMapUrl = extractSourceMapUrl(code);
            const sourceMap = sourceMapUrl ? await fetchSourceMap(sourceMapUrl, item.url) : null;
            results.push({ ...item, status: "ok", code, size: code.length, sourceMap, sourceMapStatus: sourceMap ? "available" : "missing" });
            const scannedFile = results[results.length - 1];
            addStep("Read source", `${item.name} (${code.length} bytes)`, "done", scannedFile);
            if (sourceMapUrl) {
                addStep("Source map", sourceMap ? `${item.name}: source map available.` : `${item.name}: source map unavailable.`, sourceMap ? "done" : "warning");
            }
        }
        catch (error) {
            const blockedFile = { ...item, status: "blocked", code: "", size: 0, error: error instanceof Error ? error.message : "Resource could not be read.", sourceMap: null, sourceMapStatus: "unavailable" };
            results.push(blockedFile);
            addStep("Read source", `${item.name}: ${blockedFile.error}`, "warning", blockedFile);
        }
    }
    addStep("Complete", `${results.filter((file) => file.status !== "blocked").length}/${results.length} resources readable.`);
    return { files: results, steps };
}
