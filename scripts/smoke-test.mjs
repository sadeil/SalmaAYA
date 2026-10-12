import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

const localPort = process.env.BASE_URL ? null : await findFreePort();
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${localPort}`;
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

const SALMA = { email: "salma@remedyquest.app", password: "Salma@2026" };
const AYA = { email: "aya@remedyquest.app", password: "Aya@2026" };

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", message => {
  if (message.type() !== "error") return;
  const text = message.text();
  // Expected 401/409 responses from the negative auth checks below.
  if (/status of (401|403|409)/.test(text)) return;
  errors.push(`console: ${text}`);
});
page.on("pageerror", error => errors.push(`page: ${error.message}`));

const bodyText = () => page.locator("body").innerText();
// Stat numbers count up, so wait for the final values instead of reading once.
async function expectTexts(texts, label) {
  for (const text of texts) {
    await page.waitForFunction((wanted) => document.body.innerText.includes(wanted), text, { timeout: 6000 })
      .catch(() => errors.push(`${label} is missing "${text}"`));
  }
}
const fail = (message) => errors.push(message);

async function visit(route) {
  const errorCount = errors.length;
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
  if (!response?.ok()) fail(`${route}: HTTP ${response?.status()}`);
  if (!(await page.locator("#root").innerText()).trim()) fail(`${route}: empty root`);
  if (errors.length > errorCount) {
    console.error(errors.join("\n"));
    await browser.close();
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
}

async function logIn({ email, password }, expectedPath) {
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill(password);
  await page.locator("form button.btn-primary").click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 8000 }).catch(() => fail(`login as ${email} did not open ${expectedPath}`));
}

async function signOut() {
  await page.evaluate(() => localStorage.removeItem("rq-session"));
}

async function apiToken({ email, password }) {
  const response = await page.request.post(`${baseURL}/api/auth/login`, { data: { email, password } });
  if (!response.ok()) fail(`API login for ${email} HTTP ${response.status()}`);
  return (await response.json()).token;
}

// ---- 1. Public pages and route guards -------------------------------------
for (const route of ["/", "/login", "/register"]) await visit(route);
const landing = await (await page.goto(baseURL, { waitUntil: "networkidle" }), bodyText());
for (const label of ["Get started", "Log in"]) if (!landing.includes(label)) fail(`landing is missing the "${label}" button`);
if (landing.includes("Doctor login") || landing.includes("Start as a patient")) fail("landing still shows the old hero buttons");

await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
if (!page.url().includes("/login")) fail("signed-out visitor was not redirected to login");
const unauthorized = await page.request.get(`${baseURL}/api/patient/dashboard`);
if (unauthorized.status() !== 401) fail(`patient API without token returned ${unauthorized.status()}`);

await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
await page.getByPlaceholder("you@example.com").fill(SALMA.email);
await page.getByPlaceholder("••••••••").fill("wrong-password");
await page.getByRole("button", { name: "Log in securely" }).click();
await page.waitForSelector("text=Email or password is incorrect.", { timeout: 5000 }).catch(() => fail("wrong password did not show an error"));

// ---- 2. Language toggle ------------------------------------------------------
await page.goto(baseURL, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Switch language" }).first().click();
if (await page.locator("html").getAttribute("dir") !== "rtl") fail("language toggle did not enable RTL");
if (!(await bodyText()).includes("كيف تعمل المنصة")) fail("Arabic navigation translation missing");
await page.reload({ waitUntil: "networkidle" });
if (await page.locator("html").getAttribute("dir") !== "rtl") fail("language choice was not persisted");
await page.goto(`${baseURL}/register`, { waitUntil: "networkidle" });
const registerText = await page.locator("form").innerText();
if (!registerText.includes("الاسم الكامل")) fail("register form is not translated");
if (await page.getByRole("button", { name: "طبيب" }).count()) fail("register page still offers doctor sign-up");
await page.getByRole("button", { name: "Switch language" }).click();
if (await page.locator("html").getAttribute("dir") !== "ltr") fail("language toggle did not restore LTR");

// ---- 3. Salma (demo patient) sees the prototype data -----------------------
await page.getByRole("button", { name: "Switch language" }).click();
await logIn(SALMA, "/patient");
await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
if (!(await bodyText()).includes("اكتمل 2 من 5 تمارين")) fail("Arabic dynamic exercise progress missing for Salma");
await page.getByRole("button", { name: "Switch language" }).first().click();
for (const route of ["/patient", "/patient/exercises", "/patient/form-checker", "/patient/chat", "/patient/rewards", "/patient/refunds", "/patient/messages"]) {
  await visit(route);
}
await page.goto(`${baseURL}/patient`, { waitUntil: "networkidle" });
await expectTexts(["Salma", "82 pts", "Level 3", "12 days", "5 ILS", "2 of 5 complete"], "Salma dashboard");
const salmaDashboard = await bodyText();
if (salmaDashboard.includes("Three steps to your first plan")) fail("Salma sees the new-user onboarding");
await page.goto(`${baseURL}/patient/messages`, { waitUntil: "networkidle" });
if (!(await bodyText()).includes("Much better. I feel less tight")) fail("Salma's doctor conversation is missing");

await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
const startButtons = page.getByRole("button", { name: /Start exercise|Do it again/ });
for (let index = 0; index < await startButtons.count(); index += 1) {
  await startButtons.nth(index).click();
  if (!(await page.locator(".exercise-demo").count())) fail(`guided exercise ${index + 1} did not render`);
  await page.getByRole("button", { name: "Pause demonstration" }).click();
  await page.getByRole("button", { name: "Resume demonstration" }).waitFor();
  await page.getByRole("button", { name: "Set demonstration speed to 1.25x" }).click();
  await page.getByRole("button", { name: "Complete this rep" }).click();
  await page.getByRole("button", { name: "Close" }).click();
}

// Mobile: guided modal fits and the sidebar opens.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Start exercise" }).first().click();
const exerciseModal = page.locator(".fixed.inset-0").last();
if (await exerciseModal.evaluate(element => element.scrollWidth > element.clientWidth)) fail("guided exercise overflows mobile viewport");
await page.getByRole("button", { name: "Close" }).click();
await page.goto(`${baseURL}/patient`, { waitUntil: "networkidle" });
await page.locator("header button").first().click();
if (!(await page.locator(".rq-sidebar").isVisible())) fail("mobile sidebar did not open");
await page.setViewportSize({ width: 1440, height: 900 });

// Sign out through the UI.
await page.goto(`${baseURL}/patient`, { waitUntil: "networkidle" });
await page.locator(".rq-sidebar").getByRole("button", { name: "Sign out" }).click();
await page.waitForURL(`${baseURL}/`, { timeout: 5000 }).catch(() => fail("sign out did not return to the landing page"));
if (await page.evaluate(() => localStorage.getItem("rq-session"))) fail("sign out did not clear the session");

// ---- 4. A brand-new patient starts from zero --------------------------------
const newEmail = `new.patient.${Date.now()}@example.com`;
await page.goto(`${baseURL}/register`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Your full name").fill("Rana Haddad");
await page.getByPlaceholder("you@example.com").fill(newEmail);
await page.getByPlaceholder("At least 8 characters").fill("short");
await page.locator("form input[type=checkbox]").check();
await page.getByRole("button", { name: "Create my account" }).click();
await page.waitForSelector("text=Password must be at least 8 characters.", { timeout: 5000 }).catch(() => fail("short password was accepted"));
await page.getByPlaceholder("At least 8 characters").fill("rana-pass-2026");
await page.getByRole("button", { name: "Create my account" }).click();
await page.waitForURL("**/patient", { timeout: 8000 }).catch(() => fail("registration did not open the patient dashboard"));
await page.waitForSelector("text=Three steps to your first plan", { timeout: 8000 }).catch(() => fail("new patient does not see the onboarding steps"));
await expectTexts(["Rana", "0 pts", "Level 1", "0 days", "0 ILS", "No care plan yet"], "new patient dashboard");
const freshDashboard = await bodyText();
for (const leaked of ["Salma", "82 pts"]) {
  if (freshDashboard.includes(leaked)) fail(`new patient dashboard leaks demo data "${leaked}"`);
}
await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
if (!(await bodyText()).includes("Your plan is empty")) fail("new patient exercises page is not empty");
await page.goto(`${baseURL}/patient/refunds`, { waitUntil: "networkidle" });
if (!(await bodyText()).includes("No rewards yet")) fail("new patient has reward history");
await page.goto(`${baseURL}/patient/messages`, { waitUntil: "networkidle" });
if (!(await bodyText()).includes("No messages yet")) fail("new patient has doctor messages");

// Build a plan through the assistant.
await page.goto(`${baseURL}/patient/chat`, { waitUntil: "networkidle" });
if (!(await bodyText()).includes("مرحبًا Rana")) fail("assistant does not greet the new patient by name");
const chatInput = page.locator("input.field").first();
for (const answer of ["My back feels stiff today", "lower back", "3", "none", "one week", "15", "pain relief", "easy"]) {
  await chatInput.fill(answer);
  await chatInput.press("Enter");
  await page.waitForFunction(() => !document.querySelector(".typing-dots"), null, { timeout: 8000 });
}
await page.waitForSelector("text=معاينة الخطة", { timeout: 8000 }).catch(() => fail("AI chat did not render a plan preview"));
await page.getByRole("button", { name: "موافقة وإضافة إلى التمارين" }).click();
await page.waitForSelector("text=تمت الموافقة", { timeout: 8000 }).catch(() => fail("AI chat did not confirm approved exercises"));
const [endConversationResponse] = await Promise.all([
  page.waitForResponse((response) => response.url().includes("/api/patient/conversations/end")),
  page.getByRole("button", { name: "إنهاء المحادثة" }).click(),
]);
if (!endConversationResponse.ok()) fail(`end conversation HTTP ${endConversationResponse.status()}`);
await page.waitForSelector("text=محادثة محفوظة", { timeout: 8000 }).catch(() => fail("completed conversation did not appear in chat history"));

// Complete one exercise and earn points.
await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
if (!(await bodyText()).includes("0 of 3 exercises complete")) fail("approved plan did not create 3 exercises");
await page.getByRole("button", { name: "Start exercise" }).first().click();
for (let step = 0; step < 20; step += 1) {
  const finish = page.getByRole("button", { name: "Finish exercise" });
  if (await finish.count()) {
    await finish.click();
    break;
  }
  await page.getByRole("button", { name: "Complete this rep" }).click();
}
await page.waitForSelector("text=+5 points earned", { timeout: 5000 }).catch(() => fail("completing an exercise did not award points"));
await page.goto(`${baseURL}/patient`, { waitUntil: "networkidle" });
await expectTexts(["5 pts", "1 day", "1 of 3 complete"], "dashboard after first exercise");
const progressedDashboard = await bodyText();
if (progressedDashboard.includes("Three steps to your first plan")) fail("onboarding still shows after the patient started");

// Logging in again keeps the new patient's own data.
await signOut();
await logIn({ email: newEmail, password: "rana-pass-2026" }, "/patient");
await expectTexts(["5 pts", "1 of 3 complete"], "new patient after logging in again");
await signOut();

// Duplicate registration is rejected.
const duplicate = await page.request.post(`${baseURL}/api/auth/register`, { data: { name: "Again", email: newEmail.toUpperCase(), password: "another-pass" } });
if (duplicate.status() !== 409) fail(`duplicate registration returned ${duplicate.status()}`);

// ---- 5. Dr. Aya (demo doctor) --------------------------------------------------
await logIn(AYA, "/doctor");
for (const route of ["/doctor", "/doctor/patients", "/doctor/patients/1", "/doctor/messages", "/admin"]) await visit(route);
await page.goto(`${baseURL}/patient`, { waitUntil: "networkidle" });
if (!page.url().endsWith("/doctor")) fail("doctor was not redirected away from the patient area");
await page.goto(`${baseURL}/admin`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Database viewer", { timeout: 5000 }).catch(() => fail("admin database viewer did not render"));
await page.waitForSelector("text=Loaded tables:", { timeout: 5000 }).catch(() => fail("admin database viewer did not show loaded tables state"));

const ayaToken = await apiToken(AYA);
const snapshotResponse = await page.request.get(`${baseURL}/api/admin/database`, { headers: { Authorization: `Bearer ${ayaToken}` } });
if (!snapshotResponse.ok()) fail(`admin database API HTTP ${snapshotResponse.status()}`);
else {
  const snapshot = await snapshotResponse.json();
  const raw = JSON.stringify(snapshot);
  if (raw.includes("passwordHash") || raw.includes("scrypt$")) fail("admin database API leaks password hashes");
  if (!snapshot.status?.connected) fail("admin database API reports disconnected database");
  if (!snapshot.tables?.users?.some((user) => user.email === newEmail)) fail("registered patient is missing from the users table");
  if (!snapshot.tables?.messages?.length) fail("admin database API missing messages table");
  if (!snapshot.tables?.exercises?.length) fail("admin database API missing exercises table");
}
const salmaToken = await apiToken(SALMA);
const forbidden = await page.request.get(`${baseURL}/api/admin/database`, { headers: { Authorization: `Bearer ${salmaToken}` } });
if (forbidden.status() !== 403) fail(`patient could open the admin database (HTTP ${forbidden.status()})`);

await browser.close();
if (serverProcess) serverProcess.kill();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Smoke test passed: public pages, auth guards, demo patient and doctor, fresh-patient onboarding, chat plan, points, localization, admin viewer, and mobile layout.");
