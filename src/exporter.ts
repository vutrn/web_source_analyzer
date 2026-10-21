import type { ScanExport, ScannedFile } from "./models.js";

export function exportScan(files: ScannedFile[]): void {
  const payload: ScanExport = { exportedAt: new Date().toISOString(), files };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "web-flow-analyzer-export.json";
  link.click();
  URL.revokeObjectURL(url);
}
