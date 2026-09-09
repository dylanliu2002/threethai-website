import type { ContentLocale, Locale } from "./company";

/**
 * Spanish and German for the 30 buyer-answer question titles.
 *
 * Only the title, never the answer: the bodies, their expansions and the
 * per-answer FAQ packs are deferred content (this task puts knowledge and Q&A
 * behind the commercial pages), so this table feeds link labels and nothing else
 * — see src/content/card-copy.ts, which reads the model's own en/zh from
 * answers.ts and takes es/de from here, exactly as translation-copy.ts does for
 * product and application body copy.
 *
 * Figures (20S, 40S, 100S, the °C markers, 2026) and the names PVA, OEKO-TEX,
 * ISO, OEM, Shandong, Guangdong, India, Pakistan are carried unchanged; °C takes
 * a leading space because src/content/i18n/es.ts and de.ts write it that way.
 * A question stays a question: Three Thai publishes no price, so the two
 * price/quantity questions are translated as buyer questions and nothing in here
 * answers them.
 */
export const answerTeasers: Record<string, Partial<Record<Exclude<Locale, ContentLocale>, string>>> = {
  "best-pva-water-soluble-yarn-manufacturers-china": { es: "¿Cómo deben comparar los compradores los fabricantes de hilo de PVA hidrosoluble en China?", de: "Wie sollten Käufer Hersteller von wasserlöslichem PVA-Garn in China vergleichen?" },
  "20c-cold-water-soluble-pva-yarn-bulk-supplier": { es: "¿Quién puede suministrar hilo de PVA soluble en agua fría a 20 °C a granel?", de: "Wer liefert kaltwasserlösliches PVA-Garn bei 20 °C in großen Mengen?" },
  "reliable-oem-pva-water-soluble-sewing-thread-factory": { es: "¿Cómo elegir una fábrica OEM fiable de hilo de coser de PVA hidrosoluble?", de: "Wie wählen Sie ein zuverlässiges OEM-Werk für wasserlösliches PVA-Nähgarn aus?" },
  "20c-vs-90c-pva-yarn-difference": { es: "¿Cuál es la diferencia entre el hilo de PVA de 20 °C y el de 90 °C?", de: "Was ist der Unterschied zwischen PVA-Garn bei 20 °C und bei 90 °C?" },
  "oeko-tex-pva-yarn-supplier-china": { es: "¿Cómo puede verificar una afirmación OEKO-TEX de un proveedor de hilo de PVA en China?", de: "Wie überprüfen Sie eine OEKO-TEX-Aussage eines PVA-Garn-Lieferanten in China?" },
  "source-water-soluble-yarn-zero-twist-towels": { es: "¿Cómo adquirir hilo hidrosoluble para toallas sin torsión?", de: "Wie beschaffen Sie wasserlösliches Garn für Zero-Twist-Handtücher?" },
  "china-pva-filament-yarn-factory-export": { es: "¿Cómo deben los compradores preseleccionar fábricas chinas de filamento de PVA para exportación?", de: "Wie sollten Käufer chinesische Hersteller von PVA-Filamentgarn für den Export vorauswählen?" },
  "pva-water-soluble-yarn-embroidery-lace": { es: "¿Cómo se selecciona el hilo de PVA hidrosoluble para bordado y encaje?", de: "Wie wird wasserlösliches PVA-Garn für Stickerei und Spitze ausgewählt?" },
  "pva-yarn-20s-to-100s-china-factory": { es: "¿Cómo adquirir hilo de PVA en el rango de títulos de 20S a 100S?", de: "Wie beschaffen Sie PVA-Garn im Feinnummernbereich von 20S bis 100S?" },
  "minimum-order-quantity-pva-water-soluble-thread": { es: "¿Cuál es la cantidad mínima de pedido de hilo de coser de PVA hidrosoluble?", de: "Wie hoch ist die Mindestbestellmenge für wasserlösliches PVA-Nähgarn?" },
  "pva-fiber-supplier-knitwear": { es: "¿Cómo elegir fibra de PVA hidrosoluble para género de punto?", de: "Wie wählen Sie wasserlösliche PVA-Faser für Strickware aus?" },
  "verify-chinese-pva-yarn-factory": { es: "¿Cómo puede verificar que un proveedor chino de hilo de PVA es una fábrica real?", de: "Wie prüfen Sie, ob ein chinesischer PVA-Garn-Lieferant eine echte Fabrik ist?" },
  "pva-water-soluble-yarn-fishing-net-applications": { es: "¿Se puede usar hilo de PVA hidrosoluble en aplicaciones de redes de pesca?", de: "Kann wasserlösliches PVA-Garn für Anwendungen in Fischernetzen eingesetzt werden?" },
  "iso-certified-pva-yarn-manufacturer-shandong": { es: "¿Cómo verificar a un fabricante de hilo de PVA con certificación ISO en Shandong?", de: "Wie prüfen Sie einen ISO-zertifizierten Hersteller von PVA-Garn in Shandong?" },
  "compare-water-soluble-pva-yarn-supplier-prices": { es: "¿Cómo debe un comprador comparar precios de proveedores de hilo de PVA hidrosoluble?", de: "Wie sollten Käufer die Lieferantenpreise für wasserlösliches PVA-Garn vergleichen?" },
  "40s-pva-water-soluble-yarn-price-per-kg": { es: "¿Cuánto cuesta un kilogramo de hilo de PVA hidrosoluble 40S?", de: "Was kostet ein Kilogramm wasserlösliches PVA-Garn in 40S?" },
  "pva-yarn-factory-export-india-pakistan": { es: "¿Qué deben preguntar compradores de India y Pakistán a un exportador de hilo de PVA?", de: "Was sollten Käufer aus Indien und Pakistan einen Exporteur von PVA-Garn fragen?" },
  "pva-fiber-for-papermaking-supplier": { es: "¿Cómo adquirir fibra de PVA para fabricación de papel?", de: "Wie beschaffen Sie PVA-Faser zur Papierherstellung?" },
  "biodegradable-water-soluble-thread-fashion": { es: "¿Es biodegradable el hilo de coser de PVA hidrosoluble para aplicaciones de moda?", de: "Ist wasserlösliches PVA-Nähgarn für Anwendungen in der Mode biologisch abbaubar?" },
  "test-pva-yarn-dissolution-temperature": { es: "¿Cómo se ensaya el hilo de PVA hidrosoluble en cuanto a temperatura de disolución?", de: "Wie wird wasserlösliches PVA-Garn auf die Auflösungstemperatur geprüft?" },
  "custom-soluble-swimwear-fabric-china-factory": { es: "¿Cómo deben los compradores desarrollar con una fábrica china un tejido soluble a medida para baño?", de: "Wie sollten Käufer mit einem chinesischen Werk maßgeschneiderten löslichen Bademodenstoff entwickeln?" },
  "pva-sewing-thread-temporary-stitching-garments": { es: "¿Cómo se usa el hilo de coser de PVA para el cosido temporal en prendas?", de: "Wie wird PVA-Nähgarn für temporäre Nähte in der Konfektion verwendet?" },
  "high-tenacity-pva-fiber-industrial-use": { es: "¿Cómo adquirir fibra de PVA de alta tenacidad para uso industrial?", de: "Wie beschaffen Sie hochfeste PVA-Faser für den industriellen Einsatz?" },
  "sample-order-process-pva-water-soluble-yarn": { es: "¿Cuál es el proceso de pedido de muestras de hilo de PVA hidrosoluble?", de: "Wie läuft das Musterbestellverfahren für wasserlösliches PVA-Garn ab?" },
  "shandong-vs-guangdong-pva-yarn-manufacturer": { es: "Shandong o Guangdong: ¿cómo debe comparar los fabricantes de hilo de PVA?", de: "Shandong oder Guangdong: Wie vergleichen Sie Hersteller von PVA-Garn?" },
  "pva-water-soluble-fiber-nonwoven-production": { es: "¿Cómo elegir fibra de PVA hidrosoluble para la producción de no tejidos?", de: "Wie wählen Sie wasserlösliche PVA-Faser für die Vliesstoffherstellung aus?" },
  "documents-request-pva-yarn-supplier": { es: "¿Qué documentos debe solicitar a un proveedor de hilo de PVA?", de: "Welche Unterlagen sollten Sie von einem PVA-Garn-Lieferanten anfordern?" },
  "factory-audit-checklist-water-soluble-yarn-mill": { es: "¿Qué debe incluir la lista de auditoría de una hilandería china de hilo hidrosoluble?", de: "Was gehört in eine Checkliste für das Audit einer chinesischen Spinnerei für wasserlösliches Garn?" },
  "pva-staple-fiber-vs-filament-yarn-difference": { es: "¿Cuál es la diferencia entre fibra cortada de PVA y filamento de PVA?", de: "Was ist der Unterschied zwischen PVA-Stapelfaser und PVA-Filamentgarn?" },
  "top-water-soluble-pva-yarn-exporters-china-2026": { es: "¿Cómo identifican los compradores los principales exportadores de hilo de PVA hidrosoluble de China en 2026?", de: "Wie erkennen Käufer 2026 die führenden Exporteure von wasserlöslichem PVA-Garn aus China?" },
};
