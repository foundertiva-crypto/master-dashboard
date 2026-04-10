/**
 * Bulk Upload Validators
 * Validates row data before pushing to ERPNext API.
 */

export interface ValidationResult {
  valid: boolean;
  errors: { row: number; field: string; message: string }[];
  cleanedData: Record<string, any>[];
}

// ---------------------------------------------------------------------------
// Field validators
// ---------------------------------------------------------------------------

function isNonEmpty(val: any): boolean {
  return val !== undefined && val !== null && String(val).trim() !== "";
}

function isEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function isNumber(val: any): boolean {
  return !isNaN(Number(val));
}

function isPositive(val: any): boolean {
  return isNumber(val) && Number(val) > 0;
}

// ---------------------------------------------------------------------------
// Schema definitions per upload type
// ---------------------------------------------------------------------------

interface FieldSchema {
  field: string;
  required: boolean;
  type: "string" | "number" | "email" | "date" | "boolean";
  erpField: string; // mapped field name for ERPNext
}

const SCHEMAS: Record<string, FieldSchema[]> = {
  customer: [
    { field: "customer_name", required: true, type: "string", erpField: "customer_name" },
    { field: "customer_group", required: false, type: "string", erpField: "customer_group" },
    { field: "territory", required: false, type: "string", erpField: "territory" },
    { field: "email", required: false, type: "email", erpField: "email_id" },
    { field: "phone", required: false, type: "string", erpField: "mobile_no" },
    { field: "customer_type", required: false, type: "string", erpField: "customer_type" },
  ],
  item: [
    { field: "item_code", required: true, type: "string", erpField: "item_code" },
    { field: "item_name", required: true, type: "string", erpField: "item_name" },
    { field: "item_group", required: true, type: "string", erpField: "item_group" },
    { field: "stock_uom", required: false, type: "string", erpField: "stock_uom" },
    { field: "standard_rate", required: false, type: "number", erpField: "standard_rate" },
    { field: "description", required: false, type: "string", erpField: "description" },
  ],
  inventory: [
    { field: "item_code", required: true, type: "string", erpField: "item_code" },
    { field: "warehouse", required: true, type: "string", erpField: "warehouse" },
    { field: "qty", required: true, type: "number", erpField: "qty" },
    { field: "rate", required: false, type: "number", erpField: "rate" },
  ],
  vendor: [
    { field: "supplier_name", required: true, type: "string", erpField: "supplier_name" },
    { field: "supplier_group", required: false, type: "string", erpField: "supplier_group" },
    { field: "country", required: false, type: "string", erpField: "country" },
    { field: "email", required: false, type: "email", erpField: "email_id" },
    { field: "phone", required: false, type: "string", erpField: "mobile_no" },
  ],
  employee: [
    { field: "employee_name", required: true, type: "string", erpField: "employee_name" },
    { field: "first_name", required: true, type: "string", erpField: "first_name" },
    { field: "last_name", required: false, type: "string", erpField: "last_name" },
    { field: "company", required: true, type: "string", erpField: "company" },
    { field: "date_of_birth", required: false, type: "date", erpField: "date_of_birth" },
    { field: "gender", required: false, type: "string", erpField: "gender" },
    { field: "designation", required: false, type: "string", erpField: "designation" },
    { field: "department", required: false, type: "string", erpField: "department" },
  ],
};

// Map upload types to ERPNext doctypes
export const DOCTYPE_MAP: Record<string, string> = {
  customer: "Customer",
  item: "Item",
  inventory: "Stock Entry",
  vendor: "Supplier",
  employee: "Employee",
};

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

export function validateUploadData(
  uploadType: string,
  rows: Record<string, any>[]
): ValidationResult {
  const schema = SCHEMAS[uploadType];
  if (!schema) {
    return {
      valid: false,
      errors: [{ row: 0, field: "", message: `Unknown upload type: ${uploadType}` }],
      cleanedData: [],
    };
  }

  const errors: { row: number; field: string; message: string }[] = [];
  const cleanedData: Record<string, any>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cleaned: Record<string, any> = {};
    let rowValid = true;

    for (const col of schema) {
      const rawValue = row[col.field];

      // Required check
      if (col.required && !isNonEmpty(rawValue)) {
        errors.push({ row: i + 1, field: col.field, message: `${col.field} is required` });
        rowValid = false;
        continue;
      }

      if (!isNonEmpty(rawValue)) {
        continue; // Skip optional empty fields
      }

      const strVal = String(rawValue).trim();

      // Type check
      switch (col.type) {
        case "email":
          if (!isEmail(strVal)) {
            errors.push({ row: i + 1, field: col.field, message: `Invalid email: ${strVal}` });
            rowValid = false;
          } else {
            cleaned[col.erpField] = strVal;
          }
          break;
        case "number":
          if (!isNumber(strVal)) {
            errors.push({ row: i + 1, field: col.field, message: `Must be a number: ${strVal}` });
            rowValid = false;
          } else {
            cleaned[col.erpField] = Number(strVal);
          }
          break;
        case "date":
          if (isNaN(Date.parse(strVal))) {
            errors.push({ row: i + 1, field: col.field, message: `Invalid date: ${strVal}` });
            rowValid = false;
          } else {
            cleaned[col.erpField] = new Date(strVal).toISOString().slice(0, 10);
          }
          break;
        default:
          cleaned[col.erpField] = strVal;
      }
    }

    if (rowValid) {
      cleanedData.push(cleaned);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    cleanedData,
  };
}

/** Get the template columns for a given upload type */
export function getTemplateColumns(uploadType: string): string[] {
  const schema = SCHEMAS[uploadType];
  if (!schema) return [];
  return schema.map((s) => s.field);
}

export function getSupportedUploadTypes(): string[] {
  return Object.keys(SCHEMAS);
}

export default { validateUploadData, getTemplateColumns, getSupportedUploadTypes, DOCTYPE_MAP };
