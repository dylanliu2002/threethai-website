import Link from "next/link";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import InquiryForm from "@/components/forms/inquiry-form";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { company, localePath } from "@/content/company";

export default function ContactView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.contact;
  const lp = (path: string) => localePath(path, locale);
  return (
    <>
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale={locale}
              trail={[
                { name: dict.breadcrumbs.home, path: lp("/") },
                { name: dict.breadcrumbs.contact, path: lp("/contact") },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.contact}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <Reveal>
              <section className="card-line p-6">
                <h2 className="display-3">{t.directTitle}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-semibold text-ink">Email</dt>
                    <dd>
                      <a href={`mailto:${company.email}`} className="text-primary hover:underline">{company.email}</a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Phone / WhatsApp</dt>
                    <dd>
                      <a href={`tel:${company.phoneHref}`} className="text-primary hover:underline">{company.phoneDisplay}</a>
                      {" · "}
                      <a href={company.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        WhatsApp
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">{locale === "zh" ? "地址" : "Address"}</dt>
                    <dd className="text-muted-foreground">{locale === "zh" ? company.locationZh : company.locationEn}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">{locale === "zh" ? "法定主体" : "Legal entity"}</dt>
                    <dd className="text-muted-foreground">{company.nameLegalZh}</dd>
                  </div>
                </dl>
              </section>
            </Reveal>
            <Reveal delay={80}>
              <section className="card-line p-6">
                <h2 className="display-3">{t.hoursTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.hoursBody}</p>
                <div className="hairline mt-5 pt-5">
                  <h3 className="font-semibold text-ink">{t.auditTitle}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.auditBody}</p>
                </div>
              </section>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-sm text-muted-foreground">
                {dict.form.contactDirect}{" "}
                <Link href={lp("/request-quote")} className="font-semibold text-primary hover:underline">
                  {dict.actions.requestQuote} →
                </Link>
              </p>
            </Reveal>
          </div>

          <Reveal delay={60}>
            <div className="card-line p-6 sm:p-8">
              <h2 className="display-3">{dict.form.contactTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dict.form.contactIntro}</p>
              <div className="mt-6">
                <InquiryForm locale={locale} dict={dict} kind="contact" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
