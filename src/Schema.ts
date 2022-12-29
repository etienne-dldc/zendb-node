import { builder as b, Node, printNode } from 'zensqlite';
import { SchemaColumn } from './SchemaColumn';
import { InferSchemaTableResult, ISchemaTableAny, SchemaTable } from './SchemaTable';
import { isNotNull, PRIV } from './Utils';

export type SchemaTablesAny = Record<string, ISchemaTableAny>;

export type ISchema<Tables extends SchemaTablesAny> = {
  tables: Tables;
  strict?: boolean;
};

export type ISchemaAny = Required<ISchema<SchemaTablesAny>>;

export type Infer<Table extends ISchemaTableAny> = InferSchemaTableResult<Table>;

export const Schema = (() => {
  return {
    create,
    column: SchemaColumn,
    table: SchemaTable,
    schemaToCreateTableQueries,
    findAllTablesQuery,
  };

  function create<Tables extends SchemaTablesAny>({ tables, strict = true }: ISchema<Tables>): Required<ISchema<Tables>> {
    return { tables, strict };
  }

  function schemaToCreateTableQueries(schema: ISchemaAny): Array<string> {
    const { tables } = schema;
    const queries = Object.entries(tables).map(([tableName, table]) => {
      const { columns } = table[PRIV];
      const columnsEntries = Object.entries(columns);
      const primaryKeys = columnsEntries.filter(([, column]) => column[PRIV].primary).map(([columnName]) => columnName);
      if (primaryKeys.length === 0) {
        throw new Error(`No primary key found for table ${tableName}`);
      }
      const multiPrimaryKey = primaryKeys.length > 1;
      const uniqueContraints = new Map<string | null, Array<string>>();
      columnsEntries.forEach(([columnName, column]) => {
        const { unique } = column[PRIV];
        unique.forEach(({ constraintName }) => {
          const keys = uniqueContraints.get(constraintName) || [];
          uniqueContraints.set(constraintName, [...keys, columnName]);
        });
      });

      const uniqueEntries = Array.from(uniqueContraints.entries());
      const uniqueTableContraints: Array<Node<'TableConstraint'>> = [];
      const uniqueColumns: Array<string> = [];
      uniqueEntries.forEach(([constraintName, columns]) => {
        if (columns.length > 1) {
          uniqueTableContraints.push(b.TableConstraint.Unique(columns, undefined, constraintName ?? undefined));
          return;
        }
        if (columns.length === 1) {
          uniqueColumns.push(columns[0]);
          return;
        }
        throw new Error(`Invalid unique constraint ${constraintName}`);
      });

      const tableConstraints = [...(multiPrimaryKey ? [b.TableConstraint.PrimaryKey(primaryKeys)] : []), ...uniqueTableContraints];

      const node = b.CreateTableStmt(
        tableName,
        columnsEntries.map(([columnName, column]): Node<'ColumnDef'> => {
          const { datatype, nullable, primary } = column[PRIV];
          const unique = uniqueColumns.includes(columnName);
          const dt = datatype.type;
          return b.ColumnDef(
            columnName,
            dt,
            [
              !nullable ? b.ColumnConstraint.NotNull() : null,
              primary && !multiPrimaryKey ? b.ColumnConstraint.PrimaryKey() : null,
              unique ? b.ColumnConstraint.Unique() : null,
            ].filter(isNotNull)
          );
        }),
        { strict: schema.strict ? true : undefined, tableConstraints: tableConstraints.length > 0 ? tableConstraints : undefined }
      );

      return printNode(node);
    });
    return queries;
  }

  function findAllTablesQuery(): string {
    const query = b.SelectStmt({
      resultColumns: [b.ResultColumn.Column('name')],
      from: b.From.Table('sqlite_master'),
      where: b.Expr.Equal(b.Expr.Column('type'), b.literal('table')),
    });
    return printNode(query);
  }
})();
