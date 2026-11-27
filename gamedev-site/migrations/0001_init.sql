-- Initial schema (docs/SPEC.md, section 8).

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE weeks (
  n          INTEGER PRIMARY KEY CHECK (n BETWEEN 1 AND 104),
  phase_id   TEXT NOT NULL,
  goal       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'da_fare'
             CHECK (status IN ('da_fare','in_corso','fatta','saltata')),
  notes      TEXT,
  link       TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,
  minutes    INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 960),
  category   TEXT NOT NULL,
  note       TEXT,
  link       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_date ON sessions(date);

CREATE TABLE milestones (
  id           TEXT PRIMARY KEY,
  title_it     TEXT NOT NULL,
  title_en     TEXT NOT NULL,
  due_date     TEXT NOT NULL,
  phase_id     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'da_fare'
               CHECK (status IN ('da_fare','in_corso','raggiunto','in_ritardo')),
  reached_date TEXT,
  notes        TEXT,
  is_public    INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL
);
