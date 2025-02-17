import { Ast, builder as b, printNode } from "@dldc/sqlite";
import type {
  TCreateTableOperation,
  TListTablesOperation,
  TPragmaOperation,
  TPragmaSetOperation,
} from "./Operation.ts";
import type { TCreateTableOptions, TTable } from "./Table.ts";

export function schema<Tables extends Record<string, TTable<any, any>>>(
  tables: Tables,
  options?: TCreateTableOptions,
): Array<TCreateTableOperation> {
  return Object.values(tables).map((table) => table.schema.create(options));
}

export function tables(): TListTablesOperation {
  const query = b.SelectStmt.build({
    resultColumns: [b.ResultColumn.column("name")],
    from: b.SelectStmt.FromTable("sqlite_master"),
    where: b.Operations.equal(
      b.Expr.column("type"),
      b.Literal.literal("table"),
    ),
  });
  return {
    kind: "ListTables",
    sql: printNode(query),
    params: null,
    parse: (raw) => raw.map((row) => row.name),
  };
}

export function userVersion(): TPragmaOperation<number> {
  const query = Ast.createNode("PragmaStmt", {
    pragmaName: b.Expr.identifier("user_version"),
  });
  return {
    kind: "Pragma",
    sql: printNode(query),
    params: null,
    parse: (raw) => raw[0].user_version,
  };
}

export function setUserVersion(version: number): TPragmaSetOperation {
  const query = Ast.createNode("PragmaStmt", {
    pragmaName: b.Expr.identifier("user_version"),
    value: {
      variant: "Equal",
      pragmaValue: b.Literal.string(version.toString()),
    },
  });
  return {
    kind: "PragmaSet",
    sql: printNode(query),
    params: null,
    parse: () => null,
  };
}
