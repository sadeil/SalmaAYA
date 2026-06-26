import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

const localPort = process.env.BASE_URL ? null : await findFreePort();
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${localPort}`;
const routes = [
  "/", "/login", "/register", "/patient", "/patient/exercises", "/patient/form-checker", "/patient/chat",
  "/patient/rewards", "/patient/refunds", "/patient/messages", "/doctor",
  "/doctor/patients", "/doctor/patients/1", "/doctor/messages", "/admin"
];
const errors = [];
let serverProcess = null;
const testDatabasePath = join(tmpdir(), `remedyquest-smoke-${Date.now()}.json`);

async function waitForServer() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/api/health`);
      if (response.ok) return true;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

if (!(await waitForServer())) {
  serverProcess = spawn("node", ["backend/src/server.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(localPort), JSON_DATABASE_PATH: testDatabasePath },
    stdio: "ignore",
    windowsHide: true,
  });
  if (!(await waitForServer())) {
    console.error("Backend server did not start for smoke test.");
    process.exit(1);
  }
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

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", message => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", error => errors.push(`page: ${error.message}`));

for (const route of routes) {
  const errorCount = errors.length;
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
  if (!response?.ok()) errors.push(`${route}: HTTP ${response?.status()}`);
  if (!(await page.locator("#root").innerText()).trim()) errors.push(`${route}: empty root`);
  if (errors.length > errorCount) {
    console.error(errors.join("\n"));
    await browser.close();
    process.exit(1);
  }
}

await page.goto(baseURL, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Switch language" }).first().click();
if (await page.locator("html").getAttribute("dir") !== "rtl") errors.push("language toggle did not enable RTL");
if (!(await page.locator("body").innerText()).includes("كيف تعمل المنصة")) errors.push("Arabic navigation translation missing");
await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
if ((await page.locator("body").innerText()).includes("exercises complete")) errors.push("Arabic exercise progress translation missing");
if (!(await page.locator("body").innerText()).includes("اكتمل 2 من 5 تمارين")) errors.push("Arabic dynamic exercise progress missing");
await page.goto(baseURL, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
if (await page.locator("html").getAttribute("dir") !== "rtl") errors.push("language choice was not persisted");
await page.getByRole("button", { name: "Switch language" }).first().click();
if (await page.locator("html").getAttribute("dir") !== "ltr") errors.push("language toggle did not restore LTR");

await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
await page.getByPlaceholder("you@example.com").fill("maya@example.com");
await page.getByPlaceholder("••••••••").fill("password");
await page.getByRole("button", { name: "Log in securely" }).click();
await page.waitForURL("**/patient");

await page.goto(`${baseURL}/register`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Switch language" }).click();
await page.getByRole("button", { name: "طبيب" }).click();
const registerText = await page.locator("form").innerText();
if (registerText.includes("العمر")) errors.push("doctor registration incorrectly shows age field");
if (!registerText.includes("التخصص") || !registerText.includes("رقم الترخيص الطبي")) errors.push("doctor registration fields are mislabeled in Arabic");
await page.getByRole("button", { name: "Switch language" }).click();

await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
const startButtons = page.getByRole("button", { name: /Start exercise|Do it again/ });
for (let index = 0; index < await startButtons.count(); index += 1) {
  await startButtons.nth(index).click();
  if (!(await page.locator(".exercise-demo").count())) errors.push(`guided exercise ${index + 1} did not render`);
  await page.getByRole("button", { name: "Pause demonstration" }).click();
  await page.getByRole("button", { name: "Resume demonstration" }).waitFor();
  await page.getByRole("button", { name: "Set demonstration speed to 1.25x" }).click();
  await page.getByRole("button", { name: "Complete this rep" }).click();
  await page.getByRole("button", { name: "Close" }).click();
}

await page.goto(`${baseURL}/patient/chat`, { waitUntil: "networkidle" });
const chatInput = page.locator("input[placeholder*='current problem'], input[placeholder*='Describe how you feel']").first();
await chatInput.fill("My back feels better today");
await chatInput.press("Enter");
if (!(await page.getByText("My back feels better today").count())) errors.push("AI chat send failed");
await page.waitForSelector("text=/pain|discomfort/i", { timeout: 5000 }).catch(() =>
  errors.push("AI chat did not ask for missing pain level"),
);
await chatInput.fill("3 out of 10 and I have 15 minutes");
await chatInput.press("Enter");
await page.waitForSelector("text=Plan preview", { timeout: 8000 }).catch(() =>
  errors.push("AI chat did not render a plan preview"),
);
await page.getByRole("button", { name: "Approve and add to Exercises" }).click();
await page.waitForSelector("text=Approved. I added", { timeout: 8000 }).catch(() =>
  errors.push("AI chat did not confirm approved exercises"),
);

const chatDatabaseResponse = await page.request.get(`${baseURL}/api/admin/database`);
if (!chatDatabaseResponse.ok()) errors.push(`chat database verification HTTP ${chatDatabaseResponse.status()}`);
else {
  const snapshot = await chatDatabaseResponse.json();
  if (!snapshot.tables?.messages?.some((message) => message.text?.includes("Approved. I added"))) {
    errors.push("approved chatbot message was not saved to database");
  }
  if (!Array.isArray(snapshot.tables?.exercises) || snapshot.tables.exercises.length < 8) {
    errors.push("approved chatbot exercises were not saved to database");
  }
  if (snapshot.tables?.chatCareState?.draftPlan !== null) {
    errors.push("chat draft plan was not cleared after approval");
  }
}

await page.goto(`${baseURL}/admin`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Database viewer", { timeout: 5000 }).catch(() =>
  errors.push("admin database viewer did not render"),
);
await page.waitForSelector("text=Loaded tables:", { timeout: 5000 }).catch(() =>
  errors.push("admin database viewer did not show loaded tables state"),
);
const adminDatabaseText = await page.locator("body").innerText();
for (const requiredText of ["Live database", "Loaded tables:", "Patients", "Exercises", "Messages", "Form Check Sessions"]) {
  if (!adminDatabaseText.includes(requiredText)) errors.push(`admin database viewer missing ${requiredText}`);
}
const databaseResponse = await page.request.get(`${baseURL}/api/admin/database`);
if (!databaseResponse.ok()) errors.push(`admin database API HTTP ${databaseResponse.status()}`);
else {
  const databaseSnapshot = await databaseResponse.json();
  if (!databaseSnapshot.status?.connected) errors.push("admin database API reports disconnected database");
  if (!Array.isArray(databaseSnapshot.tables?.patients) || !databaseSnapshot.tables.patients.length) errors.push("admin database API missing patients table");
  if (!Array.isArray(databaseSnapshot.tables?.exercises) || !databaseSnapshot.tables.exercises.length) errors.push("admin database API missing exercises table");
  if (!Array.isArray(databaseSnapshot.tables?.messages) || !databaseSnapshot.tables.messages.length) errors.push("admin database API missing messages table");
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Start exercise" }).first().click();
const exerciseModal = page.locator(".fixed.inset-0").last();
if ((await exerciseModal.evaluate(element => element.scrollWidth > element.clientWidth))) errors.push("guided exercise overflows mobile viewport");
await page.getByRole("button", { name: "Close" }).click();
await page.goto(`${baseURL}/patient`, { waitUntil: "networkidle" });
await page.locator("header button").first().click();
if (!(await page.locator(".rq-sidebar").isVisible())) errors.push("mobile sidebar did not open");

await browser.close();
if (serverProcess) serverProcess.kill();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Smoke test passed: ${routes.length} routes, localization, login, exercise, chat, database viewer, and mobile navigation.`);
