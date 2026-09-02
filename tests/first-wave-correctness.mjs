import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");

test("inquiry validation messages are visible and programmatically associated", () => {
  const source = read("src/components/forms/inquiry-form.tsx");
  assert.match(source, /error\?: string/);
  assert.match(source, /error=\{fieldError\("name"\)\}/);
  assert.match(source, /error=\{fieldError\("email"\)\}/);
  assert.match(source, /aria-describedby=\{state\.fieldErrors\?\.message \? "message-error" : undefined\}/);
  assert.match(source, /id="message-error" role="alert"/);
  assert.match(source, /state\.message === "persist"/);
  assert.match(source, /const specificationDefaultValue = specificationParam \|\|/);
});

test("Product Finder preserves locale and qualification context", () => {
  const source = read("src/components/forms/product-finder.tsx");
  assert.match(source, /new URLSearchParams\(\)/);
  for (const key of ["product", "application", "temperature", "spec"]) {
    assert.match(source, new RegExp(`params\\.set\\("${key}"`));
  }
  assert.match(source, /localePath\("\/request-quote", locale\)/);
  assert.match(source, /localePath\("\/request-sample", locale\)/);
  assert.match(source, /localePath\(`\/products\/\$\{product\.slug\}`, locale\)/);
});

test("every quote-page variant provides an actionable Finder route", () => {
  const variants = [
    "src/app/(site)/request-quote/page.tsx",
    "src/app/zh/request-quote/page.tsx",
    "src/app/[lang]/request-quote/page.tsx",
  ];
  for (const variant of variants) {
    const source = read(variant);
    assert.match(source, /import Link from "next\/link"/);
    assert.match(source, /\/product-finder/);
    assert.match(source, /dict\.actions\.productFinder/);
  }
});

test("localized navigation uses modal focus management and normalized active paths", () => {
  const source = read("src/components/layout/site-header.tsx");
  assert.match(source, /DialogPrimitive\.Root/);
  assert.match(source, /DialogPrimitive\.Content/);
  assert.match(source, /onOpenAutoFocus/);
  assert.match(source, /onCloseAutoFocus/);
  assert.match(source, /const \{ path: currentPath \} = splitLocalePath\(pathname\)/);
  assert.doesNotMatch(source, /document\.body\.style\.overflow/);
});

test("light-surface accent token meets the reviewed AA color contract", () => {
  const source = read("src/app/globals.css");
  assert.match(source, /--gold-deep:\s*#9a6108;/i);
  assert.doesNotMatch(source, /--gold-deep:\s*#c07f1a;/i);
});
