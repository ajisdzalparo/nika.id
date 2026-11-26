import ExcelJS from "exceljs";

/** ExcelJS cell value → plain value (rich text, formulas and hyperlinks flattened). */
function plain(v: ExcelJS.CellValue): unknown {
  if (v && typeof v === "object" && !(v instanceof Date)) {
    if ("result" in v) return (v as { result: unknown }).result;
    if ("richText" in v) return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
    if ("text" in v) return (v as { text: string }).text;
  }
  return v;
}

function parseCsv(text: string): unknown[][] {
  const delim = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const out: unknown[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      out.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur || row.length) {
    row.push(cur);
    out.push(row);
  }
  return out;
}

/**
 * Rows of an uploaded .xlsx (sheet named `preferredSheet`, else the first) or .csv, header row included.
 * Cell values are flattened to plain values.
 */
export async function readSpreadsheetRows(buffer: ArrayBuffer, filename: string, preferredSheet?: string): Promise<unknown[][]> {
  if (/\.csv$/i.test(filename)) return parseCsv(new TextDecoder("utf-8").decode(buffer).replace(/^﻿/, ""));
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = (preferredSheet && wb.worksheets.find((w) => w.name.toLowerCase() === preferredSheet.toLowerCase())) || wb.worksheets[0];
  if (!ws) return [];
  const rows: unknown[][] = [];
  ws.eachRow({ includeEmpty: false }, (r) => {
    rows.push((r.values as ExcelJS.CellValue[]).slice(1).map(plain));
  });
  return rows;
}

/** Brand header row (espresso fill, light bold text), frozen. */
export function styleHeader(ws: ExcelJS.Worksheet) {
  const h = ws.getRow(1);
  h.font = { bold: true, color: { argb: "FFF7F3EC" } };
  h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1B17" } };
  h.alignment = { vertical: "middle" };
  h.height = 22;
  ws.views = [{ state: "frozen", ySplit: 1 }];
}
