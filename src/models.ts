export type FileStatus = "ok" | "blocked" | "inline";

export interface SourceMapInfo {
  url: string;
  sources: string[];
  hasSourcesContent: boolean;
  file: string;
  version: number | null;
}

export interface ScannedFile {
  id: string;
  name: string;
  url: string;
  status: FileStatus;
  code: string;
  size: number;
  error: string;
  sourceMap: SourceMapInfo | null;
  sourceMapStatus: "available" | "missing" | "unavailable" | "unknown";
}

export interface ScanExport {
  exportedAt: string;
  files: ScannedFile[];
}

export type ScanStepStatus = "done" | "warning" | "error";

export interface ScanStep {
  label: string;
  detail: string;
  status: ScanStepStatus;
}

export interface ScanResult {
  files: ScannedFile[];
  steps: ScanStep[];
}

export interface ScanProgressMessage {
  type: "scan-progress";
  scanId: string;
  step: ScanStep;
  file?: ScannedFile;
}
