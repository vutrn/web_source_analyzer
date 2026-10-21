import { exportScan } from "./exporter.js";
import { prettyPrintJavaScript } from "./formatter.js";
import { getPopupElements } from "./dom.js";
import type { ScanProgressMessage, ScanResult, ScanStep, ScannedFile } from "./models.js";
import { scanPageSources } from "./scanner.js";

const elements = getPopupElements();
const PREVIEW_LINES = 100;
const PREVIEW_CHARACTERS = 6000;

const state: { files: ScannedFile[]; selectedFileId: string | null; expandedFileId: string | null; searchTerm: string; scanSteps: ScanStep[] } = {
  files: [],
  selectedFileId: null,
  expandedFileId: null,
  searchTerm: "",
  scanSteps: [] as ScanStep[]
};

function resetSessionState(): void {
  state.files = [];
  state.selectedFileId = null;
  state.expandedFileId = null;
  state.searchTerm = "";
  state.scanSteps = [];
}

function setStatus(message: string, tone: "neutral" | "success" | "danger" = "neutral"): void {
  elements.statusMessage.textContent = message;
  elements.statusMessage.style.color = tone === "danger" ? "#f87171" : tone === "success" ? "#34d399" : "#9ca3af";
}

function renderScanSteps(steps: ScanStep[]): void {
  elements.scanProgress.replaceChildren();
  steps.forEach((step) => {
    const item = document.createElement("li");
    item.className = `scan-step scan-step-${step.status}`;
    item.innerHTML = `<span class="scan-step-icon"></span><span class="scan-step-copy"><strong></strong><small></small></span>`;
    item.querySelector("strong")!.textContent = step.label;
    item.querySelector("small")!.textContent = step.detail;
    elements.scanProgress.appendChild(item);
  });
}

function visibleFiles(): ScannedFile[] {
  const term = state.searchTerm.toLowerCase();
  return state.files.filter((file) => `${file.name} ${file.url} ${file.code}`.toLowerCase().includes(term));
}

function updateViewer(file: ScannedFile | undefined): void {
  elements.viewerTitle.textContent = file?.name || "No file selected";
  elements.viewerMeta.textContent = file ? `${file.url} • ${file.status.toUpperCase()} • ${file.size} bytes` : "";
  if (!file) {
    elements.codeViewer.textContent = "Select a file to inspect its code.";
    elements.expandButton.hidden = true;
    return;
  }

  const isExpanded = state.expandedFileId === file.id;
  const hasMore = file.code.length > PREVIEW_CHARACTERS || file.code.split("\n").length > PREVIEW_LINES;
  const preview = file.code.split("\n").slice(0, PREVIEW_LINES).join("\n").slice(0, PREVIEW_CHARACTERS);
  const formattedCode = prettyPrintJavaScript(isExpanded ? file.code : preview);
  const displayedCode = isExpanded ? formattedCode : formattedCode.split("\n").slice(0, PREVIEW_LINES).join("\n");
  elements.codeViewer.textContent = displayedCode || file.error || "No readable source available.";
  elements.expandButton.hidden = !hasMore;
  elements.expandButton.textContent = isExpanded ? "Thu gọn" : "Xem thêm";
}

function renderFiles(): void {
  const files = visibleFiles();
  elements.fileList.replaceChildren();
  if (!files.length) {
    const empty = document.createElement("li");
    empty.className = "file-item";
    empty.textContent = "No matching files";
    elements.fileList.appendChild(empty);
    updateViewer(undefined);
    return;
  }

  if (!state.selectedFileId || !files.some((file) => file.id === state.selectedFileId)) state.selectedFileId = files[0].id;
  files.forEach((file) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `file-item ${file.id === state.selectedFileId ? "active" : ""}`;
    item.innerHTML = `<span class="file-name"></span><span class="file-meta"></span><span class="file-status"></span>`;
    item.querySelector(".file-name")!.textContent = file.name;
    item.querySelector(".file-meta")!.textContent = file.url;
    const status = item.querySelector(".file-status")!;
    status.textContent = file.status;
    status.classList.add(file.status === "ok" ? "status-ok" : file.status === "blocked" ? "status-blocked" : "status-inline");
    item.addEventListener("click", () => {
      state.selectedFileId = file.id;
      state.expandedFileId = null;
      renderFiles();
    });
    elements.fileList.appendChild(item);
  });
  updateViewer(files.find((file) => file.id === state.selectedFileId));
}

async function scanPage(): Promise<void> {
  elements.scanButton.disabled = true;
  setStatus("Scanning page scripts…");
  const scanId = crypto.randomUUID();
  state.files = [];
  state.selectedFileId = null;
  state.expandedFileId = null;
  state.scanSteps = [];
  renderFiles();
  renderScanSteps([]);
  const progressListener = (message: ScanProgressMessage): void => {
    if (message?.type !== "scan-progress" || message.scanId !== scanId) return;
    state.scanSteps.push(message.step);
    if (message.file) {
      const existingIndex = state.files.findIndex((file) => file.id === message.file!.id);
      if (existingIndex >= 0) state.files[existingIndex] = message.file;
      else state.files.push(message.file);
      if (!state.selectedFileId) state.selectedFileId = message.file.id;
      renderFiles();
    }
    renderScanSteps(state.scanSteps);
    setStatus(message.step.detail, message.step.status === "warning" ? "neutral" : "success");
  };
  chrome.runtime.onMessage.addListener(progressListener);
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (typeof tabId !== "number") throw new Error("Open a web page before scanning.");
    renderScanSteps([{ label: "Prepare scan", detail: "Connecting to the active tab…", status: "done" }]);
    const results = await chrome.scripting.executeScript({ target: { tabId }, func: scanPageSources, args: [scanId] });
    const scanResult = results[0]?.result as ScanResult | undefined;
    if (scanResult?.files) state.files = scanResult.files;
    state.scanSteps = scanResult?.steps || [];
    state.selectedFileId = state.files[0]?.id || null;
    state.expandedFileId = null;
    renderScanSteps(state.scanSteps);
    renderFiles();
    setStatus(state.files.length ? `Scanned ${state.files.length} JavaScript resource${state.files.length === 1 ? "" : "s"}.` : "No JavaScript resources were detected on this page.", "success");
  } catch (error) {
    renderScanSteps([{ label: "Scan failed", detail: error instanceof Error ? error.message : "Unknown error", status: "error" }]);
    setStatus(`Scan failed: ${error instanceof Error ? error.message : "unknown error"}`, "danger");
  } finally {
    chrome.runtime.onMessage.removeListener(progressListener);
    elements.scanButton.disabled = false;
  }
}

elements.searchInput.addEventListener("input", () => {
  state.searchTerm = elements.searchInput.value.trim();
  renderFiles();
});
elements.scanButton.addEventListener("click", () => void scanPage());
elements.expandButton.addEventListener("click", () => {
  if (!state.selectedFileId) return;
  state.expandedFileId = state.expandedFileId === state.selectedFileId ? null : state.selectedFileId;
  updateViewer(state.files.find((file) => file.id === state.selectedFileId));
});
elements.exportButton.addEventListener("click", () => {
  if (!state.files.length) return setStatus("There are no files to export yet.");
  exportScan(state.files);
  setStatus("Exported scan results to JSON.", "success");
});
elements.copyButton.addEventListener("click", async () => {
  const file = state.files.find((entry) => entry.id === state.selectedFileId);
  const text = window.getSelection()?.toString() || file?.code || "";
  if (!text) return setStatus("There is no selected or readable code to copy.");
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Code copied to clipboard.", "success");
  } catch {
    setStatus("Clipboard permission was denied.", "danger");
  }
});

window.addEventListener("pagehide", resetSessionState);
renderFiles();
