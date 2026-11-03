/* Chạy: npm run e2e  (cần Playwright đã cài sẵn trong môi trường) */
const { spawn } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const PORT = process.env.E2E_PORT ?? "3107";
const BASE = `http://localhost:${PORT}`;
const dataDir = mkdtempSync(join(tmpdir(), "ksm-e2e-"));

const server = spawn("npx", ["next", "dev", "-p", PORT], {
  env: {
    ...process.env,
    NODE_ENV: "development",
    PGLITE_DIR: dataDir,
    DEV_AUTH_BYPASS: "1",
    AUTH_SECRET: "e2e-secret",
    AUTH_GOOGLE_ID: "x",
    AUTH_GOOGLE_SECRET: "x",
    ADMIN_EMAILS: "boss@ksmlook.vn",
    DATABASE_URL: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${BASE}/login`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server không khởi động được\n" + serverLog.slice(-2000));
}

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email giả lập").fill(email);
  await page.getByRole("button", { name: "Đăng nhập giả lập" }).click();
}

async function loginOk(page, email) {
  await login(page, email);
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function logout(page) {
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.waitForURL("**/login**");
}

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(["PASS", name]);
  } catch (e) {
    results.push(["FAIL", name, e.message.split("\n")[0]]);
    throw e;
  }
}

(async () => {
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
    const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();

    await step("chưa đăng nhập bị chuyển về /login", async () => {
      await page.goto(`${BASE}/`);
      assert.match(page.url(), /\/login/);
    });

    await step("email ngoài tên miền bị từ chối", async () => {
      await login(page, "ai-do@gmail.com");
      await page.getByRole("alert").waitFor();
      assert.match(page.url(), /\/login/);
    });

    await step("nhân viên đăng nhập và thấy 17 nhóm", async () => {
      await login(page, "nhanvien@ksmlook.vn");
      await page.getByRole("heading", { name: "Tra cứu câu mẫu" }).waitFor();
      assert.equal(await page.locator("a[href^='/c/']").count(), 17);
    });

    await step("tìm không dấu ra câu về độ bền màu", async () => {
      await page.getByLabel("Tìm kiếm").fill("do ben mau");
      await page.getByRole("button", { name: "Tìm", exact: true }).click();
      await page.waitForURL("**/search?q=*");
      assert.ok((await page.getByTestId("phrase-card").count()) > 0);
      assert.ok(await page.getByText("Color fastness").first().isVisible());
    });

    await step("nút Chép đưa đúng nội dung vào clipboard", async () => {
      const card = page.getByTestId("phrase-card").first();
      const english = await card.locator("dd").nth(1).innerText();
      await card.getByRole("button", { name: /Sao chép bản EN/ }).click();
      await card.getByText("Đã chép").waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), english);
    });

    await step("tìm bằng chữ Hán", async () => {
      await page.goto(`${BASE}/search?q=${encodeURIComponent("色牢度")}`);
      assert.ok((await page.getByTestId("phrase-card").count()) > 0);
    });

    await step("trang thuật ngữ có quy ước N / P / SP", async () => {
      await page.goto(`${BASE}/glossary`);
      await page.getByText("Nylon = N, Polyester = P, Spandex = SP").waitFor();
      const row = page.getByRole("row", { name: /Spandex/ });
      assert.match(await row.innerText(), /SP/);
    });

    await step("nhân viên đề xuất câu và không có quyền admin", async () => {
      await page.goto(`${BASE}/suggest`);
      await page.locator("select[name=categoryId]").selectOption({ label: "4. Giá, báo giá & thương lượng" });
      await page.locator("textarea[name=vi]").fill("Giá này đã bao gồm thuế VAT chưa?");
      await page.locator("textarea[name=en]").fill("Does this price include VAT?");
      await page.locator("textarea[name=zh]").fill("这个价格含增值税吗？");
      await page.getByRole("button", { name: "Gửi đề xuất" }).click();
      await page.getByText("Đã gửi, đang chờ admin duyệt.").waitFor();
      assert.equal(await page.getByRole("link", { name: "Duyệt" }).count(), 0);
      await page.goto(`${BASE}/admin`);
      assert.equal(new URL(page.url()).pathname, "/");
    });

    await step("câu chờ duyệt chưa hiện ra tra cứu", async () => {
      await page.goto(`${BASE}/search?q=${encodeURIComponent("thue vat")}`);
      assert.equal(await page.getByTestId("phrase-card").count(), 0);
    });

    await step("admin duyệt câu và câu hiện ra tra cứu", async () => {
      await logout(page);
      await login(page, "boss@ksmlook.vn");
      await page.getByRole("link", { name: "Duyệt" }).click();
      await page.waitForURL("**/admin");
      const item = page.getByTestId("pending-item");
      await item.first().waitFor();
      assert.equal(await item.count(), 1);
      await item.getByRole("button", { name: "Duyệt", exact: true }).click();
      await page.getByText("Không có đề xuất nào đang chờ.").waitFor();
      await page.goto(`${BASE}/search?q=${encodeURIComponent("thue vat")}`);
      assert.equal(await page.getByTestId("phrase-card").count(), 1);
    });

    await step("giao diện điện thoại không tràn ngang", async () => {
      const mobile = await browser.newContext({ viewport: { width: 375, height: 740 } });
      const mp = await mobile.newPage();
      await loginOk(mp, "nhanvien@ksmlook.vn");
      for (const path of ["/", "/c/5", "/glossary", "/suggest"]) {
        await mp.goto(`${BASE}${path}`);
        assert.equal(new URL(mp.url()).pathname, path, `${path} bị chuyển hướng`);
        const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(overflow <= 0, `${path} tràn ngang ${overflow}px`);
      }
      await mp.goto(`${BASE}/c/5`);
      await mp.getByRole("heading", { name: /Độ bền màu/ }).waitFor();
      await mp.screenshot({ path: process.env.E2E_SHOT ?? join(tmpdir(), "ksm-mobile.png") });
      await mobile.close();
    });

    await step("manifest PWA hợp lệ và không cần đăng nhập", async () => {
      const res = await fetch(`${BASE}/manifest.webmanifest`);
      assert.equal(res.status, 200);
      const manifest = await res.json();
      assert.equal(manifest.display, "standalone");
      assert.equal((await fetch(`${BASE}/icon-192`)).headers.get("content-type"), "image/png");
    });
  } finally {
    for (const r of results) console.log(r.join("  "));
    if (browser) await browser.close();
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
    rmSync(dataDir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error("E2E lỗi:", e.message);
  console.error(serverLog.slice(-1500));
  process.exitCode = 1;
});
