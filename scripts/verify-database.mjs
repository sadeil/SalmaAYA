import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

const port = await findFreePort();
const baseURL = `http://127.0.0.1:${port}`;
const testDatabasePath = join(tmpdir(), `remedyquest-db-${Date.now()}.json`);

const server = spawn("node", ["backend/src/server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), JSON_DATABASE_PATH: testDatabasePath },
  stdio: "ignore",
  windowsHide: true,
});

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/api/health`);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Backend server did not start.");
}

let token = null;

async function post(path, data) {
  const response = await fetch(`${baseURL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`${path} failed with HTTP ${response.status}`);
  return response.json();
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const selectedPort = address?.port;
      probe.close(() => {
        if (selectedPort) resolve(selectedPort);
        else reject(new Error("Could not allocate a free local port."));
      });
    });
  });
}

try {
  await waitForServer();

  const registered = await post("/auth/register", {
    name: "Database Check",
    email: `db.check.${Date.now()}@example.com`,
    password: "db-check-2026",
    problem: "Neck stiffness",
    time: "20 minutes",
  });
  token = registered.token;

  const headFollowUp = await post("/patient/messages", { text: "الرأس" });
  if (!headFollowUp.messages?.[0]?.text?.includes("الجبهة")) {
    throw new Error("Head complaint did not receive a tailored location question.");
  }
  await post("/patient/messages", { text: "من جديد" });

  await post("/patient/sessions", {
    exerciseId: "neckStretch",
    exerciseName: "Neck mobility",
    durationMs: 30000,
    totalReps: 5,
    correctReps: 5,
    targetReps: 5,
    completed: true,
    mistakes: {},
  });

  for (const text of ["my neck is stiff today", "left side of neck", "3", "none", "one week", "15", "pain relief", "easy"]) {
    await post("/patient/messages", { text });
  }
  await post("/patient/messages", { text: "approve" });
  await post("/patient/messages", { text: "من جديد" });
  for (const text of ["ألم في الرقبة", "الجهة اليمنى من الرقبة", "4", "لا يوجد", "منذ أسبوع", "10", "تخفيف الألم", "سهل"]) {
    await post("/patient/messages", { text });
  }
  await post("/patient/messages", { text: "موافق" });
  await post("/patient/conversations/end", {});

  const raw = await readFile(testDatabasePath, "utf8");
  const db = JSON.parse(raw);
  const user = db.users.find((item) => item.id === registered.user.id);
  const record = db.patients?.[registered.user.id];

  if (!user || !String(user.passwordHash).startsWith("scrypt$") || raw.includes("db-check-2026")) {
    throw new Error("Database did not store a hashed password for the new patient.");
  }
  if (!db.users.some((item) => item.email === "salma@remedyquest.app") || !db.users.some((item) => item.email === "aya@remedyquest.app")) {
    throw new Error("Database is missing the demo accounts.");
  }
  if (!record) throw new Error("Database did not create a patient record.");
  if (!Array.isArray(record.formCheckSessions) || record.formCheckSessions.length < 1) {
    throw new Error("Database did not persist form check sessions.");
  }
  if (record.points !== 5 || record.streak !== 1) {
    throw new Error(`Completed camera session did not award points (points ${record.points}, streak ${record.streak}).`);
  }
  if (!Array.isArray(record.chat?.conversations) || record.chat.conversations.length !== 1) {
    throw new Error("Database did not persist the completed conversation.");
  }
  const archivedMessages = record.chat.conversations[0].messages;
  if (!archivedMessages.some((message) => message.text?.includes("تمت الموافقة"))) {
    throw new Error("Database did not persist chatbot messages.");
  }
  if (!archivedMessages.some((message) => message.text === "موافق")) {
    throw new Error("Database did not persist Arabic chatbot approval.");
  }
  if (record.chat.messages.length !== 1 || record.chat.messages[0].from !== "ai" || !record.chat.messages[0].text.includes("Database")) {
    throw new Error("Database did not reset the active conversation (with the patient's name) after ending it.");
  }
  const neckCount = record.exercises.filter((exercise) => exercise.name === "تمرين الرقبة").length;
  if (neckCount < 2) throw new Error("Database did not save the approved neck plan exercises.");
  if (!record.exercises.every((exercise) => exercise.templateId)) {
    throw new Error("Approved exercises are missing their guide template.");
  }
  if (record.chat.draftPlan !== null) throw new Error("Database did not clear chatbot draft plan after approval.");

  const salma = db.patients[db.users.find((item) => item.email === "salma@remedyquest.app").id];
  if (salma.points !== 82 || salma.exercises.length !== 5) {
    throw new Error("Another patient's activity changed the demo patient's data.");
  }

  console.log("Database persistence verified.");
} finally {
  server.kill();
}
