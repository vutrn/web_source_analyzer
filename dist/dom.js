export function getPopupElements() {
    const get = (id) => {
        const element = document.getElementById(id);
        if (!element)
            throw new Error(`Missing popup element: #${id}`);
        return element;
    };
    return {
        fileList: get("fileList"),
        statusMessage: get("statusMessage"),
        scanProgress: get("scanProgress"),
        codeViewer: get("codeViewer"),
        viewerTitle: get("viewerTitle"),
        viewerMeta: get("viewerMeta"),
        searchInput: get("searchInput"),
        scanButton: get("scanButton"),
        expandButton: get("expandButton"),
        copyButton: get("copyButton"),
        exportButton: get("exportButton")
    };
}
