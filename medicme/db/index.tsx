// db/index.ts
import { randomUUID } from "expo-crypto";
import { Db, openDb, initDb } from "./schema";

export type Exam = {
    id: string;
    date: string; // ISO
    type: string;
    notes?: string | null;
    created_at: string;
    updated_at: string;
};

let _db: Db | null = null;

export async function getDb(): Promise<Db> {
    if (_db) return _db;
    const db = await openDb();
    await initDb(db);
    _db = db;
    return db;
}

// Crea un examen básico
export async function createExam(input: {
    date: string;
    type: string;
    notes?: string | null;
}): Promise<Exam> {
    const db = await getDb();
    const now = new Date().toISOString();

    const exam: Exam = {
        id: randomUUID(),
        date: input.date,
        type: input.type,
        notes: input.notes ?? null,
        created_at: now,
        updated_at: now,

    };

    await db.runAsync(
        `INSERT INTO exams (id, date, type, notes, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL);`,
        [exam.id, exam.date, exam.type, exam.notes!, exam.created_at, exam.updated_at]
    );

    return exam;
}

// Lista exámenes
export async function listExams(): Promise<Exam[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Exam>(
        `SELECT id, date, type, notes, created_at, updated_at
     FROM exams
     WHERE deleted_at IS NULL
     ORDER BY date DESC;`
    );
    return rows;
}

export async function addAttachment(input: {
    examId: string;
    path: string;
    mimeType: string;
    size?: number;
}) {
    const db = await getDb();
    const now = new Date().toISOString();

    const id = randomUUID();

    await db.runAsync(
        `INSERT INTO attachments
     (id, exam_id, path, mime_type, size, created_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL);`,
        [id, input.examId, input.path, input.mimeType, input.size ?? null, now]
    );

    return id;
}