import { SchemaTableAny } from './SchemaTable';

export type SchemaTablesAny = Record<string, SchemaTableAny>;

export type Schema<Tables extends SchemaTablesAny> = {
  tables: Tables;
  sanitize?: (data: unknown) => unknown;
  restore?: (data: unknown) => unknown;
};

export type SchemaAny = Required<Schema<SchemaTablesAny>>;

export function schema<Tables extends SchemaTablesAny>({
  tables,
  restore = (d) => d,
  sanitize = (d) => d,
}: Schema<Tables>): Required<Schema<Tables>> {
  return { sanitize, restore, tables };
}
