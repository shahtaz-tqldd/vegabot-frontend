import * as XLSX from "xlsx";

export const PRODUCT_TEMPLATE = {
  sheetName: "Products",
  fileName: "product-upload-template.xlsx",
  headers: ["name", "sku", "category", "price", "stock"],
  exampleRows: [
    { name: "Aurora Pro", sku: "AUR-PRO-01", category: "Subscription", price: 49, stock: 999 },
    { name: "Priority support add-on", sku: "AUR-SUP-VP", category: "Add-on", price: 29, stock: 100 },
  ],
};

export const SERVICE_TEMPLATE = {
  sheetName: "Services",
  fileName: "service-upload-template.xlsx",
  headers: ["name", "description", "price", "duration_minutes"],
  exampleRows: [
    { name: "Onboarding session", description: "Guided setup with a specialist.", price: 0, duration_minutes: 45 },
    { name: "Consultation", description: "Video call with an expert.", price: 59, duration_minutes: 30 },
  ],
};

export const downloadSpreadsheetTemplate = ({ sheetName, fileName, headers, exampleRows }) => {
  const worksheet = XLSX.utils.json_to_sheet(exampleRows, { header: headers });
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 6, 18) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

export const parseSpreadsheetRows = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) return [];

  return XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
};

export const normalizeProductRows = (rows) =>
  rows
    .map((row) => ({
      name: String(row.name || "").trim(),
      sku: String(row.sku || "").trim(),
      category: String(row.category || "General").trim(),
      price: Number(row.price) || 0,
      stock: Number(row.stock) || 0,
    }))
    .filter((product) => product.name);

export const normalizeServiceRows = (rows) =>
  rows
    .map((row) => ({
      name: String(row.name || "").trim(),
      description: String(row.description || "").trim(),
      price: Number(row.price) || 0,
      durationMinutes: Number(row.duration_minutes ?? row.durationMinutes) || 30,
    }))
    .filter((service) => service.name);
