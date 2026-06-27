import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'fc-pedia.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb(): void {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id                  TEXT PRIMARY KEY,
      rank                INTEGER,
      overall_rating      INTEGER,
      first_name          TEXT,
      last_name           TEXT,
      common_name         TEXT,
      birthdate           TEXT,
      height              INTEGER,
      weight              INTEGER,
      skill_moves         INTEGER,
      weak_foot           INTEGER,
      preferred_foot      TEXT,
      gender              TEXT,
      nationality_id      TEXT,
      nationality_label   TEXT,
      nationality_image   TEXT,
      team_id             TEXT,
      team_label          TEXT,
      team_image          TEXT,
      league_name         TEXT,
      position_id         TEXT,
      position_label      TEXT,
      position_short      TEXT,
      position_type       TEXT,
      alternate_positions TEXT,
      player_abilities    TEXT,
      ability_ids         TEXT,
      stats               TEXT,
      avatar_url          TEXT,
      shield_url          TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_overall     ON players(overall_rating DESC);
    CREATE INDEX IF NOT EXISTS idx_position    ON players(position_id);
    CREATE INDEX IF NOT EXISTS idx_nationality ON players(nationality_id);
    CREATE INDEX IF NOT EXISTS idx_team        ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_league      ON players(league_name);
    CREATE INDEX IF NOT EXISTS idx_gender      ON players(gender);
  `)
}
