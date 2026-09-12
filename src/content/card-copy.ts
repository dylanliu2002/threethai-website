import { applications, type Application } from "./applications";
import { articles, type Article } from "./articles";
import { answerTeasers } from "./answer-teasers";
import { buyerAnswers } from "./answers";
import { productCopy, applicationCopy } from "./translation-copy";
import { products, type Product } from "./products";
import type { Locale } from "./company";

/**
 * Card copy: the text one page uses to advertise another page.
 *
 * A card is not the page it links to. `/es` naming a product in Spanish does not
 * claim that `/es/products/x` is a Spanish document — it is the home page's own
 * prose, and it is allowed to be localized before the detail page is promoted.
 * That is why this module exists, and why it is deliberately separate from
 * `pageCopyFor`:
 *
 * - `pageCopyFor(path, locale, entity)` is the promotion seam. A route reads its
 *   *body* through it, and it only answers in `es`/`de` once an approved evidence
 *   record covers every widen-able field of that entity, because the record is the
 *   thing the canonical, hreflang, sitemap entry and `inLanguage` are asserted
 *   from. Cards must not be able to trigger that.
 * - This file is content, not a claim. English and Chinese are read out of the
 *   entity, so they cannot drift from the page a card points at. Spanish and
 *   German come from `./translation-copy` — the same store a future record draws
 *   from — so approving a page cannot make its own cards say something different.
 *
 * Article teasers are the exception: no product or application page has body copy
 * here, only the three fields a card actually shows (`category`, `title`, `intro`).
 * The article *bodies* stay untranslated and unpromotable, so `/es/knowledge/<slug>`
 * remains an English-owner fallback while its listing card is Spanish. That is the
 * card/page distinction above, applied honestly rather than papered over.
 */

type CopyField<T> = { en: T; zh: T; es: T; de: T };

/** The four product/application/article teasers carry exactly these three fields. */
export type ProductCardCopy = { name: string; tagline: string; imageAlt: string };
export type ApplicationCardCopy = { name: string; summary: string; imageAlt: string };
export type ArticleCardCopy = { category: string; title: string; intro: string };

const findProduct = (slug: string): Product => {
  const product = products.find((p) => p.slug === slug);
  if (!product) throw new Error(`card-copy: unknown product slug "${slug}"`);
  return product;
};

const findApplication = (slug: string): Application => {
  const application = applications.find((a) => a.slug === slug);
  if (!application) throw new Error(`card-copy: unknown application slug "${slug}"`);
  return application;
};

const findArticle = (slug: string): Article => {
  const article = articles.find((a) => a.slug === slug);
  if (!article) throw new Error(`card-copy: unknown article slug "${slug}"`);
  return article;
};

export function productCard(slug: string, locale: Locale): ProductCardCopy {
  const product = findProduct(slug);
  const translated = productCopy[slug];
  if (!translated) throw new Error(`card-copy: productCopy has no entry for "${slug}"`);
  const name: CopyField<string> = {
    en: product.name.en,
    zh: product.name.zh,
    es: translated.name.es,
    de: translated.name.de,
  };
  const tagline: CopyField<string> = {
    en: product.tagline.en,
    zh: product.tagline.zh,
    es: translated.tagline.es,
    de: translated.tagline.de,
  };
  const imageAlt: CopyField<string> = {
    en: product.imageAlt.en,
    zh: product.imageAlt.zh,
    es: translated.imageAlt.es,
    de: translated.imageAlt.de,
  };
  return { name: name[locale], tagline: tagline[locale], imageAlt: imageAlt[locale] };
}

export function applicationCard(slug: string, locale: Locale): ApplicationCardCopy {
  const application = findApplication(slug);
  const translated = applicationCopy[slug];
  if (!translated) throw new Error(`card-copy: applicationCopy has no entry for "${slug}"`);
  const name: CopyField<string> = {
    en: application.name.en,
    zh: application.name.zh,
    es: translated.name.es,
    de: translated.name.de,
  };
  const summary: CopyField<string> = {
    en: application.summary.en,
    zh: application.summary.zh,
    es: translated.summary.es,
    de: translated.summary.de,
  };
  const imageAlt: CopyField<string> = {
    en: application.imageAlt.en,
    zh: application.imageAlt.zh,
    es: translated.imageAlt.es,
    de: translated.imageAlt.de,
  };
  return { name: name[locale], summary: summary[locale], imageAlt: imageAlt[locale] };
}

/**
 * Spanish and German for the knowledge teasers. Terminology follows the glossary
 * in `i18n/es.ts` / `i18n/de.ts` — `fibra cortada` / `Stapelfaser`,
 * `filamento` / `Filamentgarn`, `disolución` / `Auflösung` — and the temperature
 * values are carried unchanged, including the space before `°C` those files use.
 */
const ARTICLE_TEASERS: Record<string, { category: CopyField<string>; title: CopyField<string>; intro: CopyField<string> }> = {
  "pva-yarn-dissolution-temperature-guide": {
    category: { en: "Technical guide", zh: "技术指南", es: "Guía técnica", de: "Fachleitfaden" },
    // Retitled by `article-title-patches.ts`, with the reason recorded there. `en`/`zh` are
    // asserted equal to the entity; `es`/`de` are DRAFTED and pending translator review.
    title: {
      en: "How to Choose the Right Dissolution Temperature for Water-Soluble PVA Yarn",
      zh: "如何为水溶性 PVA 纱线选择合适的溶解温度",
      es: "Cómo elegir la temperatura de disolución adecuada para el hilo de PVA hidrosoluble",
      de: "Die richtige Auflösungstemperatur für wasserlösliches PVA-Garn wählen",
    },
    intro: {
      en: "A quoted dissolution temperature is a starting point, not a complete process specification. Buyers should evaluate the full removal cycle under repeatable conditions.",
      zh: "标称的溶解温度只是起点，不是完整的工艺规格。买家应在可重复的条件下评估完整的去除周期。",
      es: "Una temperatura de disolución indicada es un punto de partida, no una especificación de proceso completa. El comprador debe evaluar el ciclo de eliminación completo en condiciones repetibles.",
      de: "Eine angegebene Auflösungstemperatur ist ein Ausgangspunkt, keine vollständige Prozessspezifikation. Prüfen Sie den gesamten Entfernungszyklus unter wiederholbaren Bedingungen.",
    },
  },
  "pva-yarn-buyer-specification-checklist": {
    category: { en: "Buyer checklist", zh: "采购清单", es: "Lista del comprador", de: "Einkaufs-Checkliste" },
    title: {
      en: "Five Specifications to Confirm Before Ordering Water-Soluble PVA Yarn",
      zh: "订购水溶性 PVA 纱线前应确认的五项规格",
      es: "Cinco especificaciones que confirmar antes de pedir hilo de PVA hidrosoluble",
      de: "Fünf Spezifikationen, die vor der Bestellung von wasserlöslichem PVA-Garn zu bestätigen sind",
    },
    intro: {
      en: "A useful quotation needs more than a product name. Sharing five core requirements helps the supplier recommend a closer first sample and reduces development cycles.",
      zh: "一份有效的报价需要的不只是产品名称。提前分享五项核心需求，能帮助供应商推荐更贴近的首次样品，并缩短开发周期。",
      es: "Una cotización útil necesita más que un nombre de producto. Compartir cinco requisitos clave ayuda al proveedor a recomendar una primera muestra más ajustada y reduce los ciclos de desarrollo.",
      de: "Ein brauchbares Angebot braucht mehr als einen Produktnamen. Fünf Kernanforderungen mitzuteilen hilft, eine passendere Erstmustervorschlag zu erhalten, und verkürzt Entwicklungsschleifen.",
    },
  },
  "pva-batch-dissolution-consistency": {
    category: { en: "Quality control", zh: "质量控制", es: "Control de calidad", de: "Qualitätskontrolle" },
    title: {
      en: "How to Evaluate PVA Batch Dissolution Consistency",
      zh: "如何评估 PVA 批次溶解一致性",
      es: "Cómo evaluar la consistencia de disolución entre lotes de PVA",
      de: "So bewerten Sie die Auflösungsgleichmäßigkeit zwischen PVA-Chargen",
    },
    intro: {
      en: "Batch consistency cannot be judged by an uncontrolled visual demonstration. A useful comparison requires a written method and the same acceptance criteria for every batch.",
      zh: "批次一致性无法通过不受控的目视演示来判断。有效的比较需要书面方法和针对每一批次的相同验收标准。",
      es: "La consistencia entre lotes no puede juzgarse con una demostración visual sin control. Una comparación útil exige un método escrito y los mismos criterios de aceptación para cada lote.",
      de: "Chargenkonsistenz lässt sich nicht durch eine unkontrollierte visuelle Vorführung beurteilen. Ein sinnvoller Vergleich erfordert eine schriftliche Methode und dieselben Akzeptanzkriterien für jede Charge.",
    },
  },
  "pva-staple-fiber-vs-filament-yarn": {
    category: { en: "Material selection", zh: "选材对比", es: "Selección de material", de: "Materialauswahl" },
    title: {
      en: "PVA Staple Fiber vs Filament Yarn: How to Select the Material Form",
      zh: "PVA 短纤与长丝：如何选择材料形态",
      es: "Fibra cortada de PVA frente a filamento: cómo elegir la forma del material",
      de: "PVA-Stapelfaser oder Filamentgarn: so wählen Sie die Materialform",
    },
    intro: {
      en: "Staple fiber and continuous filament solve different process problems. The correct choice starts with the manufacturing route and the function the PVA material must perform.",
      zh: "短纤和连续长丝解决的是不同的工艺问题。正确的选择从制造路线和 PVA 材料必须承担的功能开始。",
      es: "La fibra cortada y el filamento continuo resuelven problemas de proceso distintos. La elección correcta empieza por la ruta de fabricación y la función que el material de PVA debe cumplir.",
      de: "Stapelfaser und endloses Filament lösen unterschiedliche Prozessprobleme. Die richtige Wahl beginnt beim Fertigungsweg und der Funktion, die das PVA-Material erfüllen muss.",
    },
  },
  "what-is-water-soluble-pva-yarn": {
    // Article authored for this site, not migrated. `en` and `zh` are asserted equal to the
    // entity below, so they are copied from `article-additions.ts` exactly. `es` and `de`
    // are DRAFTED here against this file's own glossary comment (fibra cortada / Stapelfaser,
    // disolución / Auflösung, the spaced degree sign those dictionaries use) and are
    // PENDING TRANSLATOR REVIEW — they are card labels, not the promotion seam, so they make
    // no approved-translation claim, but they must be read before the page is signed off.
    category: { en: "Technical guide", zh: "技术指南", es: "Guía técnica", de: "Fachleitfaden" },
    title: {
      en: "What Is Water-Soluble PVA Yarn? A Practical Guide for Textile Buyers",
      zh: "什么是水溶性 PVA 纱线：面向纺织采购的实用指南",
      es: "¿Qué es el hilo de PVA hidrosoluble? Guía práctica para compradores textiles",
      de: "Was ist wasserlösliches PVA-Garn? Ein praktischer Leitfaden für Textileinkäufer",
    },
    intro: {
      en: "Water-soluble PVA yarn is bought to do a job and then leave. This guide covers what it is, where mills use it, the four forms it is supplied in, and what to decide before asking for a sample.",
      zh: "水溶性 PVA 纱线是为了完成任务之后离开而采购的。本文说明它是什么、工厂在哪些环节使用、供应的四种形态，以及索取样品前需要先定下的内容。",
      es: "El hilo de PVA hidrosoluble se compra para cumplir una función y después desaparecer. Esta guía explica qué es, dónde lo usan las fábricas, las cuatro formas en que se suministra y qué conviene decidir antes de pedir una muestra.",
      de: "Wasserlösliches PVA-Garn wird gekauft, um eine Aufgabe zu erfüllen und danach zu verschwinden. Dieser Leitfaden erklärt, was es ist, wo Werke es einsetzen, in welchen vier Formen es geliefert wird und was vor einer Musteranfrage zu klären ist.",
    },
  },
  "water-soluble-pva-yarn-towel-manufacturing": {
    // Authored for this site. `en`/`zh` are asserted equal to the entity in `article-additions.ts`;
    // `es`/`de` are DRAFTED against this file's glossary comment and are PENDING TRANSLATOR REVIEW.
    category: { en: "Technical guide", zh: "技术指南", es: "Guía técnica", de: "Fachleitfaden" },
    title: {
      en: "Water-Soluble PVA Yarn in Towel Manufacturing: How and Why It Is Used",
      zh: "水溶性 PVA 纱线在毛巾制造中的用法与原因",
      es: "Hilo de PVA hidrosoluble en la fabricación de toallas: cómo y por qué se usa",
      de: "Wasserlösliches PVA-Garn in der Handtuchherstellung: wie und warum es verwendet wird",
    },
    intro: {
      en: "A zero-twist towel cannot hold its pile without support, and a permanent support yarn would ruin it. This is where a water-soluble yarn sits in the towel process, and how to run the trial that decides whether it works.",
      zh: "无捻毛巾没有支撑就拢不住绒头，而永久性支撑纱又会毁掉它。本文说明水溶纱在毛巾流程中的位置，以及如何做那一次决定成败的试验。",
      es: "Una toalla sin torsión no puede sostener su rizo sin soporte, y un hilo de soporte permanente la arruinaría. Aquí se explica dónde encaja un hilo hidrosoluble en el proceso de la toalla y cómo realizar el ensayo que decide si funciona.",
      de: "Ein Handtuch ohne Drehung kann seinen Flor nicht ohne Stütze halten, und ein dauerhaftes Stützgarn würde es ruinieren. Hier steht, wo ein wasserlösliches Garn im Handtuchprozess sitzt und wie der Versuch abläuft, der darüber entscheidet, ob er funktioniert.",
    },
  },
  "water-soluble-pva-yarn-knitting": {
    // Authored for this site. `en`/`zh` are asserted equal to the entity in `article-additions.ts`;
    // `es`/`de` are DRAFTED against this file's glossary comment and are PENDING TRANSLATOR REVIEW.
    category: { en: "Technical guide", zh: "技术指南", es: "Guía técnica", de: "Fachleitfaden" },
    title: {
      en: "Water-Soluble PVA Yarn in Knitting and Knitwear: How and Why It Is Used",
      zh: "水溶性 PVA 纱线在针织与针织成衣中的用法与原因",
      es: "Hilo de PVA hidrosoluble en el tejido de punto y las prendas de punto: cómo y por qué se usa",
      de: "Wasserlösliches PVA-Garn beim Stricken und in Strickwaren: wie und warum es verwendet wird",
    },
    intro: {
      en: "A knitted fabric or a plated structure can need support while it is being made, and that support has to be gone before the garment is worn. This is where a water-soluble PVA yarn sits in a knitwear route, the three ways it can enter a knit, and how to run the trial that decides whether it works.",
      zh: "针织面料或添纱结构在成形过程中可能需要支撑，而这份支撑必须在成衣被穿着之前消失。本文说明水溶性 PVA 纱线在针织流程中的位置、它进入针织物的三条路径，以及如何做那次决定成败的打样。",
      es: "Un tejido de punto o una estructura platinada puede necesitar soporte mientras se fabrica, y ese soporte debe desaparecer antes de que la prenda se use. Aquí se explica dónde encaja un hilo de PVA hidrosoluble en un proceso de punto, las tres formas en que puede entrar en un tejido de punto y cómo realizar el ensayo que decide si funciona.",
      de: "Ein Gestrick oder eine platinierte Struktur kann während der Herstellung eine Stütze brauchen, und diese Stütze muss verschwunden sein, bevor das Kleidungsstück getragen wird. Hier steht, wo ein wasserlösliches PVA-Garn in einem Strickprozess sitzt, auf welchen drei Wegen es in ein Gestrick gelangen kann und wie der Versuch abläuft, der darüber entscheidet, ob er funktioniert.",
    },
  },
  "water-soluble-sewing-thread-guide": {
    // Authored for this site. `en`/`zh` are asserted equal to the entity in `article-additions.ts`;
    // `es`/`de` are DRAFTED against this file's glossary comment and are PENDING TRANSLATOR REVIEW.
    category: { en: "Technical guide", zh: "技术指南", es: "Guía técnica", de: "Fachleitfaden" },
    title: {
      en: "Water-Soluble Sewing Thread: What It Is, How It Works and Where It Is Used",
      zh: "水溶性 PVA 缝纫线：是什么、怎么起作用、用在哪里",
      es: "Hilo de coser de PVA hidrosoluble: qué es, cómo funciona y dónde se usa",
      de: "Wasserlösliches PVA-Nähgarn: was es ist, wie es wirkt und wo es eingesetzt wird",
    },
    intro: {
      en: "A water-soluble sewing thread holds a seam through stitching and handling and then leaves in the finishing bath. This guide covers the three positions it holds, why a bench tensile result does not predict a break on the machine, and what to write down so the second trial costs less than the first.",
      zh: "水溶性 PVA 缝纫线在缝制与搬运中固定住一道缝线，随后在水洗工序里离开。本文说明它能承担的三种位置、为什么台面上的拉伸结果预测不了机器上的断线，以及该记下哪些内容才能让第二次打样比第一次更省事。",
      es: "Un hilo de coser hidrosoluble sostiene una costura durante la confección y la manipulación y después desaparece en el baño de acabado. Esta guía explica las tres posiciones que puede ocupar, por qué un resultado de tracción en banco no predice una rotura en la máquina y qué anotar para que el segundo ensayo cueste menos que el primero.",
      de: "Ein wasserlösliches Nähgarn hält eine Naht beim Nähen und Handhaben und verschwindet anschließend im Ausrüstungsbad. Dieser Leitfaden erklärt die drei Positionen, die es einnehmen kann, warum ein Zugversuch auf dem Tisch keinen Fadenbruch an der Maschine vorhersagt und was festzuhalten ist, damit der zweite Versuch weniger kostet als der erste.",
    },
  },
};

export function articleCard(slug: string, locale: Locale): ArticleCardCopy {
  const article = findArticle(slug);
  const copy = ARTICLE_TEASERS[slug];
  if (!copy) throw new Error(`card-copy: no article teaser for "${slug}"`);
  // The English and Chinese sides are asserted against the entity rather than
  // copied into the table, so a future edit to articles.ts fails here loudly
  // instead of leaving a listing card quoting a stale headline.
  if (copy.category.en !== article.category.en || copy.category.zh !== article.category.zh) {
    throw new Error(`card-copy: ${slug} category no longer matches articles.ts`);
  }
  if (copy.title.en !== article.title.en || copy.title.zh !== article.title.zh) {
    throw new Error(`card-copy: ${slug} title no longer matches articles.ts`);
  }
  if (copy.intro.en !== article.intro.en || copy.intro.zh !== article.intro.zh) {
    throw new Error(`card-copy: ${slug} intro no longer matches articles.ts`);
  }
  return {
    category: copy.category[locale],
    title: copy.title[locale],
    intro: copy.intro[locale],
  };
}

/**
 * The question title of a buyer answer, as a card shows it.
 *
 * Title only. An answer's body, its expansion pack and its FAQ list are deferred
 * content for this task, so `/es/answers/<slug>` still renders the model's own
 * headline over English prose while the label linking to it is Spanish — the same
 * card/page split as the knowledge teasers, stated rather than smoothed over.
 * Nothing here reaches the promotion seam: an answer has no evidence record in
 * either tier, and this is not how it would get one.
 */
export function answerCard(slug: string, locale: Locale): { question: string } {
  const answer = buyerAnswers.find((entry) => entry.slug === slug);
  if (!answer) throw new Error(`card-copy: unknown answer slug "${slug}"`);
  if (locale === "en") return { question: answer.question.en };
  if (locale === "zh") return { question: answer.question.zh };
  const translated = answerTeasers[slug]?.[locale];
  if (!translated) {
    throw new Error(
      `card-copy: answer-teasers has no ${locale} question for "${slug}", which cards render as a ` +
        `link label. Add the value, or this label ships English beside a localized page.`,
    );
  }
  return { question: translated };
}
