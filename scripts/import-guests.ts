import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';

const ROOT = resolve(import.meta.dirname, '..');
const EXCEL_PATH = resolve(ROOT, 'data', 'guest_list.xlsx');

const COLUMN_ALIASES = {
  name: ['שם המוזמן', 'שם', 'name'],
  phone: ['הנייד', 'נייד', 'טלפון', 'phone', 'mobile'],
  group: ['שיוך לקבוצה', 'קבוצה', 'group', 'group_affiliation'],
} as const;

function loadEnv() {
  for (const file of ['.env', '.env.local', '.env.development', '.env.development.local']) {
    const path = resolve(ROOT, file);
    if (existsSync(path)) {
      config({ path, override: true });
    }
  }
}

function cellValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') return String(value);
  return String(value).trim();
}

function normalizeHeader(value: unknown): string {
  return cellValue(value).replace(/\s+/g, ' ');
}

function findColumnIndex(headers: string[], aliases: readonly string[]): number {
  return headers.findIndex((header) => aliases.includes(header as (typeof aliases)[number]));
}

function findHeaderRow(rows: unknown[][]): number {
  for (let index = 0; index < rows.length; index += 1) {
    const headers = rows[index].map(normalizeHeader);
    if (findColumnIndex(headers, COLUMN_ALIASES.name) >= 0) {
      return index;
    }
  }
  throw new Error(`Could not find header row with name column (${COLUMN_ALIASES.name.join(', ')}).`);
}

function parseRows(sheet: XLSX.WorkSheet) {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (matrix.length === 0) {
    throw new Error('Excel sheet is empty.');
  }

  const headerRowIndex = findHeaderRow(matrix);
  const headerRow = matrix[headerRowIndex].map(normalizeHeader);
  const nameIndex = findColumnIndex(headerRow, COLUMN_ALIASES.name);
  const phoneIndex = findColumnIndex(headerRow, COLUMN_ALIASES.phone);
  const groupIndex = findColumnIndex(headerRow, COLUMN_ALIASES.group);

  console.log('Detected columns:', {
    headerRow: headerRowIndex + 1,
    name: headerRow[nameIndex],
    phone: phoneIndex >= 0 ? headerRow[phoneIndex] : null,
    group: groupIndex >= 0 ? headerRow[groupIndex] : null,
  });

  return matrix
    .slice(headerRowIndex + 1)
    .map((row, index) => ({
      rowNumber: headerRowIndex + index + 2,
      name: cellValue(row[nameIndex]),
      phone: phoneIndex >= 0 ? cellValue(row[phoneIndex]) || null : null,
      group_affiliation: groupIndex >= 0 ? cellValue(row[groupIndex]) || null : null,
      status: 'pending' as const,
    }))
    .filter((guest) => guest.name.length > 0);
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env files. The import script requires the service role key (not a VITE_ variable).',
    );
  }

  if (!existsSync(EXCEL_PATH)) {
    throw new Error(`Excel file not found: ${EXCEL_PATH}`);
  }

  const fileBuffer = await readFile(EXCEL_PATH);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const guests = parseRows(workbook.Sheets[sheetName]);

  console.log(`Parsed ${guests.length} guests from "${sheetName}".`);

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < guests.length; i += batchSize) {
    const batch = guests.slice(i, i + batchSize).map(({ rowNumber: _rowNumber, ...guest }) => guest);
    const { data, error } = await supabase.from('guests').insert(batch).select('id');

    if (error) {
      throw new Error(`Insert failed near Excel row ${guests[i].rowNumber}: ${error.message}`);
    }

    inserted += data?.length ?? 0;
    console.log(`Inserted ${inserted}/${guests.length}...`);
  }

  console.log(`Done. Imported ${inserted} guests.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
