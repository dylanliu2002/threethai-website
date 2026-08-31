"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { buildInquiryEmail, type InquiryPayload } from "@/lib/inquiry-email";

/**
 * B2B inquiry submission — server-side validation + storage.
 *
 * Integration boundary: `deliverInquiry` below is the single place to hook an
 * email service (SMTP / Resend / CRM webhook). Nothing else in the codebase
 * needs to change when a delivery provider is configured. No credentials live
 * in frontend code.
 */

export type InquiryKind = "quote" | "sample" | "contact";

export type InquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  reference?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Simple refinement: strips control chars, caps length. */
function clean(value: FormDataEntryValue | null, max = 500): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
}

function makeReference(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `RF-${stamp}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/**
 * Idempotent schema bootstrap for serverless (Neon) deployments where the
 * manual table-creation step may have been missed. Runs at most once per
 * runtime instance; `IF NOT EXISTS` keeps it safe when the table already
 * exists. The statements are static (no user input); the Postgres syntax is
 * also accepted by SQLite (no-op locally, where the table already exists).
 */
const INQUIRY_DDL = `CREATE TABLE IF NOT EXISTS "Inquiry" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "name" TEXT NOT NULL,
  "company" TEXT,
  "country" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "product" TEXT,
  "application" TEXT,
  "specification" TEXT,
  "temperature" TEXT,
  "quantity" TEXT,
  "destination" TEXT,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
)`;

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  try {
    await db.$executeRawUnsafe(INQUIRY_DDL);
    await db.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Inquiry_reference_key" ON "Inquiry"("reference")`
    );
    schemaReady = true;
  } catch {
    // Bootstrap is best-effort; the insert below surfaces the real error.
  }
}

/**
 * Sales notification via Resend (see lib/inquiry-email.ts for env vars).
 * Fire-safe: any failure is logged but never blocks the inquiry response.
 * To switch providers (SMTP / CRM webhook), swap the fetch call below —
 * rendering lives in buildInquiryEmail.
 */
async function deliverInquiry(payload: InquiryPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[inquiry] notification skipped: RESEND_API_KEY is not set");
    return;
  }

  const { subject, html, text } = buildInquiryEmail(payload);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.INQUIRY_EMAIL_FROM ?? "Three Thai Textile <onboarding@resend.dev>",
        to: [process.env.INQUIRY_EMAIL_TO ?? "salesmanager@threethai.com"],
        reply_to: payload.fields.email || undefined,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[inquiry] notification failed:", response.status, (await response.text()).slice(0, 300));
      return;
    }
    const sent = (await response.json()) as { id?: string };
    console.info("[inquiry] notification sent", sent.id ?? "");
  } catch (error) {
    console.error("[inquiry] notification error", error);
  }
}

export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const get = (key: string, max?: number) => clean(formData.get(key), max);

  // Honeypot — silently accept bots but store nothing.
  if (get("website")) {
    return { status: "success", reference: "RF-OK" };
  }

  const kindRaw = get("kind", 20);
  const kind: InquiryKind = kindRaw === "sample" || kindRaw === "contact" ? kindRaw : "quote";
  const locale = get("locale", 8) === "zh" ? "zh" : "en";

  const fields = {
    name: get("name", 120),
    company: get("company", 160),
    country: get("country", 80),
    email: get("email", 160),
    phone: get("phone", 60),
    product: get("product", 120),
    application: get("application", 120),
    specification: get("specification", 200),
    temperature: get("temperature", 40),
    quantity: get("quantity", 80),
    destination: get("destination", 120),
    message: get("message", 4000),
  };

  const fieldErrors: InquiryState["fieldErrors"] = {};
  if (fields.name.length < 2) fieldErrors.name = "name";
  if (!EMAIL_RE.test(fields.email)) fieldErrors.email = "email";
  if (fields.message.length < 20) fieldErrors.message = "message";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  const reference = makeReference();
  try {
    await ensureSchema();
    await db.inquiry.create({
      data: {
        reference,
        kind,
        locale,
        name: fields.name,
        company: fields.company || null,
        country: fields.country || null,
        email: fields.email,
        phone: fields.phone || null,
        product: fields.product || null,
        application: fields.application || null,
        specification: fields.specification || null,
        temperature: fields.temperature || null,
        quantity: fields.quantity || null,
        destination: fields.destination || null,
        message: fields.message,
      },
    });
  } catch (error) {
    console.error("[inquiry] persistence failed", error);
    return { status: "error", message: "persist" };
  }

  await deliverInquiry({ reference, kind, locale, fields });
  return { status: "success", reference };
}
