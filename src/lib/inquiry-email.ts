/**
 * Inquiry notification email — rendering + Resend REST delivery.
 *
 * Zero-dependency by design: a plain `fetch` keeps the serverless bundle
 * small and avoids SDK drift. Delivery failures NEVER affect the inquiry
 * itself (the record is already persisted when this runs — the form returns
 * success regardless; errors are only logged for ops).
 *
 * Environment variables (all server-side only):
 *  - SMTP_USER / SMTP_PASS  required to send (Tencent Exmail mailbox or its
 *                        client-specific "安全密码"); without them delivery is
 *                        skipped gracefully (site keeps working)
 *  - SMTP_HOST / SMTP_PORT  default smtp.exmail.qq.com:465 (implicit TLS)
 *  - INQUIRY_EMAIL_FROM  default = SMTP_USER; the sending mailbox should be
 *                        @threethai.com so SPF/DKIM stay aligned
 *  - INQUIRY_EMAIL_TO    default "salesmanager@threethai.com"
 */

export type InquiryPayload = {
  reference: string;
  kind: "quote" | "sample" | "contact";
  locale: string;
  fields: Record<string, string>;
};

const KIND_LABEL: Record<InquiryPayload["kind"], string> = {
  quote: "Quote request",
  sample: "Sample request",
  contact: "Contact message",
};

/** Ordered optional fields; empty values are omitted from the email. */
const FIELD_ROWS: Array<[key: string, label: string]> = [
  ["name", "Name"],
  ["company", "Company"],
  ["country", "Country"],
  ["email", "Email"],
  ["phone", "Phone / WhatsApp"],
  ["product", "Product"],
  ["application", "Application"],
  ["specification", "Specification"],
  ["temperature", "Dissolution temp."],
  ["quantity", "Quantity"],
  ["destination", "Destination"],
];

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildInquiryEmail(payload: InquiryPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const f = payload.fields;
  const who = [f.name, f.company].filter(Boolean).join(" · ") || "(no name)";
  const kindLabel = KIND_LABEL[payload.kind];
  const subject = `[${payload.reference}] ${kindLabel} — ${who}`.slice(0, 140);
  const submittedAt = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const present = FIELD_ROWS.filter(([key]) => f[key]);
  const htmlRows = present
    .map(([key, label]) => {
      const isEmail = key === "email";
      const value = isEmail
        ? `<a href="mailto:${esc(f[key])}" style="color:#1a2151;">${esc(f[key])}</a>`
        : esc(f[key]);
      return `<tr>
  <td style="padding:7px 0;border-bottom:1px solid #f0f1f4;width:150px;font-size:12px;color:#6b7280;vertical-align:top;">${label}</td>
  <td style="padding:7px 0;border-bottom:1px solid #f0f1f4;font-size:13px;color:#111827;word-break:break-word;">${value}</td>
</tr>`;
    })
    .join("\n");

  const textRows = present.map(([key, label]) => `${label}:${" ".repeat(Math.max(1, 20 - label.length))}${f[key]}`).join("\n");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4e6eb;border-radius:8px;">
    <tr><td style="background:#1a2151;padding:18px 24px;">
      <div style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:2px;">THREE THAI TEXTILE</div>
      <div style="color:#c8a44d;font-size:11px;margin-top:4px;letter-spacing:1.5px;">PVA YARN · THREAD · FIBER · FILAMENT</div>
    </td></tr>
    <tr><td style="padding:20px 24px 4px;">
      <div style="font-size:16px;font-weight:700;color:#1a2151;">${kindLabel} — ${esc(payload.reference)}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:3px;">Website inquiry form · language: ${esc(payload.locale)} · ${submittedAt}</div>
    </td></tr>
    <tr><td style="padding:12px 24px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${htmlRows}</table>
      <div style="margin-top:16px;padding:12px 14px;background:#f8f9fb;border:1px solid #e4e6eb;border-radius:6px;font-size:13px;color:#111827;white-space:pre-wrap;">${esc(f.message ?? "")}</div>
      <div style="margin-top:14px;font-size:12px;color:#6b7280;line-height:1.5;">Reply directly to this email to reach the buyer${f.email ? ` at ${esc(f.email)}` : ""}.<br>Reference ${esc(payload.reference)} · auto-generated, please do not forward publicly.</div>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `NEW INQUIRY — THREE THAI TEXTILE
Reference: ${payload.reference}
Type: ${kindLabel}
Language: ${payload.locale}
Submitted: ${submittedAt}
----------------------------------------
${textRows}
----------------------------------------
Message:
${f.message ?? ""}

Reply to: ${f.email ?? "(no email)"}`;

  return { subject, html, text };
}
