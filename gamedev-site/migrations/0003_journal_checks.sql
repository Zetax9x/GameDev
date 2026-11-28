-- Daily study journal and monthly "check to advance" items.

CREATE TABLE journal (
  date       TEXT PRIMARY KEY,           -- YYYY-MM-DD, one entry per day
  topics     TEXT,                       -- argomenti studiati
  exercises  TEXT,                       -- esercizi completati
  errors     TEXT,                       -- errori incontrati
  unclear    TEXT,                       -- concetti ancora poco chiari
  autonomy   INTEGER CHECK (autonomy IS NULL OR autonomy BETWEEN 1 AND 5),
  next_goal  TEXT,                       -- prossimo obiettivo
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE checks (
  id         TEXT PRIMARY KEY,           -- e.g. v01-1
  month      INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  text       TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0,
  done_date  TEXT
);
CREATE INDEX idx_checks_month ON checks(month);
