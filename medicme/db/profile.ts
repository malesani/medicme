import { getDb } from './index';

export type UserProfile = {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  biological_sex: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  blood_type: string | null;
  onboarding_completed: number;
};

export type UserProfileInput = Omit<UserProfile, 'id' | 'onboarding_completed'>;

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDb();
  return (
    (await db.getFirstAsync<UserProfile>(
      `SELECT id, first_name, last_name, birth_date, biological_sex,
              weight_kg, height_cm, blood_type, onboarding_completed
       FROM user_profile
       WHERE id = 1 AND onboarding_completed = 1;`
    )) ?? null
  );
}

export async function saveUserProfile(input: UserProfileInput): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO user_profile
      (id, first_name, last_name, birth_date, biological_sex, weight_kg,
       height_cm, blood_type, onboarding_completed, created_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       first_name = excluded.first_name,
       last_name = excluded.last_name,
       birth_date = excluded.birth_date,
       biological_sex = excluded.biological_sex,
       weight_kg = excluded.weight_kg,
       height_cm = excluded.height_cm,
       blood_type = excluded.blood_type,
       onboarding_completed = 1,
       updated_at = excluded.updated_at;`,
    [
      input.first_name,
      input.last_name,
      input.birth_date,
      input.biological_sex,
      input.weight_kg,
      input.height_cm,
      input.blood_type,
      now,
      now,
    ]
  );
}
