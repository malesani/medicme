# MedicMe MVP — Arquitectura base (React Native + React Navigation + SQLite)

## 1) Principios del MVP

- **Todo local-first**: los exámenes, archivos y biomarcadores se guardan en el dispositivo.
- **Simple y escalable**: arquitectura por módulos (`features`) sin sobre-ingeniería.
- **Tipado fuerte**: modelos TypeScript claros para evitar errores de dominio.
- **Navegación predecible**: Tabs para secciones principales + Stack por feature cuando aplica.

> Decisión clave: los **valores manuales de biomarcadores** pertenecen al **Detalle del Examen** (no a Perfil), porque están vinculados a un examen y fecha concreta.

---

## 2) Estructura de carpetas propuesta

```txt
medicme/
  app/
    _layout.tsx                      # Root stack/global providers
    (tabs)/
      _layout.tsx                    # Bottom tabs: Home, Historial, Calendario, Perfil
      home/
        index.tsx                    # HomeScreen
      historial/
        index.tsx                    # HistorialScreen
        [examId].tsx                 # ExamDetailScreen
      calendario/
        index.tsx                    # CalendarScreen
      perfil/
        index.tsx                    # ProfileScreen
    exam/
      create.tsx                     # CreateExamScreen (wizard/flow simple)
      add-biomarker.tsx              # AddBiomarkerValueScreen (opcional)

  src/
    features/
      exams/
        screens/
          CreateExamScreen.tsx
          ExamDetailScreen.tsx
        components/
          ExamCard.tsx
          BiomarkerRow.tsx
          FilePreview.tsx
          EmptyState.tsx
        hooks/
          useCreateExam.ts
          useExamDetail.ts
        types.ts
        repository.ts
      history/
        screens/
          HistoryScreen.tsx
        components/
          HistoryList.tsx
          FilterBar.tsx
      calendar/
        screens/
          CalendarScreen.tsx
        components/
          CalendarDotsLegend.tsx
      profile/
        screens/
          ProfileScreen.tsx
        repository.ts
      home/
        screens/
          HomeScreen.tsx
        components/
          SummaryCard.tsx

    db/
      sqlite.ts                      # init de SQLite + conexión singleton
      migrations.ts                  # create tables + índices
      seed.ts                        # opcional para data de demo local

    services/
      file-storage.service.ts        # copiar PDF/imagen a app sandbox + URI estable
      date.service.ts                # helpers para formato y calendario

    repositories/
      exam.repository.ts             # CRUD exam + joins básicos
      biomarker.repository.ts        # CRUD biomarker definitions + exam values
      profile.repository.ts          # perfil local

    navigation/
      types.ts                       # tipos de navegación (param lists)

    state/
      useAppStore.ts                 # estado liviano (Zustand o Context + reducer)

    shared/
      components/
        Screen.tsx
        AppHeader.tsx
        PrimaryButton.tsx
        InputField.tsx
        DateChip.tsx
      constants/
        biomarker-catalog.ts         # catálogo inicial (Hb, Glucosa, etc.)
      utils/
        validation.ts
        numbers.ts
```

---

## 3) Arquitectura por features/modules

### Capa UI (screens + components)
- Renderiza vistas y captura interacciones.
- No contiene SQL.

### Capa de estado liviana (`state/useAppStore.ts`)
- Guarda estado de UI: filtros activos, exam seleccionado, loading global corto.
- Para MVP: preferir **Zustand** (mínima fricción) o `Context + useReducer` si no quieres deps.

### Capa repository
- API limpia para la app: `createExam`, `getExamById`, `listExams`, etc.
- Internamente usa `db/sqlite.ts` y SQL parametrizado.

### Capa services
- Lógica transversal no-UI (copiar archivos locales, formatear fechas, validaciones de dominio simples).

### Capa DB
- Inicializa SQLite, corre migraciones y expone conexión.

---

## 4) Navegación principal e interna

## Tabs (root)
- `HomeTab`
- `HistoryTab`
- `CalendarTab`
- `ProfileTab`

## Stacks por tab (simple)
- **HomeTab**
  - `HomeScreen`
  - acción CTA: navegar a `CreateExamScreen`

- **HistoryTab**
  - `HistoryScreen`
  - `ExamDetailScreen` (push con `examId`)

- **CalendarTab**
  - `CalendarScreen`
  - desde fecha -> `HistoryScreen` filtrado o `ExamDetailScreen`

- **ProfileTab**
  - `ProfileScreen`

- **Root modal/stack extra**
  - `CreateExamScreen` (puede abrirse desde Home o Historial)

### Tipos de navegación (ejemplo)
```ts
export type RootStackParamList = {
  Tabs: undefined;
  CreateExam: { draftDate?: string } | undefined;
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  ExamDetail: { examId: string };
};
```

---

## 5) Tipos/modelos TypeScript propuestos

```ts
export type ExamFileType = 'pdf' | 'image';

export interface UserProfile {
  id: string;
  fullName: string;
  birthDate?: string; // ISO yyyy-mm-dd
  sex?: 'female' | 'male' | 'other';
  updatedAt: string;
}

export interface Exam {
  id: string;
  examDate: string; // ISO date
  labName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamFile {
  id: string;
  examId: string;
  fileUri: string; // sandbox local uri
  fileType: ExamFileType;
  fileName?: string;
  mimeType?: string;
  createdAt: string;
}

export interface BiomarkerDefinition {
  id: string;
  code: string; // e.g. HGB, GLU
  name: string; // Hemoglobina
  unit?: string; // g/dL
  category?: 'hematology' | 'metabolic' | 'lipids' | 'other';
}

export interface ExamBiomarkerValue {
  id: string;
  examId: string;
  biomarkerId: string;
  value: number;
  unit?: string; // override opcional
  referenceMin?: number;
  referenceMax?: number;
  notes?: string;
  createdAt: string;
}
```

---

## 6) Esquema SQLite (MVP)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_date TEXT,
  sex TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  exam_date TEXT NOT NULL,
  lab_name TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_files (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('pdf', 'image')),
  file_name TEXT,
  mime_type TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS biomarker_definitions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS exam_biomarker_values (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  biomarker_id TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  reference_min REAL,
  reference_max REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (biomarker_id) REFERENCES biomarker_definitions(id)
);

CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_files_exam_id ON exam_files(exam_id);
CREATE INDEX IF NOT EXISTS idx_values_exam_id ON exam_biomarker_values(exam_id);
CREATE INDEX IF NOT EXISTS idx_values_biomarker_id ON exam_biomarker_values(biomarker_id);
```

---

## 7) Servicios y repositorios (acceso simple)

## `db/sqlite.ts`
- Abrir DB.
- Exponer `runAsync`, `getAllAsync`, `getFirstAsync`.
- Llamar `runMigrations()` al iniciar app.

## `services/file-storage.service.ts`
- Recibe URI del picker (`DocumentPicker`/`ImagePicker`).
- Copia archivo al sandbox (`FileSystem.documentDirectory + /exams/...`).
- Devuelve URI local persistente.

## `repositories/exam.repository.ts` (contrato sugerido)
```ts
export interface CreateExamInput {
  examDate: string;
  labName?: string;
  notes?: string;
  file?: {
    uri: string;
    type: 'pdf' | 'image';
    name?: string;
    mimeType?: string;
  };
  biomarkers: Array<{
    biomarkerCode: string;
    value: number;
    unit?: string;
    referenceMin?: number;
    referenceMax?: number;
    notes?: string;
  }>;
}

export interface ExamRepository {
  createExam(input: CreateExamInput): Promise<string>;
  listExams(params?: { from?: string; to?: string; search?: string }): Promise<Exam[]>;
  getExamDetail(examId: string): Promise<{
    exam: Exam;
    file?: ExamFile;
    biomarkers: Array<ExamBiomarkerValue & { biomarkerName: string; biomarkerCode: string }>;
  }>;
  getExamDates(): Promise<string[]>; // para calendario
}
```

### Nota implementación
- `createExam` idealmente en transacción: inserta examen, archivo y biomarcadores juntos.

---

## 8) Pantallas iniciales del MVP

1. **HomeScreen**
   - Resumen rápido: total de exámenes, último examen, CTA “Agregar examen”.

2. **HistoryScreen**
   - Lista cronológica (reciente primero).
   - Tap en item -> `ExamDetailScreen`.

3. **ExamDetailScreen**
   - Metadata del examen (fecha, laboratorio, notas).
   - Preview o link del archivo PDF/imagen asociado.
   - Tabla/lista de biomarcadores manuales.

4. **CalendarScreen**
   - Vista mensual con puntos/markers en fechas con examen.
   - Tap en fecha: filtrar historial de ese día.

5. **ProfileScreen**
   - Datos básicos: nombre, fecha de nacimiento, sexo.
   - Persistido local en `user_profile`.

6. **CreateExamScreen** (flujo principal)
   - Fecha de examen.
   - Laboratorio/notas.
   - Adjuntar PDF/imagen.
   - Agregar biomarcadores manuales.
   - Guardar.

---

## 9) Componentes reutilizables recomendados

- `PrimaryButton`: botón principal de acciones.
- `InputField`: input con label/error.
- `DateChip`: píldora de fecha reutilizable.
- `ExamCard`: tarjeta de examen para Home/Historial.
- `BiomarkerRow`: fila editable para valor manual.
- `FilePreview`: abre imagen o PDF local.
- `EmptyState`: estados vacíos consistentes.

---

## 10) Flujo de creación de nuevo examen (end-to-end)

1. Usuario toca **Agregar examen**.
2. En `CreateExamScreen` completa fecha + datos opcionales.
3. Selecciona PDF/imagen desde picker.
4. App copia archivo a sandbox local (`file-storage.service`).
5. Usuario agrega biomarcadores manuales (nombre/código, valor, unidad).
6. Tap en guardar.
7. `exam.repository.createExam` corre transacción SQLite.
8. Navega a `ExamDetailScreen` del nuevo examen.
9. Home, Historial y Calendario reflejan cambios al recargar/query.

---

## 11) Estado del MVP: estrategia simple (sin sobrecargar)

Recomendación práctica:

- **Fuente de verdad**: SQLite.
- **Estado global mínimo** con Zustand:
  - filtros de historial (`from`, `to`, `search`).
  - `selectedDate` del calendario.
  - banderas de loading UI.
- **Estado de formulario local** con `useState` + validación simple.
- **Sin cache compleja** al inicio; refrescar queries al volver de `CreateExamScreen`.

Si prefieres cero dependencias extra:
- usa `Context + useReducer` para filtros y selección de fecha.

---

## 12) Responsabilidad concreta por archivos clave

- `src/db/sqlite.ts`: conexión única SQLite + helpers de query.
- `src/db/migrations.ts`: tablas, índices, migraciones versionadas.
- `src/repositories/exam.repository.ts`: casos de uso de exámenes (listado, detalle, creación).
- `src/repositories/profile.repository.ts`: lectura/escritura de perfil local.
- `src/services/file-storage.service.ts`: persistencia de archivos en sandbox.
- `src/features/home/screens/HomeScreen.tsx`: resumen del usuario.
- `src/features/history/screens/HistoryScreen.tsx`: listado y filtros.
- `src/features/exams/screens/ExamDetailScreen.tsx`: detalle completo del examen.
- `src/features/calendar/screens/CalendarScreen.tsx`: fechas con exámenes.
- `src/features/profile/screens/ProfileScreen.tsx`: datos básicos de usuario.

---

## 13) Roadmap corto post-MVP (opcional)

- OCR de PDF/imagen para sugerir biomarcadores.
- Export/backup cifrado local.
- Tendencias por biomarcador (gráficas).
- Alertas de valores fuera de rango.

