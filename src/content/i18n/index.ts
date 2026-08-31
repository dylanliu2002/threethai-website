import type { Locale } from "../company";
import { en, type Dictionary } from "./en";
import { zh } from "./zh";
import { partial as es } from "./es";
import { partial as pt } from "./pt";
import { partial as ru } from "./ru";
import { partial as ar } from "./ar";
import { partial as tr } from "./tr";
import { partial as vi } from "./vi";
import { partial as id } from "./id";
import { partial as de } from "./de";

export type { Dictionary };

/** Recursive partial used by the eight fallback locales (en is the base). */
export type PartialDictionary = DeepPartial<Dictionary>;

type DeepPartial<T> = T extends readonly (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge UI dictionaries: base values win only where the partial has no entry. */
function mergeDictionary<D extends Record<string, unknown>>(base: D, override: PartialDictionary | undefined): Dictionary {
  if (!override) return base as unknown as Dictionary;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    const current = out[key];
    if (isPlainObject(value) && isPlainObject(current)) {
      out[key] = mergeDictionary(current as Record<string, unknown>, value as PartialDictionary);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as unknown as Dictionary;
}

const partials: Partial<Record<Locale, PartialDictionary>> = {
  es,
  pt,
  ru,
  ar,
  tr,
  vi,
  id,
  de,
};

export function getDictionary(locale: Locale): Dictionary {
  if (locale === "zh") return zh;
  if (locale === "en") return en;
  return mergeDictionary(en as unknown as Record<string, unknown>, partials[locale]);
}

export { en, zh };
