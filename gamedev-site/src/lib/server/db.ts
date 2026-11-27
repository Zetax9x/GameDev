/**
 * D1 data access. Every query uses prepare().bind(): never string concatenation
 * with user input.
 */
import type { MilestoneFullRow, SessionRow, Settings, WeekRow } from '../types';
import type { SessionInput } from '../validation';
import { DEFAULT_START_DATE, DEFAULT_WEEKLY_TARGET } from '../content-data';

export async function getSettings(db: D1Database): Promise<Settings> {
  const { results } = await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const map = new Map(results.map((r) => [r.key, r.value]));
  return {
    start_date: map.get('start_date') ?? DEFAULT_START_DATE,
    weekly_target_hours: Number(map.get('weekly_target_hours') ?? DEFAULT_WEEKLY_TARGET),
    public_show_hours: map.get('public_show_hours') === 'true',
  };
}

export async function updateSettings(db: D1Database, patch: Partial<Settings>): Promise<void> {
  const stmt = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );
  const batch: D1PreparedStatement[] = [];
  if (patch.start_date !== undefined) batch.push(stmt.bind('start_date', patch.start_date));
  if (patch.weekly_target_hours !== undefined) batch.push(stmt.bind('weekly_target_hours', String(patch.weekly_target_hours)));
  if (patch.public_show_hours !== undefined) batch.push(stmt.bind('public_show_hours', String(patch.public_show_hours)));
  if (batch.length > 0) await db.batch(batch);
}

export async function listSessions(db: D1Database, from?: string, to?: string): Promise<SessionRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, date, minutes, category, note, link, created_at FROM sessions
       WHERE (?1 IS NULL OR date >= ?1) AND (?2 IS NULL OR date <= ?2)
       ORDER BY date DESC, id DESC`,
    )
    .bind(from ?? null, to ?? null)
    .all<SessionRow>();
  return results;
}

export async function recentSessions(db: D1Database, limit = 5): Promise<SessionRow[]> {
  const { results } = await db
    .prepare('SELECT id, date, minutes, category, note, link, created_at FROM sessions ORDER BY date DESC, id DESC LIMIT ?1')
    .bind(limit)
    .all<SessionRow>();
  return results;
}

/** Only date and minutes: enough for every statistic. */
export async function sessionMinutes(db: D1Database): Promise<{ date: string; minutes: number }[]> {
  const { results } = await db.prepare('SELECT date, minutes FROM sessions').all<{ date: string; minutes: number }>();
  return results;
}

export async function totalMinutes(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT COALESCE(SUM(minutes), 0) AS total FROM sessions').first<{ total: number }>();
  return row?.total ?? 0;
}

export async function insertSession(db: D1Database, s: SessionInput): Promise<SessionRow> {
  const row = await db
    .prepare(
      `INSERT INTO sessions (date, minutes, category, note, link) VALUES (?1, ?2, ?3, ?4, ?5)
       RETURNING id, date, minutes, category, note, link, created_at`,
    )
    .bind(s.date, s.minutes, s.category, s.note ?? null, s.link ?? null)
    .first<SessionRow>();
  if (!row) throw new Error('Insert failed');
  return row;
}

export async function insertSessions(db: D1Database, sessions: readonly SessionInput[]): Promise<number> {
  if (sessions.length === 0) return 0;
  const stmt = db.prepare('INSERT INTO sessions (date, minutes, category, note, link) VALUES (?1, ?2, ?3, ?4, ?5)');
  // D1 batches run in a single transaction: all rows or none.
  await db.batch(sessions.map((s) => stmt.bind(s.date, s.minutes, s.category, s.note ?? null, s.link ?? null)));
  return sessions.length;
}

export async function deleteSession(db: D1Database, id: number): Promise<boolean> {
  const res = await db.prepare('DELETE FROM sessions WHERE id = ?1').bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}

export async function listWeeks(db: D1Database): Promise<WeekRow[]> {
  const { results } = await db
    .prepare('SELECT n, phase_id, goal, status, notes, link, updated_at FROM weeks ORDER BY n')
    .all<WeekRow>();
  return results;
}

export async function updateWeek(
  db: D1Database,
  n: number,
  patch: { status?: string | undefined; goal?: string | undefined; notes?: string | null | undefined; link?: string | null | undefined },
): Promise<WeekRow | null> {
  // COALESCE keeps the current value for fields not provided; ?Nset flags allow clearing to NULL.
  return db
    .prepare(
      `UPDATE weeks SET
         status = COALESCE(?2, status),
         goal = COALESCE(?3, goal),
         notes = CASE WHEN ?4 THEN ?5 ELSE notes END,
         link = CASE WHEN ?6 THEN ?7 ELSE link END,
         updated_at = datetime('now')
       WHERE n = ?1
       RETURNING n, phase_id, goal, status, notes, link, updated_at`,
    )
    .bind(
      n,
      patch.status ?? null,
      patch.goal ?? null,
      patch.notes !== undefined ? 1 : 0,
      patch.notes ?? null,
      patch.link !== undefined ? 1 : 0,
      patch.link ?? null,
    )
    .first<WeekRow>();
}

export async function listMilestones(db: D1Database): Promise<MilestoneFullRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title_it, title_en, due_date, phase_id, status, reached_date, notes, is_public, sort_order
       FROM milestones ORDER BY sort_order`,
    )
    .all<MilestoneFullRow>();
  return results;
}

export async function updateMilestone(
  db: D1Database,
  id: string,
  patch: {
    status?: string | undefined;
    reached_date?: string | null | undefined;
    notes?: string | null | undefined;
    is_public?: boolean | undefined;
  },
): Promise<MilestoneFullRow | null> {
  return db
    .prepare(
      `UPDATE milestones SET
         status = COALESCE(?2, status),
         reached_date = CASE WHEN ?3 THEN ?4 ELSE reached_date END,
         notes = CASE WHEN ?5 THEN ?6 ELSE notes END,
         is_public = COALESCE(?7, is_public)
       WHERE id = ?1
       RETURNING id, title_it, title_en, due_date, phase_id, status, reached_date, notes, is_public, sort_order`,
    )
    .bind(
      id,
      patch.status ?? null,
      patch.reached_date !== undefined ? 1 : 0,
      patch.reached_date ?? null,
      patch.notes !== undefined ? 1 : 0,
      patch.notes ?? null,
      patch.is_public === undefined ? null : patch.is_public ? 1 : 0,
    )
    .first<MilestoneFullRow>();
}
