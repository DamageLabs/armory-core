import { CREATE_TABLES_SQL } from './schema';

const COLUMN_NAME_REGEX = /^[a-z_]+$/;
const TABLE_NAME_REGEX = /^[a-z_]+$/;

/**
 * Parse CREATE_TABLES_SQL to extract table -> column[] mapping.
 * Single source of truth derived from schema.ts.
 */
function parseSchema(sql: string): Record<string, Set<string>> {
  const tables: Record<string, Set<string>> = {};
  const tableRegex = /CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\);/g;

  let match;
  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns = new Set<string>();

    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      // Skip constraints, indexes, empty lines
      if (
        !trimmed ||
        trimmed.startsWith('PRIMARY KEY') ||
        trimmed.startsWith('UNIQUE') ||
        trimmed.startsWith('FOREIGN KEY') ||
        trimmed.startsWith('CHECK') ||
        trimmed.startsWith('CREATE INDEX')
      ) {
        continue;
      }
      // Column definition: first word is the column name
      const colMatch = trimmed.match(/^(\w+)\s+(TEXT|INTEGER|REAL|BLOB|NUMERIC)/i);
      if (colMatch) {
        columns.add(colMatch[1]);
      }
    }

    if (columns.size > 0) {
      tables[tableName] = columns;
    }
  }

  return tables;
}

const VALID_SCHEMA = parseSchema(CREATE_TABLES_SQL);

const VALID_TABLES = new Set(Object.keys(VALID_SCHEMA));

export function validateTable(table: string): void {
  if (!TABLE_NAME_REGEX.test(table)) {
    throw new Error(`Invalid table name: "${table}"`);
  }
  if (!VALID_TABLES.has(table)) {
    throw new Error(`Unknown table: "${table}"`);
  }
}

export function validateColumns(table: string, columns: string[]): void {
  validateTable(table);
  const allowed = VALID_SCHEMA[table];
  for (const col of columns) {
    if (!COLUMN_NAME_REGEX.test(col)) {
      throw new Error(`Invalid column name: "${col}"`);
    }
    if (!allowed.has(col)) {
      throw new Error(`Unknown column "${col}" for table "${table}"`);
    }
  }
}

export function getValidTables(): string[] {
  return [...VALID_TABLES];
}

export function getValidColumns(table: string): string[] {
  validateTable(table);
  return [...VALID_SCHEMA[table]];
}
