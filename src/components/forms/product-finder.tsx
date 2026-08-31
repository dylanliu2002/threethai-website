"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/content/i18n";
import { contentLocaleOf, type Locale } from "@/content/company";
import { products } from "@/content/products";

type Answers = {
  form: string;
  application: string;
  temperature: string;
  spec: string;
};

/**
 * Guided selection. Deliberately NOT an engineering calculator: it narrows
 * the product family and hands the buyer to a technical inquiry where the
 * exact grade is confirmed with a traceable sample.
 */
function recommend(a: Answers): { slug: string; why: string } {
  // Sewing thread is unambiguous.
  if (a.form === "thread") return { slug: "water-soluble-pva-sewing-thread", why: "Temporary seams and stitched guides match the sewing-thread format." };
  if (a.form === "filament") return { slug: "pva-filament-yarn", why: "A continuous technical element calls for filament construction." };
  if (a.form === "staple") return { slug: "pva-staple-fiber", why: "Blending, dispersion and paper/nonwoven routes use short-cut staple fiber." };
  if (a.form === "yarn") {
    if (a.application === "towel") return { slug: "water-soluble-pva-yarn", why: "Woven support in towel/zero-twist constructions is the classic water-soluble yarn use." };
    if (a.application === "knitting") return { slug: "water-soluble-pva-yarn", why: "Knitted support and plating uses match water-soluble yarn." };
    if (a.application === "embroidery") return { slug: "water-soluble-pva-yarn", why: "Embroidery lace support typically starts from water-soluble yarn." };
    if (a.application === "technical") return { slug: "pva-filament-yarn", why: "Technical structures often prefer continuous filament — we will confirm against your process." };
  }
  // Fallbacks: unsure form → infer from application.
  if (a.application === "paper") return { slug: "pva-staple-fiber", why: "Papermaking uses dispersible short-cut fiber." };
  if (a.application === "embroidery") return { slug: "water-soluble-pva-sewing-thread", why: "Stitched guides suggest starting from sewing thread or support yarn." };
  return { slug: "water-soluble-pva-yarn", why: "Most temporary-support processes start from water-soluble yarn — we will confirm the form with you." };
}

export default function ProductFinder({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const cl = contentLocaleOf(locale);
  const t = dict.finder;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ form: "", application: "", temperature: "", spec: "" });

  const total = 4;
  const done = step >= total;
  const result = useMemo(() => (done ? recommend(answers) : null), [done, answers]);
  const product = result ? products.find((p) => p.slug === result.slug) : undefined;

  const set = (patch: Partial<Answers>) => setAnswers((prev) => ({ ...prev, ...patch }));

  const Option = ({
    value,
    label,
    group,
  }: {
    value: string;
    label: string;
    group: keyof Answers;
  }) => {
    const active = answers[group] === value;
    return (
      <button
        type="button"
        onClick={() => {
          set({ [group]: value } as Partial<Answers>);
          setStep((s) => s + 1);
        }}
        aria-pressed={active}
        className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          active ? "border-primary bg-secondary text-primary" : "border-input bg-background text-foreground hover:border-primary/50"
        }`}
      >
        {label}
      </button>
    );
  };

  const questions: { key: keyof Answers; question: string; options: { value: string; label: string }[] }[] = [
    {
      key: "form",
      question: t.question.form,
      options: [
        { value: "yarn", label: t.form.yarn },
        { value: "thread", label: t.form.thread },
        { value: "staple", label: t.form.staple },
        { value: "filament", label: t.form.filament },
        { value: "unsure", label: t.form.unsure },
      ],
    },
    {
      key: "application",
      question: t.question.application,
      options: [
        { value: "towel", label: t.applicationOptions.towel },
        { value: "embroidery", label: t.applicationOptions.embroidery },
        { value: "knitting", label: t.applicationOptions.knitting },
        { value: "paper", label: t.applicationOptions.paper },
        { value: "technical", label: t.applicationOptions.technical },
        { value: "other", label: t.applicationOptions.other },
      ],
    },
    {
      key: "temperature",
      question: t.question.temperature,
      options: [
        { value: "cold", label: t.temperatureOptions.cold },
        { value: "low", label: t.temperatureOptions.low },
        { value: "mid", label: t.temperatureOptions.mid },
        { value: "high", label: t.temperatureOptions.high },
        { value: "unsure", label: t.temperatureOptions.unsure },
      ],
    },
    {
      key: "spec",
      question: t.question.spec,
      options: [
        { value: "known", label: t.specOptions.known },
        { value: "partial", label: t.specOptions.partial },
        { value: "none", label: t.specOptions.none },
      ],
    },
  ];

  const inquiryHref = `/request-quote?product=${result?.slug ?? ""}&temperature=${
    answers.temperature === "cold" ? "20°C" : answers.temperature === "low" ? "40-55°C" : answers.temperature === "mid" ? "60-70°C" : answers.temperature === "high" ? "80-90°C" : ""
  }`;
  const sampleHref = `/request-sample?product=${result?.slug ?? ""}`;

  return (
    <div className="card-line overflow-hidden">
      {/* Progress */}
      <div className="border-b border-border bg-muted px-6 py-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>{t.step} {Math.min(step + 1, total)} {t.of} {total}</span>
          {!done && step > 0 && (
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className="text-primary hover:underline">
              ← {t.back}
            </button>
          )}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(step, total)}>
          <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {!done ? (
          <fieldset>
            <legend className="display-3">{questions[step].question}</legend>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {questions[step].options.map((option) => (
                <Option key={option.value} group={questions[step].key} value={option.value} label={option.label} />
              ))}
            </div>
          </fieldset>
        ) : (
          <div role="status">
            <p className="eyebrow">{t.resultTitle}</p>
            <h2 className="display-2 mt-2 !text-2xl">{product?.name[cl]}</h2>
            <p className="mt-2 text-sm font-medium text-gold-deep">{result?.why}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.resultNote}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={inquiryHref} className="btn-primary">{t.resultCta}</Link>
              <Link href={sampleHref} className="btn-ghost">{dict.actions.requestSample}</Link>
              {product && (
                <Link href={`/${locale === "zh" ? "zh/" : ""}products/${product.slug}`} className="btn-ghost">
                  {dict.actions.viewSpecifications}
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setAnswers({ form: "", application: "", temperature: "", spec: "" });
                setStep(0);
              }}
              className="mt-6 text-sm font-semibold text-primary hover:underline"
            >
              ↺ {t.restart}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
