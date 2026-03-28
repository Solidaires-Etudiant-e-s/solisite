declare module 'bun:sqlite' {
  export interface QueryResult {
    changes: number
    lastInsertRowid: number
  }

  export interface Query<T = unknown> {
    all(params?: Record<string, unknown>): T[]
    get(params?: Record<string, unknown>): T | null
    run(params?: Record<string, unknown>): QueryResult
  }

  export class Database {
    constructor(filename: string, options?: { create?: boolean, strict?: boolean })
    query<T = unknown>(sql: string): Query<T>
    run(sql: string): QueryResult
  }
}
