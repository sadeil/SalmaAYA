INSERT INTO users (id, name, email, role, password_hash) VALUES
  ('patient_salma', 'Salma', 'salma@example.com', 'patient', 'demo-password-hash'),
  ('doctor_aya', 'Dr. Aya', 'aya@example.com', 'doctor', 'demo-password-hash'),
  ('admin_salma', 'Salma Admin', 'admin@example.com', 'admin', 'demo-password-hash');

INSERT INTO patient_profiles (user_id, initials, problem, pain_level, daily_time_minutes, level, points, commitment_percent, status) VALUES
  ('patient_salma', 'S', 'Lower back pain', 4, 25, 3, 82, 92, 'Approved');

INSERT INTO exercises (id, name, area, duration_minutes, sets, reps, color_class) VALUES
  (1, 'Neck release', 'Neck & shoulders', 4, 2, 8, 'bg-teal-100 text-teal-700'),
  (2, 'Shoulder rolls', 'Upper back', 3, 2, 10, 'bg-blue-100 text-blue-700'),
  (3, 'Cat-cow stretch', 'Spine mobility', 6, 3, 8, 'bg-violet-100 text-violet-700'),
  (4, 'Lower back mobility', 'Lower back', 7, 2, 12, 'bg-amber-100 text-amber-700'),
  (5, 'Posture reset', 'Full posture', 5, 3, 10, 'bg-rose-100 text-rose-700');

INSERT INTO care_plans (id, patient_user_id, title, status, approved_at) VALUES
  (1, 'patient_salma', 'Gentle back mobility', 'Approved', CURRENT_TIMESTAMP);

INSERT INTO care_plan_exercises (care_plan_id, exercise_id, sort_order, completed) VALUES
  (1, 1, 1, 1),
  (1, 2, 2, 1),
  (1, 3, 3, 0),
  (1, 4, 4, 0),
  (1, 5, 5, 0);

INSERT INTO progress_scores (patient_user_id, day_label, score) VALUES
  ('patient_salma', 'Mon', 45),
  ('patient_salma', 'Tue', 62),
  ('patient_salma', 'Wed', 55),
  ('patient_salma', 'Thu', 78),
  ('patient_salma', 'Fri', 72),
  ('patient_salma', 'Sat', 88),
  ('patient_salma', 'Sun', 92);

INSERT INTO messages (patient_user_id, sender_role, body) VALUES
  ('patient_salma', 'assistant', 'مرحبا سلمى. ما المشكلة اليوم؟'),
  ('patient_salma', 'patient', 'My lower back feels tight after sitting at work.'),
  ('patient_salma', 'assistant', 'I can help shape a gentle mobility plan. How strong is the discomfort from 1 to 10?'),
  ('patient_salma', 'patient', 'Around 4, mostly by the end of the day.'),
  ('patient_salma', 'assistant', 'Thanks. Based on your answers, I suggest a 25-minute low-impact mobility plan. A doctor will review it before it becomes active.');

INSERT INTO chatbot_care_state (patient_user_id, current_problem, pain_level, daily_time_minutes, draft_plan_json) VALUES
  ('patient_salma', NULL, NULL, NULL, NULL);

INSERT INTO chat_conversations (
  id, patient_user_id, title, status, messages_json, intake_json, message_count, started_at, ended_at
) VALUES (
  1,
  'patient_salma',
  'محادثة حول ألم أسفل الظهر',
  'completed',
  '[{"from":"user","text":"أشعر بشد في أسفل ظهري بعد الجلوس في العمل."},{"from":"ai","text":"شكرًا لك. تم تسجيل الأعراض وإعداد اقتراح مناسب."}]',
  '{"currentProblem":"lower back","location":"أسفل الظهر","painLevel":4}',
  2,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO form_check_sessions (
  patient_user_id,
  exercise_id,
  exercise_name,
  duration_ms,
  total_reps,
  correct_reps,
  target_reps,
  completed,
  mistakes_json,
  started_at,
  ended_at
) VALUES
  (
    'patient_salma',
    'neckStretch',
    'Neck mobility',
    45000,
    5,
    5,
    5,
    1,
    '{}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT INTO refund_requests (patient_user_id, milestone, amount_ils, status) VALUES
  ('patient_salma', 'Level 1 milestone', 5, 'Approved'),
  ('patient_salma', 'Level 2 milestone', 5, 'Pending');
