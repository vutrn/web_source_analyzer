export interface PopupElements {
  fileList: HTMLUListElement;
  statusMessage: HTMLDivElement;
  scanProgress: HTMLUListElement;
  codeViewer: HTMLPreElement;
  viewerTitle: HTMLElement;
  viewerMeta: HTMLDivElement;
  searchInput: HTMLInputElement;
  scanButton: HTMLButtonElement;
  expandButton: HTMLButtonElement;
  copyButton: HTMLButtonElement;
  exportButton: HTMLButtonElement;
}

export function getPopupElements(): PopupElements {
  const get = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing popup element: #${id}`);
    return element as T;
  };
  return {
    fileList: get<HTMLUListElement>("fileList"),
    statusMessage: get<HTMLDivElement>("statusMessage"),
    scanProgress: get<HTMLUListElement>("scanProgress"),
    codeViewer: get<HTMLPreElement>("codeViewer"),
    viewerTitle: get<HTMLElement>("viewerTitle"),
    viewerMeta: get<HTMLDivElement>("viewerMeta"),
    searchInput: get<HTMLInputElement>("searchInput"),
    scanButton: get<HTMLButtonElement>("scanButton"),
    expandButton: get<HTMLButtonElement>("expandButton"),
    copyButton: get<HTMLButtonElement>("copyButton"),
    exportButton: get<HTMLButtonElement>("exportButton")
  };
}
