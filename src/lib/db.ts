import { createClient, type Client } from '@libsql/client'

let _db: Client | null = null

export function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DB_URL ?? `file:${process.cwd()}/fc-pedia.db`,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return _db
}
