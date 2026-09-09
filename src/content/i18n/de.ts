import type { PartialDictionary } from "./index";

/**
 * Deutsch — vollständiges Wörterbuch für Benutzeroberfläche und
 * wörterbuchgesteuerte Textstrecken (Navigation, Footer, Formulare, CTAs,
 * Abschnittsüberschriften, Metadaten sowie die Prosa von `home` / `about` /
 * `contact` / `quality`).
 *
 * Deep content that belongs to an entity record — product and application body
 * copy — is NOT here: it reaches the renderer through the INTL-DEES-003A/004B
 * evidence registry (`src/content/translation-evidence.ts`), so that the text a
 * localized URL shows and the evidence that earned it ownership are the same
 * reviewed record. This file covers every leaf of `en.ts`; a leaf defined here
 * also stops the page from falling back to English chrome.
 *
 * Terminology follows the industrial B2B glossary agreed for this line:
 * wasserlösliches PVA-Garn · Nähgarn · Stapelfaser · Filament ·
 * Auflösung/Entfernung · Weberei · Strickerei · Ausrüstung.
 *
 * Two rules this file must not lose again:
 *
 * - `count` is two concepts, never one term. A yarn or thread count is a
 *   textile numbering, so `Feinnummer`; the number of filaments in a
 *   filament yarn is a physical quantity, so `Filamentenzahl`. Spanish
 *   matches: `título` and `número de filamentos`.
 * - Where the English word is broader than the process the Chinese reference
 *   names, translate the process. The sewing-thread commercial-specification
 *   list says `finish` in English and 上油 in Chinese, so it is `Ölung` here —
 *   not `Ausrüstung` — and `lubricación` in Spanish. A translation must not
 *   widen what the company says it does.
 * Company and certificate identities stay verbatim: they are proper nouns and
 * registered names, not translatable prose. Numeric claims are never altered.
 */
export const partial: PartialDictionary = {
  meta: {
    titleTemplate: "%s | Three Thai Textile",
    siteName: "Three Thai Textile",
    defaultTitle: "Hersteller wasserlöslicher PVA-Garne in China | Three Thai Textile",
    defaultDescription:
      "Three Thai Textile (山东荣沣纺织有限公司) stellt in Shandong, China, wasserlösliche PVA-Garne, Nähgarn, Stapelfaser und Filament für textile und industrielle Anwendungen her.",
  },
  nav: {
    home: "Start",
    products: "Produkte",
    applications: "Anwendungen",
    manufacturing: "Fertigung",
    quality: "Qualität",
    knowledge: "Ressourcen",
    about: "Über uns",
    contact: "Kontakt",
  },
  actions: {
    requestQuote: "Angebot anfordern",
    requestSample: "Muster anfordern",
    exploreProducts: "Produkte entdecken",
    viewAllProducts: "Alle Produkte ansehen",
    viewSpecifications: "Spezifikationen ansehen",
    viewApplication: "Anwendung ansehen",
    learnMore: "Mehr erfahren",
    readArticle: "Artikel lesen",
    readAnswer: "Antwort lesen",
    allArticles: "Alle Fachartikel",
    allAnswers: "Alle Käuferantworten",
    productFinder: "Sorte finden",
    startInquiry: "Anfrage starten",
    contactTeam: "Team kontaktieren",
    backToProducts: "Zurück zu den Produkten",
    backToApplications: "Zurück zu den Anwendungen",
    menu: "Menü",
    close: "Schließen",
    language: "Sprache",
  },
  home: {
    hero: {
      eyebrow: "Wasserlösliche PVA-Materialien · Shandong, China",
      title: "Hersteller wasserlöslicher PVA-Garne in China",
      body: "Shandong Three Thai Textile stellt PVA-Garne, Nähgarn, Stapelfaser und Filament für textile, industrielle und technische Anwendungen her — mit kontrollierter Auflösung von 20 °C bis 90 °C.",
      stamp: "Seit 2006 · Spezialist für PVA",
      imageAlt: "Wasserlösliches PVA-Garn von Three Thai Textile",
    },
    products: {
      eyebrow: "Kernprodukte",
      title: "Das richtige PVA-Format für jeden Prozess",
      body: "Wählen Sie Form, Nummer und Auflösungsprofil für Ihre Produktionslinie. Individuelle Entwicklung möglich.",
    },
    applications: {
      eyebrow: "Anwendungen",
      title: "Temporäre Festigkeit, langfristige Prozessleistung",
      body: "PVA-Materialien stützen während der Fertigung und lösen sich rückstandsfrei, wenn ihre Aufgabe erledigt ist.",
    },
    why: {
      eyebrow: "Warum Three Thai",
      title: "Spezialisierten PVA-Hersteller statt Handelskatalog",
      body: "Belege hinter jeder Aussage — lassen Sie uns alles verifizieren, bevor Sie sich festlegen.",
      points: [
        {
          title: "Seit 2006 fokussiert",
          body: "Ein dedizierter Spinnstandort für wasserlösliches PVA in Shandong mit integrierter Linie vom Krempelsaal bis zum automatischen Spulen.",
        },
        {
          title: "Sorten mit kontrollierter Auflösung",
          body: "Entwicklung an den Prozesszielen 20 °C, 40 °C, 55 °C, 60 °C, 70 °C, 80 °C und 90 °C — abgestimmt auf Ihren Entfernungszyklus, nicht auf ein pauschales Etikett.",
        },
        {
          title: "Über 50 dokumentierte Spezifikationen",
          body: "Garnnummern, Nähgarnkonstruktionen, Stapelfaserabmessungen und Filamentformate — mit Chargen-Qualitätsprotokollen.",
        },
        {
          title: "Zuerst das Muster, dann die Validierung",
          body: "Rückverfolgbare Muster, geprüft in Ihrem tatsächlichen Prozess, vor jeder Produktionszusage — dieselbe Methode, mit der wir auch eigene Chargen beurteilen.",
        },
        {
          title: "Individuelle Entwicklung",
          body: "Nummern, Konstruktionen, Schnittlängen und Spulenformate, angepasst an Ihre Ausrüstung — mit schriftlich abgestimmter Spezifikation.",
        },
        {
          title: "Exportfertige Dokumentation",
          body: "ISO-9001-, OEKO-TEX- und SGS-Unterlagen liegen vor; über 15 Exportmärkte werden über die Auslandsmarke Three Thai Textile betreut.",
        },
      ],
    },
    manufacturing: {
      eyebrow: "Fertigung",
      title: "Von der Faseröffnung bis zum automatischen Spulen — eine nachvollziehbare Linie",
      body: "Ein 30.000-m²-Produktionsstandort mit 120.000 Spindeln trägt eine konsistente, nachvollziehbare Fertigung über alle Nummern und Auflösungsstufen hinweg.",
      cta: "Produktionsstandort ansehen",
    },
    quality: {
      eyebrow: "Qualität & Compliance",
      title: "Überprüfbare Qualitätsnachweise",
      body: "ISO-9001-zertifiziertes Qualitätsmanagement (gültig bis August 2029), OEKO-TEX Standard 100 Klasse I zertifiziertes Garn (gültig bis Januar 2027) mit veröffentlichtem TESTEX-Bericht sowie 34 erteilte chinesische Patente — jede Aussage durch ein Dokument belegt.",
      cta: "Zertifikate ansehen",
      disclaimer: "Zertifikatsnummern, Geltungsbereiche und Gültigkeitsdaten finden Sie auf der Qualitätsseite; Originale auf Anfrage.",
    },
    knowledge: {
      eyebrow: "Fachwissen",
      title: "Leitfaden für technische Einkäufer",
      body: "Praktische Auswahl-, Prüf- und Problemlösungshinweise von unserem PVA-Engineering-Team.",
    },
    cta: {
      title: "Sagen Sie uns, was sich auflösen soll — und wann.",
      body: "Teilen Sie Anwendung, Spezifikation und Zielwassertemperatur mit. Wir empfehlen eine Spezifikation oder bereiten ein Muster vor.",
    },
  },
  footer: {
    tagline: "Wasserlösliche PVA-Garne, Nähgarn, Stapelfaser und Filament aus Shandong, China.",
    explore: "Entdecken",
    company: "Unternehmen",
    contactTitle: "Kontakt",
    evidence: "Qualitätsnachweise",
    lc: "LC-Bereich (Mitarbeiter)",
    rights: "Alle Rechte vorbehalten.",
    entityNote: "Handelt international als Shandong Three Thai Textile Co., Ltd. — der auf unseren ISO-9001- und OEKO-TEX-Zertifikaten eingetragene englische Name (山东荣沣纺织有限公司).",
    updatedNote: "Technische Inhalte werden regelmäßig überprüft; Kennzahlen stammen aus den Unternehmensunterlagen.",
  },
  breadcrumbs: {
    home: "Start",
    products: "Produkte",
    applications: "Anwendungen",
    knowledge: "Ressourcen",
    answers: "Käuferantworten",
    manufacturing: "Fertigung",
    quality: "Qualität",
    about: "Über uns",
    contact: "Kontakt",
    quote: "Angebot anfordern",
    sample: "Muster anfordern",
    finder: "Produktfinder",
  },
  form: {
    quoteTitle: "Angebot anfordern",
    quoteIntro: "Beschreiben Sie, was gelöst werden soll, in welcher Konstruktion und unter welchen Bedingungen. Ein vollständiges Briefing liefert ein passenderes Erstsample.",
    sampleTitle: "Muster anfordern",
    sampleIntro: "Beschreiben Sie Anwendung und Prozessbedingungen. Wir bestätigen eine rückverfolgbare Musterspezifikation, bevor etwas versandt wird.",
    contactTitle: "Kontakt zum PVA-Team",
    contactIntro: "Fragen zu Produkten, Spezifikationen, Dokumenten oder einem Audit? Schreiben oder rufen Sie uns an — wir antworten nach Möglichkeit innerhalb eines Werktags.",
    fields: {
      name: "Vollständiger Name",
      company: "Unternehmen",
      country: "Land / Region",
      email: "E-Mail",
      phone: "Telefon / WhatsApp",
      product: "Interessierendes Produkt",
      productNone: "Noch unsicher",
      application: "Anwendung",
      specification: "Spezifikation (Nummer, dtex, Konstruktion)",
      temperature: "Ziel-Auflösungstemperatur",
      quantity: "Geschätzte Menge",
      destination: "Zielland / Zielhafen",
      message: "Anwendungsdetails & Anforderungen",
      messagePlaceholder: "Beschreiben Sie die temporäre Funktion, Prozessbedingungen, Entfernungszyklus, Verpackung…",
    },
    optional: "optional",
    submitQuote: "Angebotsanfrage senden",
    submitSample: "Musteranfrage senden",
    submitMessage: "Nachricht senden",
    submitting: "Wird gesendet…",
    successTitle: "Anfrage erhalten",
    successBody: "Vielen Dank — unser Team prüft Ihr Briefing und antwortet per E-Mail. Referenz:",
    errorBody: "Beim Senden Ihrer Anfrage ist etwas schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie direkt an",
    privacy: "Ihre Daten werden ausschließlich zur Beantwortung dieser Anfrage verwendet.",
    errors: {
      name: "Bitte geben Sie Ihren Namen ein.",
      email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      message: "Bitte beschreiben Sie Ihre Anwendung (mindestens 20 Zeichen).",
      generic: "Bitte prüfen Sie die markierten Felder.",
    },
    contactDirect: "E-Mail oder Telefon bevorzugt?",
  },
  finder: {
    title: "PVA-Produktfinder",
    intro: "Beantworten Sie vier Fragen zu Ihrem Prozess. Wir schlagen eine Produktfamilie zur Diskussion vor; die endgültige Eignung wird stets per Muster bestätigt.",
    step: "Schritt",
    of: "von",
    back: "Zurück",
    restart: "Neu beginnen",
    resultTitle: "Vorgeschlagene Produktfamilie",
    resultNote: "Basierend auf Ihren Antworten: sprechen Sie diese Familie mit unserem Team ab und bestätigen Sie die genaue Spezifikation mit einem rückverfolgbaren Muster.",
    resultCta: "Weiter zur technischen Anfrage",
    question: {
      form: "Welche Materialform braucht Ihr Prozess?",
      application: "Wo kommt sie zum Einsatz?",
      temperature: "Welche Wassertemperatur steht für die Entfernung zur Verfügung?",
      spec: "Haben Sie eine Ziel-Spezifikation?",
    },
    form: {
      yarn: "Garn (Stützgarn für Web- oder Strickware)",
      thread: "Nähgarn (temporäre Nähte)",
      staple: "Stapelfaser (Beimischung, Vliesstoffe, Papier)",
      filament: "Filamentgarn (kontinuierliche technische Nutzung)",
      unsure: "Unsicher — bitte beraten",
    },
    temperatureOptions: {
      cold: "Kaltwasser (≈20 °C)",
      low: "Niedrige Temperatur (40–55 °C)",
      mid: "Mittel (60–70 °C)",
      high: "Hoch (80–90 °C)",
      unsure: "Unsicher — bitte beraten",
    },
    specOptions: {
      known: "Ja — Nummer / dtex sind bekannt",
      partial: "Teilweise — die Anwendung ist bekannt",
      none: "Nein — bitte aus dem Prozess ableiten",
    },
    applicationOptions: {
      towel: "Handtuchweberei / Zero-Twist",
      embroidery: "Stickerei / Näherei",
      knitting: "Strickerei / Wirkwaren",
      paper: "Papierherstellung",
      technical: "Technische Textilien / Verbundwerkstoffe",
      other: "Sonstige textile Nutzung",
    },
  },
  answersIndex: {
    title: "Käuferantworten",
    eyebrow: "Käuferantwort · Wasserlösliche PVA-Materialien",
    directLabel: "Direkte Antwort",
    lead: "Belegbasierte Antworten auf häufige Beschaffungsfragen zu wasserlöslichem PVA-Garn, Nähgarn, Stapelfaser und Filament. Ranglisten, Preise und Zertifizierungen werden als zu prüfende Aussagen behandelt — nicht als Marketingfakten, die man wiederholt.",
    askHeading: "Angaben, die in Ihre Anfrage gehören",
    aboutHeading: "Zu dieser Antwort",
    aboutBody: "Erstellt vom Fachtext-Team der Shandong Three Thai Textile Co., Ltd. (山东荣沣纺织有限公司). Diese Seite liefert Beschaffungsorientierung, kein unabhängiges Ranking und keine Zertifizierungsentscheidung. Die Eignung eines Produkts ist mit einem rückverfolgbaren Muster und im tatsächlichen Prozess des Käufers zu bestätigen.",
    count: "praxisnahe Antworten",
    englishNote: "Pflegt unser Fachtext-Team — Bewertungen und Aussagen werden verifiziert, nicht übernommen.",
  },
  knowledgeIndex: {
    title: "Fachartikel",
    lead: "Auswahlguides, Prüfrahmen und Spezifikations-Checklisten unseres PVA-Engineering-Teams.",
    published: "Veröffentlicht",
    updated: "Aktualisiert",
  },
  about: {
    title: "Über Three Thai Textile",
    lead: "山东荣沣纺织有限公司 (Shandong Three Thai Textile Co., Ltd.) entwickelt und fertigt wasserlösliche PVA-Garne, Nähgarn, Stapelfaser und Filament — abgestimmt auf Prozess, Nummer und Ziel-Auflösungstemperatur jedes Kunden.",
    philosophyTitle: "Fertigungsphilosophie",
    philosophyBody: "Anwendungsgeführte Produktentwicklung, Qualitätssicherung pro Charge und flexible Nummern wie Auflösungstemperaturen. Wir bestätigen eine Sorte lieber mit einem rückverfolgbaren Muster und einem schriftlichen Prüfverfahren, als sie nur über ein Temperaturetikett zu verkaufen.",
    positioningTitle: "Geschäftliche Positionierung",
    positioningBody: "Spezialisierte Herstellung wasserlöslicher PVA-Materialien für Weberei, Strickerei, Näherei und Stickerei, Vliesstoffe, Papierherstellung und technische Textilien. Das Unternehmen handelt international als Shandong Three Thai Textile Co., Ltd. mit der Produktmarke threethai™.",
    coverageTitle: "Markt- und Serviceabdeckung",
    coverageBody: "Das Unternehmen betreut internationale Käufer unter dem Namen Three Thai mit Erfahrung aus über 15 Exportmärkten — mit regelmäßigen Lieferungen nach Indien, Pakistan, Vietnam, Türkei, Bangladesch, Ukraine und Peru — inklusive Dokumentationsunterstützung, Musterlogistik und spezifikationsgesteuertem Wiederholbedarf.",
    timelineTitle: "Unternehmenschronologie",
    timeline: [
      { year: "2006", body: "Gründung des Unternehmens im Kreis Huimin, Provinz Shandong, mit Fokus auf wasserlösliche PVA-Materialien." },
      { year: "Ab 2006", body: "Aufbau der integrierten Spinnroute — Krempelsaal, Gemisch-Aufbereitung, Strecken, Speed Frames, Ringspinnen und automatisches Spulen." },
      { year: "Heute", body: "30.000 m² Produktionsstandort mit 120.000 Spindeln, über 50 Spezifikationen und Auflösungsentwicklung von 20 °C bis 90 °C." },
    ],
    identityTitle: "Unternehmensidentität",
    identityBody: "山东荣沣纺织有限公司 ist die Rechtseinheit; Shandong Three Thai Textile Co., Ltd. ist die Auslandsmarke, unter der das Unternehmen internationale Geschäfte führt. Zertifikatinhaber und Vertragspartner sind je Dokument zu bestätigen.",
    recognitionTitle: "Zulassungen & Auszeichnungen",
    recognitionIntro: "Auszeichnungen der 山东荣沣纺织有限公司 nach den amtlichen Unternehmensunterlagen; Nachweisurkunden sind auf Anfrage verfügbar.",
    recognition: [
      "National High-Tech Enterprise des Staates (国家高新技术企业)",
      "KMU in Shandong für „Spezialisierung, Präzision, Besonderheit, Neuheit“ (专精特新中小企业)",
      "„Morgenstern-Fabrik“ der Digitalwirtschaft in Shandong (晨星工厂)",
      "Digitalisierte Werkstatt auf Provinzebene in Shandong (省级数字化车间)",
      "Gazellen-Unternehmen der Stadt Binzhou (瞪羚企业)",
      "Unternehmenstechnologiezentrum, Ingenieur-Forschungszentrum und Industriedesignzentrum der Stadt Binzhou",
      "F&E-Zentrum „ein Unternehmen, eine Technologie“ der Stadt Binzhou",
      "Vorbildliches Kollektiv der Textilindustrie von Binzhou",
    ],
    researchTitle: "Forschung & Industriepartnerschaften",
    researchIntro: "Produktentwicklung baut auf langjähriger Kooperation zwischen Industrie und Hochschulen sowie ein eigenes F&E-Team, das Forschungsergebnisse in produktionstaugliche PVA-Technologie überführt.",
    research: [
      "Gemeinsame Master-Arbeitsstation für F&E zu wasserlöslichem PVA mit der Textiluniversität Wuhan (武汉纺织大学).",
      "Laufende Industrie-Forschungs-Kooperation mit dem Team von Prof. Ma Pibo an der Universität Jiangnan (江南大学); mehrere Patente stehen im Mitbesitz aus dieser Zusammenarbeit.",
      "Ein 27-köpfiges F&E-Team für die Spinn-Technologie wasserlöslichen PVA und deren Hochskalierung.",
      "Beteiligtes Erarbeitungsgremium der nationalen Norm Textiles — Smart textiles — Terminology and classification (Projekt 20213126-T-608, in Erarbeitung durch SAC/TC 209).",
    ],
  },
  contact: {
    title: "Kontakt",
    lead: "Sprechen Sie mit dem Team über Produkte, Spezifikationen, Muster, Dokumente und Audits.",
    directTitle: "Direkter Kontakt",
    hoursTitle: "Reaktionszeit",
    hoursBody: "E-Mail-Anfragen werden in der Regel innerhalb eines Werktags beantwortet. Bei dringender Musterlogistik geben Sie Ihren Hafen und die gewünschten Termine an.",
    auditTitle: "Fabrikbesuche & Audits",
    auditBody: "Kundenbesuche und Audits Dritter sind an unserem Produktionsstandort in Shandong willkommen. Schreiben Sie uns, um einen Termin und die zu prüfenden Produktionsbereiche abzustimmen.",
  },
  productsPage: {
    title: "PVA-Produkte",
    lead: "Vier Materialfamilien decken temporäre Abstützung, lösbare Fixierung und kontrollierte Auflösung in Ihrem Prozess ab.",
    availableAt: "Verfügbare Produkte & Spezifikationen",
    sampleCta: "Diese Temperatur anfragen",
  },
  applicationsPage: {
    title: "Anwendungen",
    lead: "Wo wasserlösliches PVA seinen Platz in der Produktionslinie findet.",
  },
  manufacturingPage: {
    title: "Fertigung",
    lead: "Eine integrierte Spinnroute — von der Faseröffnung bis zum automatischen Spulen.",
    capabilityTitle: "Lieferfähigkeit",
    traceTitle: "Rückverfolgbarkeit",
    traceBody: "Freigegebene Muster sind an schriftliche Spezifikationen gebunden; Chargenprotokolle und Prüfergebnisse dokumentieren jeden Produktionslauf. Änderungen an Rohstoff, Konstruktion, Ausrüstung oder Route werden gesteuert und mitgeteilt statt stillschweigend ersetzt.",
    statsTitle: "Produktionsstandort in Zahlen",
    statsNote: "Zahlen aus den Unternehmensunterlagen, wie sie auf der früheren Website veröffentlicht waren; aktuelle Werte werden bei Vertragsabschluss bestätigt.",
    visitTitle: "Fabrik besuchen oder auditieren",
    visitBody: "Kundenbesuche und Audits Dritter sind willkommen. Kontaktieren Sie uns, um einen Termin und die zu sehenden Bereiche abzustimmen.",
  },
  qualityPage: {
    title: "Qualität & Zertifizierung",
    lead: "Managementsystem, Produktprüfungen und Patente — überprüfbare Dokumente mit je Dokument bestätigtem Geltungsbereich und Gültigkeit.",
    processTitle: "So wird die Qualität gesteuert",
    certsTitle: "Zertifikate & Berichte",
    certsNote: "Klicken Sie auf ein Dokument, um die vollständige Abbildung zu sehen; PDF-Originale werden bereitgestellt, soweit vorhanden.",
    patentsTitle: "Patente & geistiges Eigentum",
    patentsStatsInvention: "Erteilte Patente (CN)",
    patentsStatsUtility: "Gebrauchsmuster (CN)",
    patentsStatsForeign: "Patente im Ausland erteilt",
    patentNoLabel: "Patentnr.",
    patentGrantedLabel: "Erteilt",
    patentFiledLabel: "Angemeldet",
    patentSoleLabel: "Alleininhaber",
    patentJointLabel: "Mitbesitz mit einem verbundenen Unternehmen",
    utilityTableTitle: "Erteilte Gebrauchsmuster (vollständige Liste)",
    utilityTableNote: "Alle 25 Gebrauchsmuster sind auf 山东荣沣纺织有限公司 (Shandong Three Thai Textile Co., Ltd.) eingetragen.",
    downloadPdf: "PDF herunterladen",
    verifyTitle: "So prüfen Sie unsere Unterlagen",
    verifySteps: [
      "Vergleichen Sie den Zertifikatinhaber mit dem Vertragspartner: Die Rechtseinheit ist 山东荣沣纺织有限公司 und handelt international als Shandong Three Thai Textile Co., Ltd.",
      "Prüfen Sie den Produktbereich: angebotene Sorte, Farbe und Verwendung müssen innerhalb des Geltungsbereichs von Zertifikat oder Prüfbericht liegen.",
      "Prüfen Sie Gültigkeitsdaten und verifizieren Sie die Nummer über den offiziellen Kanal der ausstellenden Stelle.",
      "Fordern Sie chargenbezogene Freigabeprotokolle an, wenn Ihre Risikobewertung das verlangt.",
    ],
  },
  productsIndex: {
    specsTitle: "Spezifikationen & Auswahl",
    processTitle: "Prozessleitfaden",
    applicationsTitle: "Übliche Anwendungen",
    selectionTitle: "Vor der Musterung bestätigen",
    overviewTitle: "Technische Übersicht",
    faqTitle: "Produkt-FAQ",
    evidenceTitle: "Nachweise aus Fertigung & Qualitätssicherung",
    evidenceBody: "Hergestellt auf einer integrierten Spinnlinie (vom Krempelsaal bis zum automatischen Spulen) mit Prüfung pro Charge. Produktionsstandort, Ausrüstung und Zertifizierungsdokumente siehe Fertigungs- und Qualitätsseite.",
    resourcesTitle: "Verwandte Fachressourcen",
    ctaTitle: "Diese Sorte als Muster benötigt?",
    ctaBody: "Senden Sie Nummer, Konstruktion und Entfernungsbedingungen — wir bestätigen eine rückverfolgbare Musterspezifikation.",
    nextPrev: "Nächstes Produkt",
  },
  applicationPage: {
    productsTitle: "Relevante Produktformen",
    selectionTitle: "Auswahlvariablen",
    nextStepTitle: "Empfohlener nächster Schritt",
    nextStepBody: "Senden Sie Konstruktion, Entfernungsbedingungen und Akzeptanzkriterien über die Musteranfrage — wir bestätigen ein rückverfolgbares Muster und ein schriftliches Prüfverfahren, bevor über Produktion gesprochen wird.",
  },
  notFound: {
    title: "Seite nicht gefunden",
    body: "Die angeforderte Seite existiert nicht. Nutzen Sie den Produktindex oder schreiben Sie direkt an unser Team.",
  },
  // INTL-DEES-001: page metadata and the labels that were literals in the
  // route files and components. See the note in `en.ts`.

};
