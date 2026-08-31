/**
 * Hero visual + responsive verification.
 * Screenshots: desktop (1920/1440), tablet (768), mobile (390); zh + ar RTL.
 * Overflow scan: horizontal scroll check across sizes and locales.
 */
import { chromium } from "playwright";
import fs from "fs";

const OUT = "/home/z/my-project/tool-results/hero-verify";
const BASE = "http://localhost:3000";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;

  const shots = [
    { name: "en-1920", url: `${BASE}/`, w: 1920, h: 1080 },
    { name: "en-1440", url: `${BASE}/`, w: 1440, h: 900 },
    { name: "en-768", url: `${BASE}/`, w: 768, h: 1024 },
    { name: "en-390", url: `${BASE}/`, w: 390, h: 844 },
    { name: "zh-1440", url: `${BASE}/zh`, w: 1440, h: 900 },
    { name: "ar-1440", url: `${BASE}/ar`, w: 1440, h: 900 },
    { name: "de-390", url: `${BASE}/de`, w: 390, h: 844 },
  ];

  for (const s of shots) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
    await page.goto(s.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    // overflow scan
    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      const over = d.scrollWidth - d.clientWidth;
      const hero = document.querySelector("section");
      const hr = hero ? hero.getBoundingClientRect() : null;
      const bar = [...document.querySelectorAll("section *")].find((el) =>
        el.textContent && el.textContent.includes("20–90°C") && el.children.length
      );
      return {
        overflowPx: over,
        heroH: hr ? Math.round(hr.height) : null,
        specBarVisible: !!bar,
      };
    });
    if (overflow.overflowPx > 0) failures++;
    await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: false });
    console.log(
      `${s.name}: overflow=${overflow.overflowPx}px heroH=${overflow.heroH}px specBar=${overflow.specBarVisible}`
    );
    await page.close();
  }

  await browser.close();
  console.log(failures === 0 ? "ALL OK — no horizontal overflow" : `${failures} overflow failures`);
  process.exit(failures === 0 ? 0 : 1);
})();
