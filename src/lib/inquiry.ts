"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/db";

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

async function deliverInquiry(payload: {
  reference: string;
  kind: InquiryKind;
  locale: string;
  fields: Record<string, string>;
}) {
  // TODO(owner): connect the company mailbox / CRM here.
  // The record is already persisted (see below); this hook is for notification.
  console.info("[inquiry]", JSON.stringify({ ...payload }));
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
