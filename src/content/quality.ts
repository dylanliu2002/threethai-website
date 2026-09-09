import type { Locale } from "./company";

/**
 * Quality & certification evidence.
 *
 * ISO 9001 and OEKO-TEX entries carry details transcribed directly from the
 * certificate PDFs provided by the company (Aug 2026 dossier): certificate
 * numbers, scope, issuing bodies and validity dates. Buyers should still
 * verify numbers through the issuing bodies before contracting.
 */

export type CertificateItem = {
  image: string;
  /** Optional full-document PDF served from /documents. */
  pdf?: string;
  label: Record<Locale, string>;
  kind: "iso" | "oeko-tex" | "sgs" | "patent";
  note: Record<Locale, string>;
  /** Verified facts (cert number / standard / scope / validity). Optional for legacy scans. */
  facts?: { name: Record<Locale, string>; value: Record<Locale, string> }[];
};

export const certificates: readonly CertificateItem[] = [
  {
    image: "/images/certificates/iso-9001-en.jpg",
    pdf: "/documents/iso-9001-certificate-en.pdf",
    kind: "iso",
    label: { en: "ISO 9001:2015 certificate (English)", es: "Certificado ISO 9001:2015 (inglés)", de: "ISO-9001:2015-Zertifikat (englisch)",zh: "ISO 9001:2015 认证证书（英文版）" },
    note: {
      en: "Quality management system certificate covering production of water-soluble PVA yarns and sales of water-soluble PVA fibers.",es: "Certificado del sistema de gestión de la calidad que cubre la producción de hilos de PVA hidrosolubles y la venta de fibras de PVA hidrosolubles.",de: "Zertifikat des Qualitätsmanagementsystems für die Herstellung wasserlöslicher PVA-Garne und den Vertrieb wasserlöslicher PVA-Fasern.",
      zh: "覆盖水溶性 PVA 纱线生产与水溶性 PVA 纤维销售的质量管理体系证书。",
    },
    facts: [
      { name: { en: "Certificate no.", es: "N.º de certificado", de: "Zertifikatsnr.",zh: "证书编号" }, value: { en: "23226Q00380R101", es: "23226Q00380R101", de: "23226Q00380R101",zh: "23226Q00380R101" } },
      { name: { en: "Standard", es: "Norma", de: "Norm",zh: "标准" }, value: { en: "GB/T 19001-2016 / ISO 9001:2015", es: "GB/T 19001-2016 / ISO 9001:2015", de: "GB/T 19001-2016 / ISO 9001:2015",zh: "GB/T 19001-2016 / ISO 9001:2015" } },
      { name: { en: "Issued by", es: "Emitido por", de: "Ausgestellt von",zh: "发证机构" }, value: { en: "Beijing Credit First Certification Co., Ltd. (IAF/CNAS)", es: "Beijing Credit First Certification Co., Ltd. (IAF/CNAS)", de: "Beijing Credit First Certification Co., Ltd. (IAF/CNAS)",zh: "北京首信联合认证有限公司（IAF/CNAS）" } },
      { name: { en: "Valid until", es: "Válido hasta", de: "Gültig bis",zh: "有效期至" }, value: { en: "Aug 6, 2029", es: "6 de agosto de 2029", de: "6. August 2029",zh: "2029 年 8 月 6 日" } },
    ],
  },
  {
    image: "/images/certificates/iso-9001-zh.jpg",
    pdf: "/documents/iso-9001-certificate-zh.pdf",
    kind: "iso",
    label: { en: "ISO 9001:2015 certificate (Chinese)", es: "Certificado ISO 9001:2015 (chino)", de: "ISO-9001:2015-Zertifikat (chinesisch)",zh: "ISO 9001:2015 认证证书（中文版）" },
    note: {
      en: "Chinese-language copy of the same certificate — holder: 山东荣沣纺织有限公司.",es: "Copia en chino del mismo certificado — titular: 山东荣沣纺织有限公司.",de: "Chinesischsprachige Ausfertigung desselben Zertifikats — Inhaber: 山东荣沣纺织有限公司.",
      zh: "同一证书的中文版本——持证人：山东荣沣纺织有限公司。",
    },
    facts: [
      { name: { en: "Holder", es: "Titular", de: "Inhaber",zh: "持证人" }, value: { en: "山东荣沣纺织有限公司 / Shandong Three Thai Textile Co., Ltd.", es: "山东荣沣纺织有限公司 / Shandong Three Thai Textile Co., Ltd.", de: "山东荣沣纺织有限公司 / Shandong Three Thai Textile Co., Ltd.",zh: "山东荣沣纺织有限公司 / Shandong Three Thai Textile Co., Ltd." } },
      { name: { en: "First issued", es: "Primera expedición", de: "Erstausstellung",zh: "初次发证" }, value: { en: "Aug 9, 2023", es: "9 de agosto de 2023", de: "9. August 2023",zh: "2023 年 8 月 9 日" } },
      { name: { en: "Reissued", es: "Reexpedido", de: "Neu ausgestellt",zh: "本次发证" }, value: { en: "Aug 7, 2026", es: "7 de agosto de 2026", de: "7. August 2026",zh: "2026 年 8 月 7 日" } },
      { name: { en: "Valid until", es: "Válido hasta", de: "Gültig bis",zh: "有效期至" }, value: { en: "Aug 6, 2029", es: "6 de agosto de 2029", de: "6. August 2029",zh: "2029 年 8 月 6 日" } },
    ],
  },
  {
    image: "/images/certificates/oeko-tex-en.jpg",
    pdf: "/documents/oeko-tex-standard-100-certificate-2026.pdf",
    kind: "oeko-tex",
    label: { en: "OEKO-TEX Standard 100, Class I (baby articles)", es: "OEKO-TEX Standard 100, Clase I (artículos para bebé)", de: "OEKO-TEX Standard 100, Klasse I (Babyartikel)",zh: "OEKO-TEX Standard 100 认证（I 类婴幼儿级）" },
    note: {
      en: "7th renewal of certificate SH005 149658, issued by TESTEX (Zurich). Scope: 100% PVA water-soluble yarn in raw white — the strictest product class, for baby articles.",es: "Séptima renovación del certificado SH005 149658, emitido por TESTEX (Zúrich). Alcance: hilo de PVA hidrosoluble 100 % en blanco crudo — la clase de producto más estricta, para artículos de bebé.",de: "Siebte Verlängerung der Urkunde SH005 149658, ausgestellt von TESTEX (Zürich). Geltungsbereich: 100-%-PVA-Wassergarn, roh weiß — die strengste Produktklasse, für Babyartikel.",
      zh: "证书 SH005 149658 第七次续期，由 TESTEX（苏黎世）颁发。认证范围：原白色 100% 水溶性 PVA 纱线——适用于婴幼儿制品的最严格产品级别。",
    },
    facts: [
      { name: { en: "Certificate no.", es: "N.º de certificado", de: "Zertifikatsnr.",zh: "证书编号" }, value: { en: "SH005 149658", es: "SH005 149658", de: "SH005 149658",zh: "SH005 149658" } },
      { name: { en: "Product class", es: "Clase de producto", de: "Produktklasse",zh: "产品级别" }, value: { en: "Class I (baby articles), Annex 6", es: "Clase I (artículos para bebé), Anexo 6", de: "Klasse I (Babyartikel), Anhang 6",zh: "I 类（婴幼儿产品），附录 6" } },
      { name: { en: "Test report", es: "Informe de ensayo", de: "Prüfbericht",zh: "检测报告" }, value: { en: "SH005 275198.1 (all parameters passed)", es: "SH005 275198.1 (todos los parámetros aprobados)", de: "SH005 275198.1 (alle Parameter bestanden)",zh: "SH005 275198.1（全部参数合格）" } },
      { name: { en: "Valid until", es: "Válido hasta", de: "Gültig bis",zh: "有效期至" }, value: { en: "Jan 31, 2027", es: "31 de enero de 2027", de: "31. Januar 2027",zh: "2027 年 1 月 31 日" } },
    ],
  },
  {
    image: "/images/certificates/testex-report.jpg",
    pdf: "/documents/testex-test-report-sh005-275198-1.pdf",
    kind: "oeko-tex",
    label: { en: "TESTEX test report SH005 275198.1 (2026)", es: "Informe de ensayo TESTEX SH005 275198.1 (2026)", de: "TESTEX-Prüfbericht SH005 275198.1 (2026)",zh: "TESTEX 检测报告 SH005 275198.1（2026）" },
    note: {
      en: "Full 10-page TESTEX report behind the OEKO-TEX renewal: heavy metals, formaldehyde, pH 6.2, VOCs, PAH and more — all tested parameters within Class I limits.",es: "Informe TESTEX completo de 10 páginas que respalda la renovación OEKO-TEX: metales pesados, formaldehído, pH 6,2, COV, HAP y más — todos los parámetros ensayados dentro de los límites de la Clase I.",de: "Der vollständige 10-seitige TESTEX-Bericht hinter der OEKO-TEX-Verlängerung: Schwermetalle, Formaldehyd, pH 6,2, VOC, PAK und mehr — alle geprüften Parameter innerhalb der Klasse-I-Grenzwerte.",
      zh: "OEKO-TEX 续证所依据的 10 页完整 TESTEX 报告：重金属、甲醛、pH 值 6.2、VOC、多环芳烃等——全部检测参数符合 I 类限值。",
    },
    facts: [
      { name: { en: "Report no.", es: "N.º de informe", de: "Berichtsnr.",zh: "报告编号" }, value: { en: "SH005 275198.1", es: "SH005 275198.1", de: "SH005 275198.1",zh: "SH005 275198.1" } },
      { name: { en: "Test material", es: "Material ensayado", de: "Prüfmaterial",zh: "检测材料" }, value: { en: "PVA yarn (raw white)", es: "Hilo de PVA (blanco crudo)", de: "PVA-Garn (roh weiß)",zh: "PVA 纱线（原白）" } },
      { name: { en: "Issued", es: "Emitido", de: "Ausgestellt",zh: "签发日期" }, value: { en: "Jan 7, 2026", es: "7 de enero de 2026", de: "7. Januar 2026",zh: "2026 年 1 月 7 日" } },
      { name: { en: "Laboratory", es: "Laboratorio", de: "Labor",zh: "检测机构" }, value: { en: "TESTEX AG, Swiss Textile Testing Institute", es: "TESTEX AG, Instituto Suizo de Ensayos Textiles", de: "TESTEX AG, Schweizerische Textilprüfanstalt",zh: "TESTEX AG 瑞士纺织检定有限公司" } },
    ],
  },
  {
    image: "/images/legacy/certificates/05.jpg",
    kind: "sgs",
    label: { en: "SGS test report (yarn quality, 2020)", es: "Informe de ensayo SGS (calidad del hilo, 2020)", de: "SGS-Prüfbericht (Garnqualität, 2020)",zh: "SGS 检测报告（纱线质量，2020）" },
    note: {
      en: "SGS report SL22002263585101TX on 7.5 tex PVA yarn: single thread strength, moisture content/regain, yarn count and evenness (June 2020).",es: "Informe SGS SL22002263585101TX sobre hilo de PVA de 7,5 tex: resistencia de hilo simple, contenido y absorción de humedad, título y regularidad del hilo (junio de 2020).",de: "SGS-Bericht SL22002263585101TX über 7,5-tex-PVA-Garn: Einzelfadenfestigkeit, Feuchtegehalt und -zuwachs, Garnnummer und Gleichmäßigkeit (Juni 2020).",
      zh: "SGS 报告 SL22002263585101TX（2020 年 6 月）：7.5 tex PVA 纱线的单纱强力、回潮率、线密度与条干均匀度检测。",
    },
    facts: [
      { name: { en: "Report no.", es: "N.º de informe", de: "Berichtsnr.",zh: "报告编号" }, value: { en: "SL22002263585101TX", es: "SL22002263585101TX", de: "SL22002263585101TX",zh: "SL22002263585101TX" } },
      { name: { en: "Date", es: "Fecha", de: "Datum",zh: "日期" }, value: { en: "June 19, 2020", es: "19 de junio de 2020", de: "19. Juni 2020",zh: "2020 年 6 月 19 日" } },
    ],
  },
  {
    image: "/images/legacy/certificates/06.jpg",
    kind: "patent",
    label: { en: "Utility model patent (example)", es: "Patente de modelo de utilidad (ejemplo)", de: "Gebrauchsmusterpatent (Beispiel)",zh: "实用新型专利证书（示例）" },
    note: {
      en: "ZL 2019 2 0067840.8 — water-soluble PVA/cotton blended wave-shaped thread (CN 209619548 U). One of 25 granted utility models.",es: "ZL 2019 2 0067840.8 — ondulado hilo de mezcla de PVA hidrosoluble y algodón (CN 209619548 U). Uno de los 25 modelos de utilidad concedidos.",de: "ZL 2019 2 0067840.8 — wellenförmiges Mischgarn aus wasserlöslichem PVA und Baumwolle (CN 209619548 U). Eines von 25 erteilten Gebrauchsmustern.",
      zh: "ZL 2019 2 0067840.8——水溶性 PVA/棉混纺纤维型波形线（CN 209619548 U），25 件实用新型专利之一。",
    },
  },
  {
    image: "/images/certificates/patent-nigeria.jpg",
    pdf: "/documents/patent-certificate-nigeria-2026.pdf",
    kind: "patent",
    label: { en: "Nigerian patent (2026)", es: "Patente de Nigeria (2026)", de: "Nigerianisches Patent (2026)",zh: "尼日利亚专利证书（2026）" },
    note: {
      en: "Federal Republic of Nigeria patent RP: F/PT/C/O/2026/21316 — broken end detection and automatic feed stopping device for spinning frames.",es: "Patente de la República Federal de Nigeria RP: F/PT/C/O/2026/21316 — dispositivo de detección de rotura de punta y parada automática del avance para máquinas de hilar.",de: "Patent der Bundesrepublik Nigeria RP: F/PT/C/O/2026/21316 — Vorrichtung zur Erkennung von Fadenbrüchen und zum automatischen Stoppen der Zufuhr bei Spinnmaschinen.",
      zh: "尼日利亚联邦共和国专利 RP: F/PT/C/O/2026/21316——纺纱机断头检测与自动停车喂料装置。",
    },
    facts: [
      { name: { en: "Registration", es: "Registro", de: "Registrierung",zh: "注册号" }, value: { en: "RP: F/PT/C/O/2026/21316", es: "RP: F/PT/C/O/2026/21316", de: "RP: F/PT/C/O/2026/21316",zh: "RP: F/PT/C/O/2026/21316" } },
      { name: { en: "Priority", es: "Prioridad", de: "Priorität",zh: "优先权" }, value: { en: "CN 20251132549.7 · Sep 16, 2025", es: "CN 20251132549.7 · 16 de septiembre de 2025", de: "CN 20251132549.7 · 16. September 2025",zh: "CN 20251132549.7 · 2025-09-16" } },
      { name: { en: "Sealed", es: "Sello", de: "Besiegelt",zh: "盖章日" }, value: { en: "Apr 10, 2026", es: "10 de abril de 2026", de: "10. April 2026",zh: "2026 年 4 月 10 日" } },
    ],
  },
  {
    image: "/images/certificates/patent-malta.jpg",
    pdf: "/documents/patent-certificate-malta-2026.pdf",
    kind: "patent",
    label: { en: "Maltese patent (2026)", es: "Patente de Malta (2026)", de: "Maltesisches Patent (2026)",zh: "马耳他专利证书（2026）" },
    note: {
      en: "Malta patent No. 5964 — dust purification device for water-soluble yarn processing, granted under the Patents and Designs Act (Cap. 417).",es: "Patente de Malta n.º 5964 — dispositivo de purificación de polvo para el procesamiento de hilo hidrosoluble, concedido conforme a la Ley de Patentes y Diseños (Cap. 417).",de: "Patent Nr. 5964 (Malta) — Staubreinigungs-Vorrichtung für die Verarbeitung wasserlöslicher Garne, erteilt nach dem Patent- und Designgesetz (Cap. 417).",
      zh: "马耳他专利第 5964 号——水溶性纱线加工除尘净化装置，依据《专利与外观设计法》（Cap. 417）授权。",
    },
    facts: [
      { name: { en: "Patent no.", es: "N.º de patente", de: "Patentnr.",zh: "专利号" }, value: { en: "5964", es: "5964", de: "5964",zh: "5964" } },
      { name: { en: "Priority", es: "Prioridad", de: "Priorität",zh: "优先权" }, value: { en: "CN 2025109190368 · Jul 3, 2025", es: "CN 2025109190368 · 3 de julio de 2025", de: "CN 2025109190368 · 3. Juli 2025",zh: "CN 2025109190368 · 2025-07-03" } },
      { name: { en: "Registered", es: "Registrada", de: "Eingetragen",zh: "注册日" }, value: { en: "Apr 20, 2026", es: "20 de abril de 2026", de: "20. April 2026",zh: "2026 年 4 月 20 日" } },
    ],
  },
];

export const qualityPillars: readonly {
  title: Record<Locale, string>;
  body: Record<Locale, string>;
}[] = [
  {
    title: { en: "Batch-level quality control", es: "Control de calidad por lote", de: "Chargen-Qualitätskontrolle",zh: "批次级质量控制" },
    body: {
      en: "Products are checked at batch level so consistency can be judged against records rather than one-off demonstrations.",es: "Los productos se comprueban a nivel de lote, de modo que la consistencia se juzga con registros y no con demostraciones puntuales.",de: "Produkte werden chargenbezogen geprüft, damit die Konsistenz anhand von Unterlagen beurteilt wird und nicht nach einmaligen Vorführungen.",
      zh: "产品按批次进行检测，一致性以记录为依据判断，而非一次性的目测演示。",
    },
  },
  {
    title: { en: "Application-led validation", es: "Validación guiada por la aplicación", de: "Anwendungsgeführte Validierung",zh: "以应用为导向的验证" },
    body: {
      en: "Specifications are confirmed against the buyer's real process — temperature, time, agitation and finishing conditions — before production.",es: "Las especificaciones se confirman frente al proceso real del comprador —temperatura, tiempo, agitación y condiciones de acabado— antes de producir.",de: "Spezifikationen werden vor der Produktion am tatsächlichen Prozess des Käufers bestätigt — Temperatur, Zeit, mechanische Bewegung und Ausrüstungsbedingungen.",
      zh: "规格在投产前结合客户真实工艺确认——包括水温、时间、搅动和后整理条件。",
    },
  },
  {
    title: { en: "Traceable sampling", es: "Muestreo trazable", de: "Nachvollziehbare Bemusterung",zh: "样品可追溯" },
    body: {
      en: "Approved samples are linked to written specifications so bulk orders follow the result the buyer validated.",es: "Las muestras aprobadas quedan vinculadas a especificaciones escritas, de modo que los pedidos de producción siguen el resultado validado por el comprador.",de: "Freigegebene Muster sind an schriftliche Spezifikationen gebunden, damit Produktionsaufträge dem vom Käufer bestätigten Ergebnis folgen.",
      zh: "确认样品与书面规格对应，批量订单严格按照客户验证的结果执行。",
    },
  },
  {
    title: { en: "Documented evidence", es: "Evidencia documentada", de: "Dokumentierte Nachweise",zh: "可查验的文件证据" },
    body: {
      en: "Certification, testing and patent documents are available for review, with issuing bodies, scope and validity stated per document.",es: "Los documentos de certificación, ensayo y patente están disponibles para su revisión, con organismo emisor, alcance y validez indicados por documento.",de: "Zertifizierungs-, Prüf- und Patentunterlagen sind zur Prüfung verfügbar, mit ausstellender Stelle, Geltungsbereich und Gültigkeit je Dokument.",
      zh: "认证、检测和专利文件可供查验，并逐份注明发证机构、范围与有效期。",
    },
  },
];

export const qualityIntro: Record<Locale, { title: string; body: string }> = {
  en: {
    title: "Quality evidence you can verify, not slogans",
    body: "Our quality management system is certified to ISO 9001:2015 (valid to Aug 2029), our raw-white PVA water-soluble yarn is OEKO-TEX Standard 100 certified at Product Class I — the baby-articles grade (valid to Jan 2027) — with the underlying TESTEX report published, and the company holds 34 granted Chinese patents plus registered patents in Nigeria and Malta. Review the documents below and verify certificate numbers with the issuing bodies before contracting.",
  },
  zh: {
    title: "可查验的质量证据，而非口号",
    body: "公司质量管理体系通过 ISO 9001:2015 认证（有效期至 2029 年 8 月），原白色水溶性 PVA 纱线取得 OEKO-TEX Standard 100 I 类（婴幼儿级）认证（有效期至 2027 年 1 月）并公开完整 TESTEX 检测报告，同时拥有 34 件中国授权专利及尼日利亚、马耳他专利。您可以在下方查看相应证书与报告，并在签约前向发证机构核实证书编号。",
  },
  es: {
    title: "Evidencia de calidad verificable, no eslóganes",
    body: "Nuestro sistema de gestión de la calidad está certificado conforme a ISO 9001:2015 (válido hasta agosto de 2029); el hilo de PVA hidrosoluble en blanco crudo está certificado según OEKO-TEX Standard 100 en Clase I —el grado para artículos de bebé— (válido hasta enero de 2027), con el informe TESTEX subyacente publicado, y la empresa cuenta con 34 patentes chinas concedidas además de patentes registradas en Nigeria y Malta. Revise los documentos siguientes y verifique los números de certificado con los organismos emisores antes de contratar.",
  },
  de: {
    title: "Überprüfbare Qualitätsnachweise, keine Schlagzeilen",
    body: "Unser Qualitätsmanagementsystem ist nach ISO 9001:2015 zertifiziert (gültig bis Aug 2029); unser rohweißes wasserlösliches PVA-Garn ist nach OEKO-TEX Standard 100 Produktklasse I zertifiziert — der Babyartikel-Klasse (gültig bis Jan 2027) — mit veröffentlichtem TESTEX-Bericht, und das Unternehmen hält 34 erteilte chinesische Patente sowie registrierte Patente in Nigeria und Malta. Prüfen Sie die folgenden Unterlagen und verifizieren Sie die Zertifikatsnummern vor Vertragsschluss bei den ausstellenden Stellen.",
  },
};

export const verificationNote: Record<Locale, string> = {
  en: "Certificate numbers, scopes and dates above are transcribed from the documents on file. Before contracting, verify them through the issuing bodies' official channels (CFC: bjsxfxh.com · OEKO-TEX: oeko-tex.com/en/faq · TESTEX: testex.com) and with our team. Current original certificates are available on request.",es: "Los números de certificado, alcances y fechas anteriores están transcritos de los documentos obrantes. Antes de contratar, verifíquelos a través de los canales oficiales de los organismos emisores (CFC: bjsxfxh.com · OEKO-TEX: oeko-tex.com/en/faq · TESTEX: testex.com) y con nuestro equipo. Los originales vigentes se facilitan a solicitud.",de: "Die oben genannten Zertifikatsnummern, Geltungsbereiche und Daten sind aus den vorliegenden Unterlagen transkribiert. Prüfen Sie sie vor Vertragsschluss über die offiziellen Kanäle der ausstellenden Stellen (CFC: bjsxfxh.com · OEKO-TEX: oeko-tex.com/en/faq · TESTEX: testex.com) und mit unserem Team. Aktuelle Originale sind auf Anfrage verfügbar.",
  zh: "以上证书编号、范围和日期均转录自现存文件。签约前请通过发证机构官方渠道（首信认证：bjsxfxh.com · OEKO-TEX：oeko-tex.com/en/faq · TESTEX：testex.com）及我们团队核实。如需最新原件，我们可另行提供。",
};
