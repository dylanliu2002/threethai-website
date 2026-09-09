import type { Locale } from "./company";

/**
 * Dissolution-temperature selection catalog, migrated verbatim from the
 * legacy homepage. Product spec strings are technical identifiers and stay
 * in English; surrounding UI copy is localized.
 *
 * The two prose records are keyed by `Locale`, not `ContentLocale`, because they
 * are not an entity's body copy — they are shared site copy that the products
 * index and every product page read. An entity field must stay `{ en, zh }` so
 * `pageCopyFor` can recognise it and an evidence record can own it; a record like
 * this one has no promotion to describe, so it simply carries the language the
 * route was asked for, and `/es` cannot fall through to English any more.
 *
 * `temperatureNote` also absorbs the footnote `/products` used to spell out as a
 * `locale === "zh" ? … : …` literal, so the two places that describe what a
 * temperature label can and cannot do now say it in every language the site
 * serves.
 */

/**
 * One specification chip. Every code, count, denier, dtex, millimetre and metre
 * figure is identical in all four languages — a buyer matches these against a spec
 * sheet, and a re-keyed digit is a wrong product — so what varies is only the noun
 * the English wrapped around them (`PVA yarn` → `hilo de PVA` → `PVA-Garn`).
 *
 * `zh` repeats the English string, which is what the Chinese pages render today and
 * what the INTL-DEES-003B byte guard pins: Latin spec designations are normal in
 * Chinese textile trade and this task adds languages, it does not rewrite the two
 * that already ship.
 */
export type TemperatureSpec = Record<Locale, string>;

export const temperatureCatalog: readonly { temperature: string; specs: readonly TemperatureSpec[] }[] = [
  {
    temperature: "20°C",
    specs: [
      {
        en: "20S/1–80S/1 PVA yarn",
        zh: "20S/1–80S/1 PVA yarn",
        es: "20S/1–80S/1 hilo de PVA",
        de: "20S/1–80S/1 PVA-Garn",
      },
      {
        en: "40S/2 thread · 1,500–5,000 m",
        zh: "40S/2 thread · 1,500–5,000 m",
        es: "40S/2 hilo · 1,500–5,000 m",
        de: "40S/2 Garn · 1,500–5,000 m",
      },
      {
        en: "1.50 dtex × 38 mm fiber",
        zh: "1.50 dtex × 38 mm fiber",
        es: "fibra de 1.50 dtex × 38 mm",
        de: "Faser 1.50 dtex × 38 mm",
      },
      { en: "110D/25F filament", zh: "110D/25F filament", es: "filamento 110D/25F", de: "Filament 110D/25F" },
    ],
  },
  {
    temperature: "40°C",
    specs: [
      {
        en: "20S/1–80S/1 PVA yarn",
        zh: "20S/1–80S/1 PVA yarn",
        es: "20S/1–80S/1 hilo de PVA",
        de: "20S/1–80S/1 PVA-Garn",
      },
      { en: "40S/2 sewing thread", zh: "40S/2 sewing thread", es: "40S/2 hilo de coser", de: "40S/2 Nähgarn" },
      {
        en: "1.40 dtex × 38 mm fiber",
        zh: "1.40 dtex × 38 mm fiber",
        es: "fibra de 1.40 dtex × 38 mm",
        de: "Faser 1.40 dtex × 38 mm",
      },
    ],
  },
  {
    temperature: "55°C",
    specs: [
      {
        en: "55D/15F PVA filament yarn",
        zh: "55D/15F PVA filament yarn",
        es: "hilo de filamento de PVA 55D/15F",
        de: "PVA-Filamentgarn 55D/15F",
      },
    ],
  },
  {
    temperature: "60°C",
    specs: [
      {
        en: "40S/1–60S/1 PVA yarn",
        zh: "40S/1–60S/1 PVA yarn",
        es: "40S/1–60S/1 hilo de PVA",
        de: "40S/1–60S/1 PVA-Garn",
      },
      { en: "PVA sewing thread", zh: "PVA sewing thread", es: "hilo de coser de PVA", de: "PVA-Nähgarn" },
      { en: "PVA staple fiber", zh: "PVA staple fiber", es: "fibra cortada de PVA", de: "PVA-Stapelfaser" },
    ],
  },
  {
    temperature: "80°C",
    specs: [
      {
        en: "20S/1–45S/1 PVA yarn",
        zh: "20S/1–45S/1 PVA yarn",
        es: "20S/1–45S/1 hilo de PVA",
        de: "20S/1–45S/1 PVA-Garn",
      },
      {
        en: "1.67 dtex × 38 mm fiber",
        zh: "1.67 dtex × 38 mm fiber",
        es: "fibra de 1.67 dtex × 38 mm",
        de: "Faser 1.67 dtex × 38 mm",
      },
      {
        en: "SS-8 papermaking fiber · 2 dtex × 4 mm",
        zh: "SS-8 papermaking fiber · 2 dtex × 4 mm",
        es: "fibra para fabricación de papel SS-8 · 2 dtex × 4 mm",
        de: "Papierfaser SS-8 · 2 dtex × 4 mm",
      },
    ],
  },
  {
    temperature: "90°C",
    specs: [
      {
        en: "PVA yarn & sewing thread",
        zh: "PVA yarn & sewing thread",
        es: "hilo de PVA e hilo de coser",
        de: "PVA-Garn und Nähgarn",
      },
      {
        en: "1.33–1.67 dtex × 38 mm fiber",
        zh: "1.33–1.67 dtex × 38 mm fiber",
        es: "fibra de 1.33–1.67 dtex × 38 mm",
        de: "Faser 1.33–1.67 dtex × 38 mm",
      },
      {
        en: "SS-9 papermaking fiber · 2 dtex × 6 mm",
        zh: "SS-9 papermaking fiber · 2 dtex × 6 mm",
        es: "fibra para fabricación de papel SS-9 · 2 dtex × 6 mm",
        de: "Papierfaser SS-9 · 2 dtex × 6 mm",
      },
      {
        en: "PVA filament tow",
        zh: "PVA filament tow",
        es: "cabos de filamento de PVA",
        de: "PVA-Filament-Tow",
      },
    ],
  },
];

export const temperatureIntro: Record<Locale, { kicker: string; title: string; body: string }> = {
  en: {
    kicker: "Select by dissolution temperature",
    title: "Start with temperature. Find the PVA specification for your process.",
    body: "Explore water-soluble PVA yarn, sewing thread, staple fiber and filament by target dissolution temperature, then let our team match the specification to your process.",
  },
  zh: {
    kicker: "按水溶温度选型",
    title: "从温度出发，找到适合工艺的 PVA 规格",
    body: "围绕 PVA 水溶纱、水溶缝纫线、短纤和长丝，您可以根据目标水溶温度快速筛选，再由我们的团队结合实际工艺推荐产品。",
  },
  es: {
    kicker: "Selección por temperatura de disolución",
    title: "Empiece por la temperatura. Encuentre la especificación de PVA para su proceso.",
    body: "Explore hilo de PVA hidrosoluble, hilo de coser, fibra cortada y filamento por temperatura de disolución objetivo, y deje que nuestro equipo ajuste la especificación a su proceso.",
  },
  de: {
    kicker: "Auswahl nach Auflösungstemperatur",
    title: "Beginnen Sie bei der Temperatur. Finden Sie die PVA-Spezifikation für Ihren Prozess.",
    body: "Wasserlösliche PVA-Garne, Nähgarn, Stapelfaser und Filament nach Ziel-Auflösungstemperatur — unser Team stimmt die Spezifikation anschließend auf Ihren Prozess ab.",
  },
};

export const temperatureNote: Record<Locale, string> = {
  en: "A temperature label is a starting point, not a complete specification. Time, agitation, bath ratio, fabric construction and finishing chemistry all influence observed dissolution — see our dissolution guide before comparing samples.",
  zh: "温度标签只是选型起点，并非完整规格。时间、搅动、浴比、织物结构和后整理化学品都会影响实际溶解表现——请在对比样品前阅读我们的溶解指南。",
  es: "La temperatura es un punto de partida, no una especificación completa. El tiempo, la agitación, la relación de baño, la construcción del tejido y la química de acabado influyen en la disolución observada — consulte nuestra guía de disolución antes de comparar muestras.",
  de: "Die Temperatur ist ein Ausgangspunkt, keine vollständige Spezifikation. Zeit, mechanische Bewegung, Flottenverhältnis, Gewebekonstruktion und Ausrüstungschemie beeinflussen die beobachtete Auflösung — lesen Sie unseren Auflösungsleitfaden, bevor Sie Muster vergleichen.",
};
