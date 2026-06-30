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

async function post(path, data) {
  const response = await fetch(`${baseURL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  for (const text of [
    "my neck is stiff today",
    "left side of neck",
    "3",
    "none",
    "one week",
    "15",
    "pain relief",
    "easy",
  ]) {
    await post("/patient/messages", { text });
  }
  await post("/patient/messages", { text: "approve" });
  await post("/patient/messages", { text: "من جديد" });
  for (const text of [
    "ألم في الرقبة",
    "الجهة اليمنى من الرقبة",
    "4",
    "لا يوجد",
    "منذ أسبوع",
    "10",
    "تخفيف الألم",
    "سهل",
  ]) {
    await post("/patient/messages", { text });
  }
  await post("/patient/messages", { text: "موافق" });
  await post("/patient/conversations/end", {});

  const raw = await readFile(testDatabasePath, "utf8");
  const db = JSON.parse(raw);

  if (!Array.isArray(db.formCheckSessions) || db.formCheckSessions.length < 1) {
    throw new Error("Database did not persist form check sessions.");
  }
  if (!Array.isArray(db.chatConversations) || db.chatConversations.length !== 1) {
    throw new Error("Database did not persist the completed conversation.");
  }
  const archivedMessages = db.chatConversations[0].messages;
  if (!Array.isArray(archivedMessages) || !archivedMessages.some((message) => message.text?.includes("تمت الموافقة"))) {
    throw new Error("Database did not persist chatbot messages.");
  }
  if (!archivedMessages.some((message) => message.text === "موافق")) {
    throw new Error("Database did not persist Arabic chatbot approval.");
  }
  if (db.messages.length !== 1 || db.messages[0].from !== "ai") {
    throw new Error("Database did not reset the active conversation after ending it.");
  }
  if (!Array.isArray(db.exercises) || !db.exercises.some((exercise) => exercise.name === "تمرين الرقبة")) {
    throw new Error("Database did not persist approved chat exercises.");
  }
  const neckMobilityCount = db.exercises.filter((exercise) => exercise.name === "تمرين الرقبة").length;
  if (neckMobilityCount < 2) {
    throw new Error("Database did not save the Arabic neck plan exercises.");
  }
  if (!db.patientProfile?.name || !db.chatCareState) {
    throw new Error("Database is missing patient profile or chatbot state.");
  }
  if (db.chatCareState.draftPlan !== null) {
    throw new Error("Database did not clear chatbot draft plan after approval.");
  }

  console.log("Database persistence verified.");
} finally {
  server.kill();
}
