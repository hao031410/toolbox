declare module 'pg' {
  export type QueryResult<Row = Record<string, unknown>> = {
    rows: Row[];
  };

  export class Pool {
    constructor(options?: { connectionString?: string });
    query<Row = Record<string, unknown>>(
      text: string,
      values?: unknown[],
    ): Promise<QueryResult<Row>>;
  }
}
