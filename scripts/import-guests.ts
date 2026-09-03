import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';

const ROOT = resolve(import.meta.dirname, '..');
const EXCEL_PATH = resolve(ROOT, 'data', 'guest_list.xlsx');

type Target = 'development' | 'production';

type ImportOptions = {
  target: Target;
  execute: boolean;
  expectedProjectRef: string;
  allowNonEmpty: boolean;
};

type GuestImportRow = {
  rowNumber: number;
  name: string;
  phone: string | null;
  group_affiliation: string | null;
  status: 'pending';
};

type DuplicateGroup = {
  value: string;
  rows: number[];
};

type ImportSummary = {
  rows: GuestImportRow[];
  skippedEmptyRows: number[];
  missingNames: number[];
  missingPhones: number[];
  missingGroups: number[];
  duplicateNames: DuplicateGroup[];
  duplicatePhones: DuplicateGroup[];
};

const COLUMN_ALIASES = {
  name: ['שם המוזמן', 'שם', 'name'],
  phone: ['הנייד', 'נייד', 'טלפון', 'phone', 'mobile'],
  group: ['שיוך לקבוצה', 'קבוצה', 'group', 'group_affiliation'],
} as const;

function printHelp() {
  console.log(`
Import every spreadsheet row after the detected header from data/guest_list.xlsx.
Missing phone, name, or group values are warnings only — no row is filtered or skipped.

Dry-run (default; no database write):
  npm run import-guests -- --target development --project-ref <project-ref>
  npm run import-guests -- --target production --project-ref <project-ref>

Execute:
  npm run import-guests -- --target production --execute --project-ref <project-ref>

Options:
  --target <development|production>  Required.
  --project-ref <ref>                Required confirmation of the target project.
  --execute                          Write to Supabase. Without it, dry-run only.
  --allow-non-empty                  Allow appending when guests already exist.
  --help                             Show this help.

Execution-only privileged environment files:
  development: .env.import.development, .env.import.development.local
  production:  .env.import.production, .env.import.production.local

Execution requires SUPABASE_URL and SUPABASE_SECRET_KEY (sb_secret_...) in the
selected import environment. Frontend .env files are never loaded.
`.trim());
}

function readOptionValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

function parseArgs(args: string[]): ImportOptions | null {
  if (args.includes('--help')) {
    printHelp();
    return null;
  }

  let target: Target | null = null;
  let execute = false;
  let expectedProjectRef: string | null = null;
  let allowNonEmpty = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--target') {
      const value = readOptionValue(args, index, '--target');
      if (value !== 'development' && value !== 'production') {
        throw new Error('--target must be "development" or "production".');
      }
      target = value;
      index += 1;
    } else if (arg === '--project-ref') {
      expectedProjectRef = readOptionValue(args, index, '--project-ref');
      index += 1;
    } else if (arg === '--execute') {
      execute = true;
    } else if (arg === '--allow-non-empty') {
      allowNonEmpty = true;
    } else {
      throw new Error(`Unknown option: ${arg}. Run with --help for examples.`);
    }
  }

  if (!target) {
    throw new Error('--target is required. Run with --help for examples.');
  }
  if (!expectedProjectRef) {
    throw new Error('--project-ref is required.');
  }
  if (!execute && allowNonEmpty) {
    throw new Error('--allow-non-empty is only valid with --execute.');
  }

  return { target, execute, expectedProjectRef, allowNonEmpty };
}

function loadTargetEnv(target: Target): Record<string, string> {
  const filenames = [`.env.import.${target}`, `.env.import.${target}.local`];
  const loaded: Record<string, string> = {};
  let found = false;

  for (const filename of filenames) {
    const path = resolve(ROOT, filename);
    if (!existsSync(path)) continue;

    found = true;
    const result = config({ path, override: false });
    if (result.error) {
      throw result.error;
    }
    Object.assign(loaded, result.parsed);
  }

  if (!found) {
    throw new Error(`No ${target} env file found. Expected ${filenames.join(' or ')}.`);
  }

  return loaded;
}

function getProjectRef(supabaseUrl: string): string {
  let hostname: string;
  try {
    hostname = new URL(supabaseUrl).hostname;
  } catch {
    throw new Error('VITE_SUPABASE_URL is not a valid URL.');
  }

  const suffix = '.supabase.co';
  if (!hostname.endsWith(suffix)) {
    throw new Error(`Expected a Supabase URL ending in ${suffix}; received ${hostname}.`);
  }

  const projectRef = hostname.slice(0, -suffix.length);
  if (!projectRef || projectRef.includes('.')) {
    throw new Error(`Could not extract a project ref from ${hostname}.`);
  }
  return projectRef;
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

function normalizedName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('he');
}

function normalizedPhone(value: string | null): string {
  return value?.replace(/\D/g, '') ?? '';
}

function duplicateGroups(
  guests: GuestImportRow[],
  getValue: (guest: GuestImportRow) => string,
): DuplicateGroup[] {
  const groups = new Map<string, number[]>();

  for (const guest of guests) {
    const value = getValue(guest);
    if (!value) continue;
    const rows = groups.get(value) ?? [];
    rows.push(guest.rowNumber);
    groups.set(value, rows);
  }

  return [...groups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([value, rows]) => ({ value, rows }));
}

function parseRows(sheet: XLSX.WorkSheet): ImportSummary {
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

  const rows: GuestImportRow[] = [];
  const skippedEmptyRows: number[] = [];

  matrix.slice(headerRowIndex + 1).forEach((row, index) => {
    const rowNumber = headerRowIndex + index + 2;
    const name = cellValue(row[nameIndex]);
    const phone = phoneIndex >= 0 ? cellValue(row[phoneIndex]) || null : null;
    const groupAffiliation = groupIndex >= 0 ? cellValue(row[groupIndex]) || null : null;

    if (!name && !phone && !groupAffiliation) {
      skippedEmptyRows.push(rowNumber);
      return;
    }

    rows.push({
      rowNumber,
      name,
      phone,
      group_affiliation: groupAffiliation,
      status: 'pending',
    });
  });

  return {
    rows,
    skippedEmptyRows,
    missingNames: rows.filter((guest) => !guest.name).map((guest) => guest.rowNumber),
    missingPhones: rows.filter((guest) => !guest.phone).map((guest) => guest.rowNumber),
    missingGroups: rows
    .filter((guest) => !guest.group_affiliation)
      .map((guest) => guest.rowNumber),
    duplicateNames: duplicateGroups(rows, (guest) => normalizedName(guest.name)),
    duplicatePhones: duplicateGroups(rows, (guest) => normalizedPhone(guest.phone)),
  };
}

function formatRows(rows: number[]): string {
  return rows.length > 0 ? rows.join(', ') : 'none';
}

function formatDuplicates(groups: DuplicateGroup[]): string {
  if (groups.length === 0) return 'none';
  return groups.map((group) => `"${group.value}" (rows ${group.rows.join(', ')})`).join('; ');
}

function printSummary(
  options: ImportOptions,
  sheetName: string,
  summary: ImportSummary,
) {
  console.log('\n========== IMPORT SUMMARY ==========');
  console.log(`Mode: ${options.execute ? 'EXECUTE' : 'DRY RUN (no writes)'}`);
  console.log(`Target: ${options.target}`);
  console.log(`Project ref: ${options.expectedProjectRef}`);
  console.log(`Worksheet: ${sheetName}`);
  console.log(`Rows to import: ${summary.rows.length}`);
  console.log(
    `Completely empty rows skipped: ${summary.skippedEmptyRows.length} (${formatRows(summary.skippedEmptyRows)})`,
  );
  console.log(`Missing names: ${summary.missingNames.length} (${formatRows(summary.missingNames)})`);
  console.log(`Missing phones: ${summary.missingPhones.length} (${formatRows(summary.missingPhones)})`);
  console.log(`Missing groups: ${summary.missingGroups.length} (${formatRows(summary.missingGroups)})`);
  console.log(`Duplicate normalized names: ${formatDuplicates(summary.duplicateNames)}`);
  console.log(`Duplicate normalized phones: ${formatDuplicates(summary.duplicatePhones)}`);
  console.log('Partially populated rows and duplicate rows are retained.');
  console.log('====================================\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options) return;

  if (!existsSync(EXCEL_PATH)) {
    throw new Error(`Excel file not found: ${EXCEL_PATH}`);
  }

  const fileBuffer = await readFile(EXCEL_PATH);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const summary = parseRows(workbook.Sheets[sheetName]);
  printSummary(options, sheetName, summary);

  if (summary.rows.length === 0) {
    throw new Error('The worksheet contains no non-empty rows after the detected header.');
  }

  if (!options.execute) {
    console.log('DRY RUN complete. No database connection was made and no rows were written.');
    return;
  }

  const env = loadTargetEnv(options.target);
  const supabaseUrl = env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(`Missing SUPABASE_URL in the ${options.target} import environment.`);
  }

  const actualProjectRef = getProjectRef(supabaseUrl);
  if (options.expectedProjectRef !== actualProjectRef) {
    throw new Error(
      `Project confirmation failed: --project-ref ${options.expectedProjectRef} does not match ${actualProjectRef}.`,
    );
  }

  const secretKey = env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(`Missing SUPABASE_SECRET_KEY in the ${options.target} import environment.`);
  }
  if (!secretKey.startsWith('sb_secret_')) {
    throw new Error('SUPABASE_SECRET_KEY must be a new Supabase sb_secret_ key.');
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // A secret key from another project (or a publishable key) is rejected here.
  // This read happens before the import RPC, so credential mismatches cannot write.
  const { error: credentialError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (credentialError) {
    throw new Error(
      `Credential verification failed for project ${actualProjectRef}: ${credentialError.message}`,
    );
  }

  const payload = summary.rows.map(({ name, phone, group_affiliation }) => ({
    name,
    phone,
    group_affiliation,
  }));

  const requireEmpty = !options.allowNonEmpty;

  console.log(
    `Credentials verified for ${actualProjectRef}. Starting one transactional import of ${payload.length} rows` +
      ` (require_empty=${String(requireEmpty)})...`,
  );

  // The RPC runs as a single PostgreSQL transaction. If require_empty is true
  // and the table already has rows, the RPC raises an exception and the entire
  // transaction — including any partially-inserted rows — is rolled back.
  const { data: inserted, error: importError } = await supabase.rpc('import_guests', {
    import_rows: payload,
    require_empty: requireEmpty,
  });
  if (importError) {
    throw new Error(`Transactional import failed and was rolled back: ${importError.message}`);
  }
  if (inserted !== payload.length) {
    throw new Error(
      `Transactional import returned ${String(inserted)} inserted rows; expected ${payload.length}.`,
    );
  }

  // Post-commit verification: the RPC transaction has already committed at
  // this point, so the rows ARE in the database regardless of whether this
  // verification succeeds or fails. Any error here is informational only.
  const { count: finalCount, error: verifyError } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true });
  if (verifyError) {
    console.warn(
      `Import succeeded (${payload.length} rows committed), but the post-import count could not be verified: ${verifyError.message}`,
    );
  } else if (finalCount !== null && finalCount < payload.length) {
    console.warn(
      `Import succeeded but final count (${finalCount}) is less than expected. Another process may have deleted rows.`,
    );
  } else {
    console.log(`Verified: target now has ${finalCount ?? '(unknown)'} guests.`);
  }

  console.log(`Done. Imported every spreadsheet row (${payload.length} rows committed).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
