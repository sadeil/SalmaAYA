CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  initials TEXT NOT NULL,
  problem TEXT NOT NULL,
  pain_level INTEGER NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
  daily_time_minutes INTEGER NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 0,
  commitment_percent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Needs review'
);

CREATE TABLE exercises (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  color_class TEXT NOT NULL
);

CREATE TABLE care_plans (
  id INTEGER PRIMARY KEY,
  patient_user_id TEXT NOT NULL REFERENCES patient_profiles(user_id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Needs review',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT
);

CREATE TABLE care_plan_exercises (
  care_plan_id INTEGER NOT NULL REFERENCES care_plans(id),
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  sort_order INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (care_plan_id, exercise_id)
);

CREATE TABLE progress_scores (
  id INTEGER PRIMARY KEY,
  patient_user_id TEXT NOT NULL REFERENCES patient_profiles(user_id),
  day_label TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100)
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  patient_user_id TEXT NOT NULL REFERENCES patient_profiles(user_id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'doctor', 'assistant')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chatbot_care_state (
  patient_user_id TEXT PRIMARY KEY REFERENCES patient_profiles(user_id),
  current_problem TEXT,
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
  daily_time_minutes INTEGER,
  draft_plan_json TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_check_sessions (
  id INTEGER PRIMARY KEY,
  patient_user_id TEXT NOT NULL REFERENCES patient_profiles(user_id),
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  total_reps INTEGER NOT NULL,
  correct_reps INTEGER NOT NULL,
  target_reps INTEGER NOT NULL DEFAULT 5,
  completed INTEGER NOT NULL DEFAULT 0,
  mistakes_json TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refund_requests (
  id INTEGER PRIMARY KEY,
  patient_user_id TEXT NOT NULL REFERENCES patient_profiles(user_id),
  milestone TEXT NOT NULL,
  amount_ils INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
