
export interface ExportRow {
    [columnName: string]: string | number | boolean | Date | null;
}

export const exportToCsv = (filename: string, data: ExportRow[]) => {
    const dateTime = new Date().toISOString().replace(/[:.]/g, "-");
    const fullFilename = `${dateTime}-${filename}.csv`;
    const csvContent = data
        .map((columns) => Object.values(columns).map(escapeCsvValue).join(";"))
        .join("\n");

    downloadFile(`\uFEFF${csvContent}`, "text/csv;charset=utf-8;", fullFilename);
}

export const downloadFile = (content: BlobPart, mimeType: string, fileName: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

const escapeCsvValue = (value: string | number | boolean | Date | null): string => {
    let strValue: string;
    if (value === null) {
        strValue = "";
    } else if (value instanceof Date) {
        strValue = value.toISOString();
    } else if (typeof value === "boolean") {
        strValue = value ? "true" : "false";
    } else {
        strValue = String(value);
    }
    const escaped = strValue.replace(/"/g, '""');
    return `"${escaped}"`;
}