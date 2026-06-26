INSERT INTO users (id, name, email, role, password_hash) VALUES
  ('patient_maya', 'Maya Khalil', 'maya@example.com', 'patient', 'demo-password-hash'),
  ('doctor_adam', 'Dr. Adam Noor', 'adam@example.com', 'doctor', 'demo-password-hash'),
  ('admin_salma', 'Salma Admin', 'admin@example.com', 'admin', 'demo-password-hash');

INSERT INTO patient_profiles (user_id, initials, problem, pain_level, daily_time_minutes, level, points, commitment_percent, status) VALUES
  ('patient_maya', 'MK', 'Lower back pain', 4, 25, 3, 82, 92, 'Approved');

INSERT INTO exercises (id, name, area, duration_minutes, sets, reps, color_class) VALUES
  (1, 'Neck release', 'Neck & shoulders', 4, 2, 8, 'bg-teal-100 text-teal-700'),
  (2, 'Shoulder rolls', 'Upper back', 3, 2, 10, 'bg-blue-100 text-blue-700'),
  (3, 'Cat-cow stretch', 'Spine mobility', 6, 3, 8, 'bg-violet-100 text-violet-700'),
  (4, 'Lower back mobility', 'Lower back', 7, 2, 12, 'bg-amber-100 text-amber-700'),
  (5, 'Posture reset', 'Full posture', 5, 3, 10, 'bg-rose-100 text-rose-700');

INSERT INTO care_plans (id, patient_user_id, title, status, approved_at) VALUES
  (1, 'patient_maya', 'Gentle back mobility', 'Approved', CURRENT_TIMESTAMP);

INSERT INTO care_plan_exercises (care_plan_id, exercise_id, sort_order, completed) VALUES
  (1, 1, 1, 1),
  (1, 2, 2, 1),
  (1, 3, 3, 0),
  (1, 4, 4, 0),
  (1, 5, 5, 0);

INSERT INTO progress_scores (patient_user_id, day_label, score) VALUES
  ('patient_maya', 'Mon', 45),
  ('patient_maya', 'Tue', 62),
  ('patient_maya', 'Wed', 55),
  ('patient_maya', 'Thu', 78),
  ('patient_maya', 'Fri', 72),
  ('patient_maya', 'Sat', 88),
  ('patient_maya', 'Sun', 92);

INSERT INTO messages (patient_user_id, sender_role, body) VALUES
  ('patient_maya', 'assistant', 'Hi Maya. I am your RemedyQuest assistant. What is bothering you today?'),
  ('patient_maya', 'patient', 'My lower back feels tight after sitting at work.'),
  ('patient_maya', 'assistant', 'I can help shape a gentle mobility plan. How strong is the discomfort from 1 to 10?'),
  ('patient_maya', 'patient', 'Around 4, mostly by the end of the day.'),
  ('patient_maya', 'assistant', 'Thanks. Based on your answers, I suggest a 25-minute low-impact mobility plan. A doctor will review it before it becomes active.');

INSERT INTO chatbot_care_state (patient_user_id, current_problem, pain_level, daily_time_minutes, draft_plan_json) VALUES
  ('patient_maya', NULL, NULL, NULL, NULL);

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
    'patient_maya',
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
  ('patient_maya', 'Level 1 milestone', 5, 'Approved'),
  ('patient_maya', 'Level 2 milestone', 5, 'Pending');
