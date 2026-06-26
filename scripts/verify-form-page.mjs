// Headless run of the new /patient/form-checker page + the inline camera
// toggle in the guided modal. We can't grant a real camera in headless mode,
// so we focus on what we CAN verify: page loads, no JS errors, the
// camera-form-check panel renders inside the guided modal, and the toggle
// button reaches the disabled-without-rule branch when expected.

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

const localPort = process.env.BASE_URL ? null : await findFreePort();
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${localPort}`;
const errors = [];
let serverProcess = null;
const testDatabasePath = join(tmpdir(), `remedyquest-form-${Date.now()}.json`);

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
    console.error("FAIL:\n  Backend server did not start for form page verification.");
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
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: [],
});
const page = await context.newPage();

page.on("console", (message) => {
  if (message.type() === "error") {
    const text = message.text();
    // Ignore the expected "Camera unavailable / permission denied" errors —
    // headless Edge has no camera, that's the OS reporting it back to us.
    if (text.includes("NotAllowedError") || text.includes("NotFoundError")) return;
    if (text.includes("Could not start the camera")) return;
    if (text.includes("Camera API is not available")) return;
    // MediaPipe CDN fetch failures are expected in offline sandboxes.
    if (text.includes("MediaPipe") || text.includes("tasks-vision") || text.includes("Failed to load")) return;
    errors.push(`console: ${text}`);
  }
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

// ----- 1. Standalone form-checker page renders -----
const res1 = await page.goto(`${baseURL}/patient/form-checker`, { waitUntil: "domcontentloaded" });
if (!res1?.ok()) errors.push(`form-checker route HTTP ${res1?.status()}`);
await page.waitForSelector("text=AI exercise form coach", { timeout: 5000 }).catch(() =>
  errors.push("Form coach page did not render header"),
);
await page.waitForSelector("text=Neck mobility", { timeout: 5000 }).catch(() =>
  errors.push("Exercise selector did not list Neck mobility"),
);
await page.waitForSelector("text=Elbow bend", { timeout: 5000 }).catch(() =>
  errors.push("Exercise selector did not list Elbow bend"),
);
if (await page.locator("button:has-text('Squat')").count()) {
  errors.push("Exercise selector still shows Squat");
}
const visibleNames = await page.locator("button:has-text('Neck mobility'), button:has-text('Shoulder raise'), button:has-text('Elbow bend'), button:has-text('Lunge'), button:has-text('Back / posture')").count();
if (visibleNames < 5) errors.push(`Expected 5 rule cards in selector, saw ${visibleNames}`);
const cameraBox = await page.getByTestId("form-camera-card").boundingBox();
const feedbackBox = await page.getByTestId("form-feedback-panel").boundingBox();
if (!cameraBox || !feedbackBox) {
  errors.push("Form coach camera/feedback layout boxes missing");
} else {
  const sameColumn = Math.abs(cameraBox.x - feedbackBox.x) < 12 && Math.abs(cameraBox.width - feedbackBox.width) < 12;
  const belowCamera = feedbackBox.y > cameraBox.y + cameraBox.height - 2;
  if (!sameColumn || !belowCamera) {
    errors.push("Form coach feedback panel is not positioned under the camera column");
  }
}

// ----- 2 & 3. Walk through every guided modal in order and verify the toggle
// matches the rule mapping. The card order mirrors the seed data:
//   id=1 Neck release (rule)    id=2 Shoulder rolls (rule)
//   id=3 Cat-cow      (no rule) id=4 Lower back     (no rule)
//   id=5 Posture reset (rule)
const expectedToggleEnabled = [true, true, false, false, true];

await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
const startButtons = page.getByRole("button", { name: /Start exercise|Do it again/ });
const startCount = await startButtons.count();
if (startCount !== expectedToggleEnabled.length) {
  errors.push(`Expected ${expectedToggleEnabled.length} start buttons, got ${startCount}`);
} else {
  for (let i = 0; i < expectedToggleEnabled.length; i += 1) {
    const want = expectedToggleEnabled[i];
    await startButtons.nth(i).click();
    await page.waitForSelector("text=Camera form check", { timeout: 5000 }).catch(() =>
      errors.push(`Card ${i + 1}: Camera form check panel missing`),
    );
    const toggle = page.getByRole("button", { name: "Turn on" }).first();
    const disabled = await toggle.isDisabled();
    if (want && disabled) errors.push(`Card ${i + 1}: toggle should be ENABLED but was disabled`);
    if (!want && !disabled) errors.push(`Card ${i + 1}: toggle should be DISABLED but was enabled`);
    if (!want) {
      await page.waitForSelector("text=isn't available", { timeout: 3000 }).catch(() =>
        errors.push(`Card ${i + 1}: expected 'not available' message`),
      );
    }
    await page.getByRole("button", { name: "Close" }).first().click();
    // Wait for modal teardown before clicking the next card.
    await page.waitForSelector("text=Camera form check", { state: "detached", timeout: 3000 }).catch(() => {});
  }
}

// ----- 4. Backend session POST round-trips -----
const post = await page.request.post(`${baseURL}/api/patient/sessions`, {
  data: {
    exerciseId: "armRaise",
    exerciseName: "Shoulder raise",
    durationMs: 30000,
    totalReps: 8,
    correctReps: 6,
    targetReps: 5,
    completed: true,
    mistakes: { "elbow bent": 2 },
  },
});
if (!post.ok()) errors.push(`session POST HTTP ${post.status()}`);
const saved = await post.json();
if (saved.exerciseId !== "armRaise" || saved.totalReps !== 8) errors.push("session POST did not echo payload");
if (saved.targetReps !== 5 || saved.completed !== true) errors.push("session POST did not persist target completion fields");

const list = await page.request.get(`${baseURL}/api/patient/sessions`);
const arr = await list.json();
if (!Array.isArray(arr) || arr.length === 0) errors.push("session list empty after POST");

await page.goto(`${baseURL}/patient/form-checker`, { waitUntil: "domcontentloaded" });
const feedbackPanelText = await page.getByTestId("form-feedback-panel").innerText();
if (!/0\s*\/\s*5/.test(feedbackPanelText)) {
  errors.push("Form feedback panel does not render rep target as 0 / 5 before starting");
}

await browser.close();
if (serverProcess) serverProcess.kill();

if (errors.length) {
  console.error("FAIL:");
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log("Form-checker page + modal integration verified.");
