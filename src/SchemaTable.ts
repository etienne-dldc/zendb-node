import { ISchemaAny } from './Schema';
import { ISchemaColumnAny, SchemaColumnInputValue, SchemaColumnOutputValue } from './SchemaColumn';
import { ExtractTable, TablesNames } from './types';
import { PRIV } from './Utils';

export type SchemaColumnsBase = Record<string, ISchemaColumnAny>;

export type SchemaTableInternal<Columns extends SchemaColumnsBase> = {
  columns: Columns;
};

export type ISchemaTableAny = ISchemaTable<SchemaColumnsBase>;

export type InferSchemaColumnsResult<Columns extends SchemaColumnsBase> = {
  [K in keyof Columns]: SchemaColumnOutputValue<Columns[K]>;
};

export type InferSchemaTableResult<Schema extends ISchemaAny, TableName extends TablesNames<Schema>> = InferSchemaColumnsResult<
  ExtractTable<Schema, TableName>[PRIV]['columns']
>;

export type ExtractUndefinedKeys<Data extends Record<string, any>> = {
  [K in keyof Data]: undefined extends Data[K] ? K : never;
}[keyof Data];

export type ExtractDefinedKeys<Data extends Record<string, any>> = {
  [K in keyof Data]: undefined extends Data[K] ? never : K;
}[keyof Data];

export type MarkUndefinedOptional<Data extends Record<string, any>> = Pick<Data, ExtractDefinedKeys<Data>> &
  Partial<Pick<Data, ExtractUndefinedKeys<Data>>>;

export type InferSchemaColumnsInput<Columns extends SchemaColumnsBase> = {
  [K in keyof Columns]: SchemaColumnInputValue<Columns[K]>;
};

export type InferSchemaTableInput<Schema extends ISchemaAny, TableName extends TablesNames<Schema>> = MarkUndefinedOptional<
  InferSchemaColumnsInput<ExtractTable<Schema, TableName>[PRIV]['columns']>
>;

export interface ISchemaTable<Columns extends SchemaColumnsBase> {
  readonly [PRIV]: SchemaTableInternal<Columns>;
}

export const SchemaTable = (() => {
  return create;

  function create<Columns extends SchemaColumnsBase>(columns: Columns): ISchemaTable<Columns> {
    return {
      [PRIV]: { columns },
    };
  }
})();
