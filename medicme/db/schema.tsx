// db/schema.ts
import * as SQLite from "expo-sqlite";

export type Db = SQLite.SQLiteDatabase;

export async function openDb(): Promise<Db> {
  // Esto crea/abre la DB en el sandbox de la app
  return await SQLite.openDatabaseAsync("medicme.db");
}

export async function initDb(db: Db): Promise<void> {
  // Importante: activar FK en SQLite
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  // Tabla exams
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,              -- ISO string
      type TEXT NOT NULL,              -- e.g. "blood"
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  // Tabla attachments (metadata de PDFs/imagenes)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY NOT NULL,
      exam_id TEXT NOT NULL,
      path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      sha256 TEXT,
      size INTEGER,
      created_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );
  `);

  // Tabla measurements (valores)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS measurements (
      id TEXT PRIMARY KEY NOT NULL,
      exam_id TEXT NOT NULL,
      metric_code TEXT NOT NULL,       -- e.g. "glucose_mgdl"
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      captured_at TEXT NOT NULL,       -- normalmente la fecha del examen
      created_at TEXT NOT NULL,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );
  `);

  // Tabla calendar_events (examen futuro)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY NOT NULL,
      scheduled_at TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      reminder_minutes INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  // Índices útiles
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);`);
  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_measurements_metric_date ON measurements(metric_code, captured_at);`
  );
  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_attachments_exam ON attachments(exam_id);`
  );
}