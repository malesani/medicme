import { getDb } from "./index";

export type LastMetric = {
  metric_code: string;
  value: number;
  unit: string;
  captured_at: string;
};

export async function getLastMetric(metricCode: string): Promise<LastMetric | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LastMetric>(
    `SELECT metric_code, value, unit, captured_at
     FROM measurements
     WHERE metric_code = ?
     ORDER BY captured_at DESC
     LIMIT 1;`,
    [metricCode]
  );
  return row ?? null;
}

export type NextEvent = {
  id: string;
  scheduled_at: string;
  type: string;
  notes: string | null;
  reminder_minutes: number | null;
};

export async function getNextEvent(nowIso: string): Promise<NextEvent | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NextEvent>(
    `SELECT id, scheduled_at, type, notes, reminder_minutes
     FROM calendar_events
     WHERE deleted_at IS NULL AND scheduled_at > ?
     ORDER BY scheduled_at ASC
     LIMIT 1;`,
    [nowIso]
  );
  return row ?? null;
}