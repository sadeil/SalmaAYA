import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:4173";
const routes = [
  "/", "/login", "/register", "/patient", "/patient/exercises", "/patient/chat",
  "/patient/rewards", "/patient/refunds", "/patient/messages", "/doctor",
  "/doctor/patients", "/doctor/patients/1", "/doctor/messages", "/admin"
];
const errors = [];
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

await page.goto(`${baseURL}/patient/exercises`, { waitUntil: "networkidle" });
const completeButton = page.getByRole("button", { name: "Complete exercise" }).first();
await completeButton.click();
if (!(await page.getByRole("button", { name: "Mark incomplete" }).count())) errors.push("exercise completion toggle failed");

await page.goto(`${baseURL}/patient/chat`, { waitUntil: "networkidle" });
const chatInput = page.getByPlaceholder("Describe how you feel...");
await chatInput.fill("My back feels better today");
await chatInput.press("Enter");
if (!(await page.getByText("My back feels better today").count())) errors.push("AI chat send failed");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${baseURL}/patient`, { waitUntil: "networkidle" });
await page.locator("header button").first().click();
if (!(await page.locator(".rq-sidebar").isVisible())) errors.push("mobile sidebar did not open");

await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Smoke test passed: ${routes.length} routes, localization, login, exercise, chat, and mobile navigation.`);
