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

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birth_date TEXT,
      biological_sex TEXT,
      weight_kg REAL,
      height_cm REAL,
      blood_type TEXT,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

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
      exam_id TEXT,
      metric_code TEXT NOT NULL,       -- e.g. "glucose_mgdl"
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      captured_at TEXT NOT NULL,       -- normalmente la fecha del examen
      created_at TEXT NOT NULL,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );
  `);

  // Migración: cada resultado conserva una copia de sus rangos.
  // Los ALTER fallan de forma segura si la columna ya existe.
  try {
    await db.execAsync(`ALTER TABLE measurements ADD COLUMN range_min REAL;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE measurements ADD COLUMN range_max REAL;`);
  } catch {}

  // Permite guardar valores independientes, sin crear un examen artificial.
  // SQLite no permite quitar NOT NULL con ALTER COLUMN, por lo que se recrea
  // la tabla una sola vez y se conservan todas las filas existentes.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
  const optionalExamMigration = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM schema_migrations WHERE id = 'measurements_optional_exam';`
  );
  if (!optionalExamMigration) {
    await db.execAsync(`PRAGMA foreign_keys = OFF;`);
    try {
      await db.execAsync(`
        BEGIN IMMEDIATE;
        CREATE TABLE measurements_v2 (
          id TEXT PRIMARY KEY NOT NULL,
          exam_id TEXT,
          metric_code TEXT NOT NULL,
          value REAL NOT NULL,
          unit TEXT NOT NULL,
          captured_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          range_min REAL,
          range_max REAL,
          FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
        );
        INSERT INTO measurements_v2
          (id, exam_id, metric_code, value, unit, captured_at, created_at, range_min, range_max)
        SELECT
          id, exam_id, metric_code, value, unit, captured_at, created_at, range_min, range_max
        FROM measurements;
        DROP TABLE measurements;
        ALTER TABLE measurements_v2 RENAME TO measurements;
        INSERT INTO schema_migrations (id, applied_at)
        VALUES ('measurements_optional_exam', '${new Date().toISOString()}');
        COMMIT;
      `);
    } catch (error) {
      try {
        await db.execAsync(`ROLLBACK;`);
      } catch {}
      throw error;
    } finally {
      await db.execAsync(`PRAGMA foreign_keys = ON;`);
    }
  }

  // Catálogo orientativo. Seleccionarlo rellena el formulario, pero cada
  // medición guarda su propia copia y nunca modifica estos valores.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS metric_definitions (
      code TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      default_unit TEXT NOT NULL,
      default_min REAL,
      default_max REAL,
      is_system INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO metric_definitions
      (code, label, default_unit, default_min, default_max, is_system, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?);`,
    ["glucosa_ayunas", "Glucosa en ayunas", "mg/dL", 70, 99, now]
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO metric_definitions
      (code, label, default_unit, default_min, default_max, is_system, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?);`,
    ["colesterol_total", "Colesterol total", "mg/dL", 0, 199, now]
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO metric_definitions
      (code, label, default_unit, default_min, default_max, is_system, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?);`,
    ["hemoglobina", "Hemoglobina", "g/dL", null, null, now]
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO metric_definitions
      (code, label, default_unit, default_min, default_max, is_system, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?);`,
    ["vitamina_d", "Vitamina D", "ng/mL", null, null, now]
  );

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
