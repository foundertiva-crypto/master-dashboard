/**
 * Bulk Upload Engine — MODULE 3
 * Parses CSV / Excel / JSON files, validates, pushes to ERPNext API.
 */

import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { getERPClient } from "../../lib/erp";
import { getStorage as getS3Storage } from "../../lib/storage";
import { validateUploadData, DOCTYPE_MAP, getTemplateColumns } from "./validators";
import { logUpload, updateUploadLog } from "../../api/src/services/logger.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParseResult {
  rows: Record<string, any>[];
  headers: string[];
  totalRows: number;
}

export interface UploadProgress {
  logId: string;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: { row: number; message: string }[];
  status: "validating" | "uploading" | "completed" | "failed";
}

// ---------------------------------------------------------------------------
// File parsers
// ---------------------------------------------------------------------------

export function parseCSV(buffer: Buffer): ParseResult {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  return { rows: records, headers, totalRows: records.length };
}

export function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, headers, totalRows: rows.length };
}

export function parseJSON(buffer: Buffer): ParseResult {
  const data = JSON.parse(buffer.toString("utf-8"));
  const rows = Array.isArray(data) ? data : [data];
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, headers, totalRows: rows.length };
}

export function parseFile(buffer: Buffer, fileType: string): ParseResult {
  switch (fileType.toLowerCase()) {
    case "csv":
      return parseCSV(buffer);
    case "xlsx":
    case "xls":
    case "excel":
      return parseExcel(buffer);
    case "json":
      return parseJSON(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// ---------------------------------------------------------------------------
// Template generator
// ---------------------------------------------------------------------------

export function generateTemplate(uploadType: string, format: "csv" | "xlsx" = "csv"): Buffer {
  const columns = getTemplateColumns(uploadType);
  if (columns.length === 0) throw new Error(`Unknown upload type: ${uploadType}`);

  if (format === "csv") {
    return Buffer.from(columns.join(",") + "\n", "utf-8");
  }

  // Excel template
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([columns]);
  XLSX.utils.book_append_sheet(wb, ws, uploadType);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

// ---------------------------------------------------------------------------
// Upload processor — pushes validated rows to ERPNext one-by-one with retry
// ---------------------------------------------------------------------------

export async function processUpload(
  uploadType: string,
  rows: Record<string, any>[],
  userId?: string,
  fileName?: string,
  s3Key?: string
): Promise<UploadProgress> {
  const doctype = DOCTYPE_MAP[uploadType];
  if (!doctype) throw new Error(`Unknown upload type: ${uploadType}`);

  // Validate
  const validation = validateUploadData(uploadType, rows);

  // Create log entry
  const logId = await logUpload({
    userId,
    fileName: fileName ?? "unknown",
    fileType: uploadType,
    uploadType,
    totalRows: rows.length,
    status: "processing",
    s3Key,
    errorDetails: validation.errors.length > 0 ? validation.errors : undefined,
  });

  const progress: UploadProgress = {
    logId,
    total: validation.cleanedData.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: validation.errors.map((e) => ({ row: e.row, message: `${e.field}: ${e.message}` })),
    status: "uploading",
  };

  if (validation.cleanedData.length === 0) {
    progress.status = "failed";
    await updateUploadLog(logId, {
      status: "failed",
      failedRows: rows.length,
      errorDetails: validation.errors,
      completedAt: new Date(),
    });
    return progress;
  }

  const erp = getERPClient();
  const MAX_RETRIES = 2;

  for (const row of validation.cleanedData) {
    let success = false;
    let lastError = "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await erp.createDoc(doctype, row);
        success = true;
        break;
      } catch (err: any) {
        lastError = err.message;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    progress.processed++;
    if (success) {
      progress.succeeded++;
    } else {
      progress.failed++;
      progress.errors.push({
        row: progress.processed,
        message: lastError,
      });
    }
  }

  progress.status = progress.failed === 0 ? "completed" : progress.succeeded > 0 ? "completed" : "failed";

  await updateUploadLog(logId, {
    successRows: progress.succeeded,
    failedRows: progress.failed,
    status: progress.status,
    errorDetails: progress.errors.length > 0 ? progress.errors : undefined,
    completedAt: new Date(),
  });

  return progress;
}

export default {
  parseFile,
  parseCSV,
  parseExcel,
  parseJSON,
  generateTemplate,
  processUpload,
};
