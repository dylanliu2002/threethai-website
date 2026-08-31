"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { submitInquiry, type InquiryState } from "@/lib/inquiry";
import type { Dictionary } from "@/content/i18n";
import { productBySlug } from "@/content/products";
import { applicationBySlug } from "@/content/applications";
import { contentLocaleOf, type Locale } from "@/content/company";

const initialState: InquiryState = { status: "idle" };

function Field({
  label,
  name,
  type = "text",
  required = false,
  optionalLabel,
  error,
  defaultValue,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  optionalLabel?: string;
  error?: boolean;
  defaultValue?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
        {!required && optionalLabel && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({optionalLabel})</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error || undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`mt-1.5 w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/60 focus:outline-2 focus:outline-offset-0 focus:outline-primary ${
          error ? "border-destructive" : "border-input"
        }`}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-destructive">
          {typeof error === "string" ? error : ""}
        </p>
      )}
    </div>
  );
}

/**
 * Static fallback rendered while the search params resolve.
 * Keeps the form height stable so the page layout does not jump.
 */
function InquiryFormSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-background p-6" aria-hidden="true">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="h-16 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-4 h-24 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-10 w-36 animate-pulse rounded bg-muted" />
    </div>
  );
}

export default function InquiryForm(props: {
  locale: Locale;
  dict: Dictionary;
  kind: "quote" | "sample" | "contact";
}) {
  // useSearchParams() requires a Suspense boundary during static prerender.
  return (
    <Suspense fallback={<InquiryFormSkeleton />}>
      <InquiryFormInner {...props} />
    </Suspense>
  );
}

function InquiryFormInner({
  locale,
  dict,
  kind,
}: {
  locale: Locale;
  dict: Dictionary;
  kind: "quote" | "sample" | "contact";
}) {
  const cl = contentLocaleOf(locale);
  const [state, action, pending] = useActionState(submitInquiry, initialState);
  const search = useSearchParams();
  const f = dict.form.fields;
  const isContact = kind === "contact";

  const productParam = search.get("product") ?? "";
  const applicationParam = search.get("application") ?? "";
  const temperatureParam = search.get("temperature") ?? "";
  const productName = productBySlug(productParam)?.name[cl] ?? productParam;
  const applicationName = applicationBySlug(applicationParam)?.name[cl] ?? applicationParam;

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-lg border border-gold/50 bg-accent/50 p-6 text-center">
        <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold-deep">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </span>
        <h3 className="mt-4 text-lg font-semibold text-ink">{dict.form.successTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {dict.form.successBody}
          <strong className="ml-1 font-mono text-ink">{state.reference}</strong>
        </p>
      </div>
    );
  }

  const fieldError = (key: "name" | "email" | "message") =>
    state.status === "error" && state.fieldErrors?.[key] ? dict.form.errors[key] : undefined;

  return (
    <form action={action} noValidate={false}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot — hidden from users, catches naive spam bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && !state.fieldErrors && (
        <p role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {dict.form.errors.generic} {dict.form.errorBody} salesmanager@threethai.com
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.name} name="name" required autoComplete="name" error={!!state.fieldErrors?.name} />
        <Field label={f.company} name="company" autoComplete="organization" optionalLabel={dict.form.optional} />
        <Field label={f.country} name="country" autoComplete="country-name" optionalLabel={dict.form.optional} />
        <Field label={f.email} name="email" type="email" required autoComplete="email" error={!!state.fieldErrors?.email} />
        <Field label={f.phone} name="phone" type="tel" autoComplete="tel" optionalLabel={dict.form.optional} />
        {!isContact && (
          <Field label={f.destination} name="destination" optionalLabel={dict.form.optional} placeholder={locale === "zh" ? "如：印度／土耳其" : "e.g. India / Türkiye"} />
        )}
      </div>

      {!isContact && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-ink">{f.product}</label>
              <select
                id="product"
                name="product"
                defaultValue={productParam}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm focus:outline-2 focus:outline-offset-0 focus:outline-primary"
              >
                <option value="">{f.productNone}</option>
                <option value="water-soluble-pva-yarn">Water-soluble PVA yarn · PVA 水溶纱</option>
                <option value="water-soluble-pva-sewing-thread">Water-soluble PVA sewing thread · PVA 水溶缝纫线</option>
                <option value="pva-staple-fiber">PVA staple fiber · PVA 短纤</option>
                <option value="pva-filament-yarn">PVA filament yarn · PVA 长丝</option>
                <option value="other">{locale === "zh" ? "其他 / 扩展形态" : "Other / extended format"}</option>
              </select>
            </div>
            <div>
              <label htmlFor="application" className="block text-sm font-medium text-ink">{f.application}</label>
              <select
                id="application"
                name="application"
                defaultValue={applicationParam}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm focus:outline-2 focus:outline-offset-0 focus:outline-primary"
              >
                <option value="">{f.productNone}</option>
                <option value="towel-weaving">{dict.finder.applicationOptions.towel}</option>
                <option value="embroidery-sewing">{dict.finder.applicationOptions.embroidery}</option>
                <option value="knitting">{dict.finder.applicationOptions.knitting}</option>
                <option value="papermaking">{dict.finder.applicationOptions.paper}</option>
                <option value="technical-textiles">{dict.finder.applicationOptions.technical}</option>
                <option value="other">{dict.finder.applicationOptions.other}</option>
              </select>
            </div>
            <Field label={f.specification} name="specification" optionalLabel={dict.form.optional} placeholder={locale === "zh" ? "如：40S/2 · 1.50 dtex × 38 mm" : "e.g. 40S/2 · 1.50 dtex × 38 mm"} />
            <Field label={f.temperature} name="temperature" optionalLabel={dict.form.optional} defaultValue={temperatureParam} placeholder="20°C / 40°C / 90°C…" />
            <Field label={f.quantity} name="quantity" optionalLabel={dict.form.optional} placeholder={locale === "zh" ? "样品／试单／年用量" : "sample / pilot / annual"} />
          </div>
          {productName && (
            <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
              {f.product}: <strong className="text-ink">{productName}</strong>
              {applicationName && <> · {f.application}: <strong className="text-ink">{applicationName}</strong></>}
            </p>
          )}
        </>
      )}

      <div className="mt-4">
        <label htmlFor="message" className="block text-sm font-medium text-ink">
          {f.message} <span className="text-destructive">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          minLength={20}
          defaultValue={
            isContact
              ? ""
              : temperatureParam && !applicationParam
                ? `${f.temperature}: ${temperatureParam}`
                : ""
          }
          placeholder={f.messagePlaceholder}
          aria-invalid={!!state.fieldErrors?.message || undefined}
          className={`mt-1.5 w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/60 focus:outline-2 focus:outline-offset-0 focus:outline-primary ${
            state.fieldErrors?.message ? "border-destructive" : "border-input"
          }`}
        />
        {state.fieldErrors?.message && (
          <p id="message-error" className="mt-1 text-xs text-destructive">{dict.form.errors.message}</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn-gold disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? dict.form.submitting : isContact ? dict.form.submitMessage : kind === "quote" ? dict.form.submitQuote : dict.form.submitSample}
        </button>
        <p className="text-xs text-muted-foreground">{dict.form.privacy}</p>
      </div>
    </form>
  );
}
