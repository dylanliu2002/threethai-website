/**
 * Reviewed Spanish and German body copy for the entity detail pages this line
 * localizes: the four product pages and the five application pages.
 *
 * Why the copy lives here instead of inside `products.ts` / `applications.ts`:
 * a content field is `Record<ContentLocale, …>` — exactly `{ en, zh }` — and
 * that two-key shape is what `pageCopyFor` recognises as widen-able. Adding
 * `es`/`de` keys to the entity would make the field invisible to the renderer's
 * own completeness check, which is the fail-open INTL-DEES-002B closed. So the
 * entity stays the English/Chinese model and the localized text arrives through
 * the evidence record that also earns the URL its ownership: one reviewed
 * object, read twice (by `./availability` for the SEO claim and by
 * `pageCopyFor` for the bytes on the page).
 *
 * Every value mirrors the shape of the entity field it replaces, so the renderer
 * consumes it unchanged: `processGuide` and `faqs` stay lists of
 * `[heading, body]` / `[question, answer]` pairs, and an application's
 * `problem`, `whereUsed`, `whyTemporary` and `testing` stay `{ heading, body }`
 * objects.
 *
 * `src/content/translation-records.ts` builds the registry from this file and
 * fails the build if a field is missing here or present in only one locale, so
 * this store cannot silently fall behind the content model.
 */

export const productCopy = {
  "water-soluble-pva-yarn": {
    name: {
      es: "Hilo de PVA hidrosoluble",
      de: "Wasserlösliches PVA-Garn",
    },
    tagline: {
      es: "Three Thai fabrica hilo de PVA hidrosoluble para procesos textiles que requieren una resistencia temporal estable, seguida de una eliminación controlada en agua.",
      de: "Three Thai fertigt wasserlösliches PVA-Garn für textile Prozesse, die eine stabile temporäre Festigkeit und anschließend eine kontrollierte Entfernung im Wasser erfordern.",
    },
    imageAlt: {
      es: "Conos de hilo de PVA hidrosoluble producidos por Three Thai Textile",
      de: "Konen aus wasserlöslichem PVA-Garn, hergestellt von Three Thai Textile",
    },
    metaDescription: {
      es: "Fabricante de hilo de PVA hidrosoluble en China con opciones de disolución de baja a alta temperatura para tejeduría, punto y soporte textil temporal.",
      de: "Hersteller von wasserlöslichem PVA-Garn in China: Auflösungsoptionen von niedrig bis hoch für Weberei, Strickerei und temporäre textile Stützung.",
    },
    intro: {
      es: "Three Thai fabrica hilo de PVA hidrosoluble para procesos textiles que requieren una resistencia temporal estable, seguida de una eliminación controlada en agua.",
      de: "Three Thai fertigt wasserlösliches PVA-Garn für textile Prozesse, die eine stabile temporäre Festigkeit und anschließend eine kontrollierte Entfernung im Wasser erfordern.",
    },
    highlights: {
      es: [
        "Tejeduría compleja y tejidos calados",
        "Punto y soporte textil",
        "Procesos de encaje, toalla y bordado",
        "Refuerzo temporal durante el tratamiento en húmedo",
      ],
      de: [
        "Aufwendige Webverfahren und durchbrochene Gewebe",
        "Strickerei und textile Stützung",
        "Verfahren für Spitze, Handtücher und Stickerei",
        "Temporäre Verstärkung während der Nassbehandlung",
      ],
    },
    selection: {
      es: [
        "Título y estructura del hilo",
        "Resistencia a la rotura y elongación requeridas",
        "Temperatura objetivo del agua de disolución",
        "Tiempo de disolución, agitación y condiciones de acabado",
      ],
      de: [
        "Feinnummer und Garnkonstruktion",
        "Erforderliche Bruchfestigkeit und Dehnung",
        "Zieltemperatur des Auflösungswassers",
        "Auflösungszeit, mechanische Bewegung und Ausrüstungsbedingungen",
      ],
    },
    technicalOverview: {
      es: [
        "El hilo de PVA hidrosoluble actúa como un material temporal de proceso. Debe mantenerse estable durante el devanado, la tejeduría, el punto o el bordado y, a continuación, perder resistencia y abandonar la estructura durante un tratamiento controlado con agua. Por ello, una especificación útil combina la estructura del hilo con un método de disolución definido, en lugar de apoyarse solo en una indicación de temperatura.",
        "Three Thai desarrolla actualmente hilo de PVA en torno a objetivos de proceso de 20°C, 40°C, 55°C, 60°C, 70°C, 80°C y 90°C. La calidad adecuada depende del tiempo de exposición, del movimiento del baño, de la densidad del tejido, de los productos químicos y del punto final de eliminación aceptable. Confirmamos el título exacto y la gama de producción vigente después de revisar el proceso del comprador.",
      ],
      de: [
        "Wasserlösliches PVA-Garn wird als temporäres Prozessmaterial eingesetzt. Es muss das Spulen, Weben, Stricken oder Sticken stabil überstehen und anschließend während einer kontrollierten Wasserbehandlung an Festigkeit verlieren und die Struktur verlassen. Eine aussagekräftige Spezifikation verbindet daher die Garnkonstruktion mit einem definierten Auflösungsverfahren, statt sich allein auf eine Temperaturangabe zu stützen.",
        "Derzeit entwickelt Three Thai PVA-Garn für Prozessziele bei 20°C, 40°C, 55°C, 60°C, 70°C, 80°C und 90°C. Die geeignete Qualität hängt von Einwirkzeit, Flottenbewegung, Stoffdichte, Chemikalien und dem noch akzeptablen Endpunkt der Entfernung ab. Nach Prüfung des Prozesses des Käufers bestätigen wir die genaue Feinnummer und das aktuelle Produktionssortiment.",
      ],
    },
    processGuide: {
      es: [
        [
          "Definir la función temporal",
          "Indique en qué punto el hilo aporta soporte, la tensión que soporta y el momento de la producción en que debe eliminarse. Así se evita una calidad que se disuelve correctamente en el vaso de precipitados pero falla durante el procesamiento textil.",
        ],
        [
          "Establecer un método de eliminación repetible",
          "Registre la tolerancia de temperatura del agua, el tiempo de exposición, la proporción de baño, la agitación y si el punto final es el ablandamiento, la pérdida de resistencia o la eliminación visible completa.",
        ],
        [
          "Aprobar una muestra representativa de producción",
          "Ensaye la zona más densa o más difícil del tejido con los tintes, los auxiliares y la secuencia de acabado previstos. Vincule el resultado aprobado a una especificación de producto escrita.",
        ],
      ],
      de: [
        [
          "Die temporäre Funktion festlegen",
          "Erläutern Sie, an welcher Stelle das Garn Stützung bietet, welcher Spannung es ausgesetzt ist und zu welchem Zeitpunkt der Produktion es entfernt werden muss. So vermeiden Sie eine Qualität, die im Becherglas korrekt löst, aber bei der textilen Verarbeitung versagt.",
        ],
        [
          "Ein wiederholbares Entfernungsverfahren festlegen",
          "Protokollieren Sie Wassertemperatur-Toleranz, Einwirkzeit, Flottenverhältnis, mechanische Bewegung und ob der Endpunkt eine Erweichung, ein Festigkeitsverlust oder eine vollständig sichtbare Entfernung ist.",
        ],
        [
          "Ein produktionsrepräsentatives Muster freigeben",
          "Prüfen Sie den dichtesten oder schwierigsten Bereich des Gewebes mit den vorgesehenen Farbstoffen, Hilfsmitteln und der geplanten Ausrüstungsreihenfolge. Verknüpfen Sie das freigegebene Ergebnis mit einer schriftlichen Produktspezifikation.",
        ],
      ],
    },
    faqs: {
      es: [
        [
          "¿Se puede elegir el hilo solo por su temperatura de disolución?",
          "No. La temperatura es un punto de partida útil, pero el título del hilo, la torsión, la estructura del tejido, el movimiento del agua, el tiempo y la química de acabado pueden cambiar el resultado de eliminación observado.",
        ],
        [
          "¿Qué debe incluir una solicitud de muestras?",
          "Indique el sistema de títulos, la estructura de hilo simple o retorcido, la temperatura y el tiempo objetivo, el proceso textil, el volumen estimado del pedido y el destino de entrega.",
        ],
        [
          "¿Cómo deben compararse dos muestras de hilo de PVA?",
          "Utilice el mismo tamaño de probeta, volumen de baño, tolerancia de temperatura, agitación y definiciones del punto final, y registre después tanto la estabilidad durante el procesamiento como el comportamiento de eliminación.",
        ],
      ],
      de: [
        [
          "Lässt sich das Garn allein nach der Auflösungstemperatur auswählen?",
          "Nein. Die Temperatur ist ein sinnvoller Ausgangspunkt, doch Feinnummer, Drall, Gewebekonstruktion, Wasserbewegung, Zeitdauer und Ausrüstungschemie können das beobachtete Entfernungsergebnis verändern.",
        ],
        [
          "Was sollte eine Musteranfrage enthalten?",
          "Nennen Sie das Feinheitssystem, die Konstruktion aus Einfachgarn oder Zwirn, Zieltemperatur und Einwirkzeit, den textilen Prozess, das erwartete Auftragsvolumen und den Lieferbestimmungsort.",
        ],
        [
          "Wie vergleicht man zwei PVA-Garnmuster?",
          "Verwenden Sie identische Probengrößen, Flottenvolumen, Temperaturtoleranz, mechanische Bewegung und Endpunktdefinitionen und erfassen Sie anschließend sowohl die Stabilität während der Verarbeitung als auch das Entfernungsverhalten.",
        ],
      ],
    },
  },
  "water-soluble-pva-sewing-thread": {
    name: {
      es: "Hilo de coser de PVA hidrosoluble",
      de: "Wasserlösliches PVA-Nähgarn",
    },
    tagline: {
      es: "El hilo de coser de PVA hidrosoluble mantiene la integridad de la costura durante la producción y está concebido para eliminarse en condiciones definidas de acabado en húmedo.",
      de: "Wasserlösliches PVA-Nähgarn sichert während der Produktion die Nahtintegrität und ist für die Entfernung unter definierten Bedingungen der Nassausrüstung ausgelegt.",
    },
    imageAlt: {
      es: "Bobinas de hilo de coser de PVA hidrosoluble",
      de: "Garnpakete aus wasserlöslichem PVA-Nähgarn",
    },
    metaDescription: {
      es: "Hilo de coser de PVA hidrosoluble para costuras temporales, guías de bordado y confección, con eliminación controlada durante el acabado en húmedo.",
      de: "Wasserlösliches PVA-Nähgarn für temporäre Nähte, Stickereiunterlage und Konfektion mit kontrollierter Entfernung bei der Nassausrüstung.",
    },
    intro: {
      es: "El hilo de coser de PVA hidrosoluble mantiene la integridad de la costura durante la producción y está concebido para eliminarse en condiciones definidas de acabado en húmedo.",
      de: "Wasserlösliches PVA-Nähgarn sichert während der Produktion die Nahtintegrität und ist für die Entfernung unter definierten Bedingungen der Nassausrüstung ausgelegt.",
    },
    highlights: {
      es: [
        "Costuras temporales e hilvanado",
        "Posicionamiento y guías para bordado",
        "Confección y procesamiento textil",
        "Soporte de montaje que se elimina con agua",
      ],
      de: [
        "Temporäre Nähte und Heftnähte",
        "Positionierung und Führungen für Stickereien",
        "Konfektion und textile Verarbeitung",
        "Auswaschbare Montagestützung",
      ],
    },
    selection: {
      es: [
        "Título del hilo y número de cabos",
        "Velocidad de cosido y condiciones de la aguja",
        "Resistencia temporal de la costura",
        "Temperatura y ciclo objetivo de eliminación",
      ],
      de: [
        "Feinnummer und Zahl der Einzelfäden",
        "Nähgeschwindigkeit und Nadelbedingungen",
        "Temporäre Nahtfestigkeit",
        "Zieltemperatur und Zyklus für die Entfernung",
      ],
    },
    technicalOverview: {
      es: [
        "El hilo de coser de PVA se selecciona para costuras temporales, posicionamiento y operaciones de montaje que requieren una puntada fiable durante la producción, pero que no deben dejar hilo permanente en el artículo terminado. El hilo ha de equilibrar el comportamiento con la aguja, la formación de la puntada y la resistencia temporal de la costura con un ciclo de eliminación compatible con la prenda, el bordado o la estructura textil.",
        "Una demostración con hilo suelto no reproduce las condiciones reales de cosido. La densidad de puntada, el tipo de costura, el calor de la aguja, la velocidad de la máquina, el formato del embobado y los materiales circundantes influyen en el resultado. Revisamos esas condiciones antes de proponer una muestra y recomendamos ensayar la estructura cosida completa a lo largo de la secuencia prevista de acabado en húmedo.",
      ],
      de: [
        "PVA-Nähgarn wird für temporäre Nähte sowie für Positionierungs- und Montageschritte ausgewählt, bei denen die Produktion einen zuverlässigen Stich verlangt, das Fertigteil aber keinen dauerhaften Faden enthalten soll. Der Faden muss Nadelverhalten, Maschenbildung und temporäre Nahtfestigkeit mit einem Entfernungszyklus in Einklang bringen, der zur Konfektion, zur Stickerei oder zur Textilstruktur passt.",
        "Eine Vorführung mit losem Faden bildet die tatsächlichen Nähbedingungen nicht ab. Stichdichte, Nahtart, Nadelerwärmung, Maschinengeschwindigkeit, Garnpaketformat und umgebende Materialien beeinflussen die Leistung. Wir prüfen diese Bedingungen, bevor wir ein Muster vorschlagen, und empfehlen, die komplette vernähte Konstruktion durch die vorgesehene Nassausrüstungsfolge zu testen.",
      ],
    },
    processGuide: {
      es: [
        [
          "Describir la operación de cosido",
          "Indique el tipo de máquina, la aguja, la puntada y la estructura de la costura, la velocidad de trabajo y el modo de fallo que debe evitarse durante la producción.",
        ],
        [
          "Definir la eliminación sin dañar el artículo",
          "Especifique la temperatura máxima segura del agua para el tejido, los tintes y los accesorios, junto con la duración del ciclo, la agitación y el estado de residuo exigido.",
        ],
        [
          "Fijar la especificación comercial",
          "Tras un ensayo satisfactorio, registre el título, el número de cabos, el acabado, el tamaño del embobado, el etiquetado, el método de ensayo y los criterios de aceptación, de modo que el pedido de producción siga la muestra aprobada.",
        ],
      ],
      de: [
        [
          "Den Nähvorgang beschreiben",
          "Nennen Sie Maschinentyp, Nadel, Stich- und Nahtkonstruktion, die gefahrene Geschwindigkeit sowie den Fehlermodus, der während der Produktion vermieden werden muss.",
        ],
        [
          "Die Entfernung ohne Beschädigung des Artikels definieren",
          "Legen Sie die maximal zulässige Wassertemperatur für Gewebe, Farbstoffe und Accessoires sowie Zykluszeit, mechanische Bewegung und den geforderten Restzustand fest.",
        ],
        [
          "Die kommerzielle Spezifikation fixieren",
          "Nach einem erfolgreichen Versuch sind Feinnummer, Zahl der Einzelfäden, Ausrüstung, Paketgröße, Etikettierung, Prüfverfahren und Abnahmekriterien festzuhalten, damit der Produktionsauftrag dem freigegebenen Muster folgt.",
        ],
      ],
    },
    faqs: {
      es: [
        [
          "¿El hilo de coser hidrosoluble es lo mismo que el soporte de bordar?",
          "No. El hilo forma puntadas, mientras que las láminas, los tejidos o los no tejidos aportan un soporte de mayor superficie. El material correcto depende de la función temporal y de la vía de eliminación.",
        ],
        [
          "¿Por qué puede romperse un hilo aunque su resultado de tracción sea aceptable?",
          "Las condiciones de la aguja, las guías, la tensión, la velocidad, el devanado del embobado y el diseño de la costura generan tensiones que un valor de tracción de laboratorio no reproduce.",
        ],
        [
          "¿Qué información se necesita para el embalaje OEM?",
          "Indique el tipo y el tamaño del embobado, el peso neto, el idioma de la etiqueta, los requisitos de la caja de cartón, la aprobación del arte y cualquier marca específica del destino.",
        ],
      ],
      de: [
        [
          "Ist wasserlösliches Nähgarn dasselbe wie eine Stickereiunterlage?",
          "Nein. Der Faden bildet Stiche, während Folien, Gewebe oder Vliesstoffe eine großflächigere Stützung bieten. Das passende Material hängt von der temporären Funktion und dem Entfernungsweg ab.",
        ],
        [
          "Warum kann ein Faden reißen, obwohl sein Festigkeitswert akzeptabel ist?",
          "Nadelbedingungen, Führungen, Spannung, Geschwindigkeit, Abrollverhalten des Garnpakets und Nahtgestaltung können Belastungen erzeugen, die ein Zugfestigkeitswert aus dem Labor nicht wiedergibt.",
        ],
        [
          "Welche Angaben sind für die OEM-Verpackung erforderlich?",
          "Bitte nennen Sie Pakettyp und Paketgröße, Nettogewicht, Sprache des Etiketts, Anforderungen an den Karton, die Grafikfreigabe sowie alle vom Bestimmungsort abhängigen Kennzeichnungen.",
        ],
      ],
    },
  },
  "pva-staple-fiber": {
    name: {
      es: "Fibra cortada de PVA",
      de: "PVA-Stapelfaser",
    },
    tagline: {
      es: "La fibra cortada de PVA se suministra en longitudes de corte para aplicaciones textiles, de no tejidos y técnicas seleccionadas que requieren dispersión o eliminación controlada.",
      de: "PVA-Stapelfaser wird in Schnittlängen für textile, Vliesstoff- und ausgewählte technische Anwendungen geliefert, bei denen Dispergierung oder kontrollierte Entfernung erforderlich ist.",
    },
    imageAlt: {
      es: "Fibra cortada de PVA suministrada en longitudes de corte",
      de: "PVA-Stapelfaser, geliefert in Schnittlängen",
    },
    metaDescription: {
      es: "Proveedor de fibra cortada de PVA para usos textiles, de no tejidos e industriales seleccionados, con selección de producto según proceso y rendimiento.",
      de: "Lieferant von PVA-Stapelfaser für textile, Vlies- und ausgewählte industrielle Anwendungen; Produktauswahl nach Prozess- und Leistungsanforderungen.",
    },
    intro: {
      es: "La fibra cortada de PVA se suministra en longitudes de corte para aplicaciones textiles, de no tejidos y técnicas seleccionadas que requieren dispersión o eliminación controlada.",
      de: "PVA-Stapelfaser wird in Schnittlängen für textile, Vliesstoff- und ausgewählte technische Anwendungen geliefert, bei denen Dispergierung oder kontrollierte Entfernung erforderlich ist.",
    },
    highlights: {
      es: [
        "Mezclas textiles y filatura",
        "Materiales no tejidos",
        "Sistemas de fibra temporales o sacrificables",
        "Usos seleccionados de refuerzo industrial",
      ],
      de: [
        "Textilmischungen und Spinnen",
        "Vliesstoffe",
        "Temporäre Fasersysteme und Systeme mit Opferfasern",
        "Ausgewählte Anwendungen zur industriellen Verstärkung",
      ],
    },
    selection: {
      es: [
        "Longitud y finura de la fibra",
        "Requisitos de dispersión",
        "Objetivos de resistencia y elongación",
        "Requisito de hidrosolubilidad o de retención",
      ],
      de: [
        "Faserlänge und Faserfeinheit",
        "Anforderungen an die Dispersion",
        "Zielwerte für Festigkeit und Dehnung",
        "Anforderung an Wasserlöslichkeit oder Verbleib",
      ],
    },
    technicalOverview: {
      es: [
        "La fibra cortada de PVA es una forma de material discontinua que se emplea cuando el proceso necesita mezcla, cardado, dispersión o formación de velos, y no un recorrido continuo de hilo. La longitud, la finura, el estado de la superficie y el comportamiento frente al agua influyen en la apertura, la distribución y el rendimiento posterior, por lo que el material debe ajustarse a los equipos y a la formulación reales.",
        "Three Thai suministra fibra cortada de PVA para usos textiles, de no tejidos, de fabricación de papel y otros procesos técnicos seleccionados. No presentamos ninguna calidad como universal. Revisamos la mezcla o pasta prevista, el agua de proceso, el historial térmico, los aditivos y la propiedad exigida al material terminado antes de confirmar las especificaciones vigentes y la disponibilidad de muestras.",
      ],
      de: [
        "Die PVA-Stapelfaser ist eine diskontinuierliche Materialform; sie wird eingesetzt, wenn der Prozess Mischen, Krempeln, Dispergieren oder Vliesbildung erfordert statt eines durchgehenden Garnwegs. Länge, Feinheit, Oberflächenbeschaffenheit und das Verhalten gegenüber Wasser beeinflussen das Öffnen der Faser, ihre Verteilung und die Ergebnisse in der weiteren Verarbeitung. Das Material sollte deshalb auf die tatsächliche Ausrüstung und die Rezeptur abgestimmt werden.",
        "Three Thai liefert PVA-Stapelfaser für textile Anwendungen, Vliesstoffe, Papierherstellung und weitere ausgewählte technische Prozesse. Wir präsentieren keine Qualität als universell einsetzbar. Wir prüfen die vorgesehene Mischung oder Faserstoffzusammensetzung, das Prozesswasser, die Temperaturhistorie, die Additive und die geforderte Eigenschaft des fertigen Materials, bevor aktuelle Spezifikationen und die Verfügbarkeit von Mustern bestätigt werden.",
      ],
    },
    processGuide: {
      es: [
        [
          "Partir del sistema de materiales",
          "Describa las demás fibras o materias primas, la proporción de mezcla, los aditivos, el pH y el orden en que los componentes entran en el proceso.",
        ],
        [
          "Evaluar la manipulación y la distribución",
          "Verifique la apertura, la alimentación, la dispersión, la floculación y la compatibilidad en condiciones de mezclado o formación representativas de la producción.",
        ],
        [
          "Medir la propiedad relevante del material terminado",
          "Apruebe la muestra según la propiedad textil, de no tejido o de papel que sea determinante en la aplicación, y no solo por el aspecto de la fibra suelta.",
        ],
      ],
      de: [
        [
          "Beim Materialsystem ansetzen",
          "Beschreiben Sie die übrigen Fasern oder Rohstoffe, das Mischungsverhältnis, die Additive, den pH-Wert und die Reihenfolge, in der die Komponenten in den Prozess gelangen.",
        ],
        [
          "Handhabung und Verteilung bewerten",
          "Prüfen Sie das Öffnen, die Zuführung, die Dispersion, die Flockung und die Verträglichkeit unter Bedingungen, die der realen Mischung oder Vliesbildung entsprechen.",
        ],
        [
          "Die relevante Eigenschaft des fertigen Materials messen",
          "Geben Sie das Muster anhand der textilen, der Vliesstoff- oder der Papiereigenschaft frei, die für die Anwendung ausschlaggebend ist, und nicht allein nach dem Aussehen der losen Faser.",
        ],
      ],
    },
    faqs: {
      es: [
        [
          "¿Qué dimensiones deben especificarse?",
          "Indique la longitud de la fibra, la finura y su tolerancia, junto con los requisitos de superficie, humedad, embalaje o dispergabilidad que correspondan al proceso.",
        ],
        [
          "¿Se puede elegir una fibra a partir de una foto del catálogo?",
          "No. Fibras de aspecto similar pueden comportarse de manera distinta durante la apertura, la dispersión y el procesamiento en húmedo. Es necesario un ensayo de aplicación controlado.",
        ],
        [
          "¿Suministran fibra de PVA para hormigón?",
          "No. La fibra de PVA para hormigón no forma parte de nuestra oferta actual de productos. Nuestro enfoque actual son los procesos textiles, de no tejidos, de fabricación de papel y otros procesos técnicos seleccionados compatibles.",
        ],
      ],
      de: [
        [
          "Welche Abmessungen sollten spezifiziert werden?",
          "Nennen Sie Faserlänge, Feinheit und Toleranz sowie alle Oberflächen-, Feuchte-, Verpackungs- oder Dispergierbarkeitsanforderungen, die für den Prozess relevant sind.",
        ],
        [
          "Lässt sich eine Faser anhand eines Katalogfotos auswählen?",
          "Nein. Optisch ähnliche Fasern können sich beim Öffnen, bei der Dispersion und bei der Nassverarbeitung unterschiedlich verhalten. Ein kontrollierter Anwendungsversuch ist erforderlich.",
        ],
        [
          "Liefern Sie PVA-Fasern für Beton?",
          "Nein. PVA-Fasern für Beton gehören nicht zu unserem derzeitigen Produktangebot. Unser aktueller Schwerpunkt sind textile Anwendungen, Vliesstoffe, Papierherstellung sowie ausgewählte kompatible technische Prozesse.",
        ],
      ],
    },
  },
  "pva-filament-yarn": {
    name: {
      es: "Hilo de filamento continuo de PVA",
      de: "PVA-Filamentgarn",
    },
    tagline: {
      es: "El filamento continuo de PVA ofrece una construcción constante y se ajusta a los procesos de textil técnico o composites según resistencia, elongación y perfil de disolución.",
      de: "Kontinuierliches PVA-Filamentgarn bietet eine gleichmäßige Konstruktion und wird nach Festigkeit, Dehnung und Auflösungsprofil auf technische Textil- oder Verbundwerkstoffprozesse abgestimmt.",
    },
    imageAlt: {
      es: "Embobado de filamento continuo de PVA",
      de: "Garnpaket aus kontinuierlichem PVA-Filamentgarn",
    },
    metaDescription: {
      es: "Fabricante de filamento continuo de PVA para textiles técnicos, procesado de composites y aplicaciones con disolución controlada en agua.",
      de: "Hersteller von PVA-Filamentgarn: kontinuierlicher Faden für Technische Textilien, Verbundwerkstoff-Verarbeitung und kontrolliert wasserlösliche Anwendungen.",
    },
    intro: {
      es: "El filamento continuo de PVA ofrece una construcción constante y se ajusta a los procesos de textil técnico o composites según resistencia, elongación y perfil de disolución.",
      de: "Kontinuierliches PVA-Filamentgarn bietet eine gleichmäßige Konstruktion und wird nach Festigkeit, Dehnung und Auflösungsprofil auf technische Textil- oder Verbundwerkstoffprozesse abgestimmt.",
    },
    highlights: {
      es: [
        "Procesado de textiles técnicos",
        "Canales para composites y estructuras temporales",
        "Hilo de soporte continuo",
        "Aplicaciones especializadas de tejeduría",
      ],
      de: [
        "Verarbeitung Technischer Textilien",
        "Kanäle in Verbundwerkstoffen und temporäre Strukturen",
        "Kontinuierliches Stützgarn",
        "Spezialisierte Webanwendungen",
      ],
    },
    selection: {
      es: [
        "Estructura del filamento",
        "Resistencia y elongación",
        "Tensión de procesamiento",
        "Perfil de disolución objetivo",
      ],
      de: [
        "Filamentkonstruktion",
        "Festigkeit und Dehnung",
        "Verarbeitungsspannung",
        "Zielwert des Auflösungsprofiles",
      ],
    },
    technicalOverview: {
      es: [
        "El filamento continuo de PVA proporciona un recorrido de material ininterrumpido para procesos que necesitan una resistencia lineal controlada, una tensión constante o un elemento continuo eliminable. El número de filamentos y la estructura del filamento influyen en la manipulabilidad, mientras que la resistencia, la elongación, el estado de la superficie y el comportamiento frente al agua deben considerarse conjuntamente en función del proceso textil o técnico previsto.",
        "La selección comienza por el equipo y la función, y no por un nombre genérico de producto. Un mismo filamento puede comportarse de forma distinta como hilo de soporte, como componente tejido o como canal temporal, porque cambian la tensión, las superficies de contacto, los materiales circundantes y las condiciones del tratamiento en húmedo. Three Thai revisa este contexto de proceso antes de confirmar una especificación de muestra.",
      ],
      de: [
        "PVA-Filamentgarn stellt einen durchgehenden Materialpfad für Prozesse bereit, die eine kontrollierte lineare Festigkeit, eine gleichmäßige Spannung oder ein entfernbares kontinuierliches Element benötigen. Filamentenzahl und Konstruktion beeinflussen die Handhabung; Festigkeit, Dehnung, Oberflächenbeschaffenheit und das Verhalten gegenüber Wasser müssen für den vorgesehenen textilen oder technischen Prozess gemeinsam betrachtet werden.",
        "Die Auswahl beginnt bei der Ausrüstung und bei der Funktion statt bei einem allgemeinen Produktnamen. Dasselbe Filament kann sich als Stützgarn, als Gewebekomponente oder als temporärer Kanal unterschiedlich verhalten, weil sich Spannung, Kontaktflächen, umgebende Materialien und Bedingungen der Nassbehandlung ändern. Three Thai prüft diesen Prozesskontext, bevor eine Spezifikation für das Muster bestätigt wird.",
      ],
    },
    processGuide: {
      es: [
        [
          "Describir el recorrido del filamento",
          "Indique el formato del embobado, las guías, las superficies de contacto, la velocidad de marcha, la tensión de trabajo y los puntos donde es más probable la abrasión o la rotura.",
        ],
        [
          "Definir la ventana de servicio exigida",
          "Indique qué etapas en seco o en húmedo debe soportar el filamento y en qué condiciones exactas debe ablandarse, perder resistencia o eliminarse.",
        ],
        [
          "Escalar a partir de ensayos controlados",
          "Comience con una muestra trazable, ensáyela en un equipo representativo y registre los resultados de procesamiento y de eliminación antes de confirmar la cantidad de producción.",
        ],
      ],
      de: [
        [
          "Den Filamentweg erfassen",
          "Nennen Sie Garnpaketformat, Führungen, Kontaktflächen, Laufgeschwindigkeit, Arbeitsspannung und die Stellen, an denen Abrieb oder Fadenbruch am wahrscheinlichsten ist.",
        ],
        [
          "Den erforderlichen Einsatzbereich festlegen",
          "Geben Sie an, welche Trocken- oder Nassstufen das Filament überstehen muss und unter welchen genauen Bedingungen es erweichen, an Festigkeit verlieren oder entfernt werden soll.",
        ],
        [
          "Aus kontrollierten Versuchen hochskalieren",
          "Beginnen Sie mit einem rückverfolgbaren Muster, prüfen Sie es auf repräsentativen Anlagen und dokumentieren Sie die Ergebnisse von Verarbeitung und Entfernung, bevor die Produktionsmenge bestätigt wird.",
        ],
      ],
    },
    faqs: {
      es: [
        [
          "¿En qué se diferencia el filamento de la fibra cortada?",
          "El filamento es continuo y permite un procesamiento lineal controlado; la fibra cortada es discontinua y se elige para vías basadas en mezcla, formación o dispersión.",
        ],
        [
          "¿Qué valores importan además del denier o del dtex?",
          "Estructura, número de filamentos, resistencia, elongación, embobado, estado de la superficie, tensión de marcha y método de disolución influyen en la idoneidad.",
        ],
        [
          "¿Se puede usar la misma calidad en todos los textiles técnicos?",
          "No. El equipo, la tensión, la química, la temperatura y la función del material temporal deben validarse para cada aplicación.",
        ],
      ],
      de: [
        [
          "Wodurch unterscheidet sich Filament von Stapelfaser?",
          "Das Filament ist kontinuierlich und ermöglicht eine kontrollierte lineare Verarbeitung; die Stapelfaser ist diskontinuierlich und wird für Verfahrenswege gewählt, die auf Mischen, Vliesbildung oder Dispersion beruhen.",
        ],
        [
          "Welche Werte sind außer Denier oder dtex relevant?",
          "Konstruktion, Filamentenzahl, Festigkeit, Dehnung, Garnpaket, Oberflächenbeschaffenheit, Laufspannung und Auflösungsverfahren beeinflussen die Eignung.",
        ],
        [
          "Kann dieselbe Qualität in jedem Technischen Textil verwendet werden?",
          "Nein. Ausrüstung, Spannung, Chemie, Temperatur und die Funktion des temporären Materials müssen für jede Anwendung validiert werden.",
        ],
      ],
    },
  },
} as const;

export const applicationCopy = {
  "towel-weaving": {
    name: {
      es: "Fabricación de toallas y tejido sin torsión",
      de: "Handtuchweberei & Zero-Twist",
    },
    summary: {
      es: "El hilo de PVA temporal sostiene el pelo de la toalla y las estructuras sin torsión durante el tejido y se elimina por completo en el acabado, de modo que la toalla conserva su mullidez y absorción.",
      de: "Temporäres PVA-Garn stützt Flor und Zero-Twist-Konstruktionen beim Weben und wird in der Ausrüstung vollständig entfernt, damit das Handtuch Volumen und Saugfähigkeit behält.",
    },
    imageAlt: {
      es: "Hilo de PVA hidrosoluble usado como soporte temporal en la fabricación de toallas",
      de: "Wasserlösliches PVA-Garn als temporäre Unterstützung in der Handtuchweberei",
    },
    problem: {
      es: {
        heading: "El problema de producción",
        body: "Las toallas sin torsión y de baja torsión no pueden retener sus hilos de pelo en el telar sin soporte. Tejer una estructura sin soporte rompe hilos, daña la cara del tejido y ralentiza el telar, mientras que cualquier hilo de soporte permanente endurecería la toalla y reduciría la absorción.",
      },
      de: {
        heading: "Das Produktionsproblem",
        body: "Zero-Twist-Handtücher und Handtücher mit geringer Verdrehung können ihre Florgarne auf dem Webstuhl ohne Unterstützung nicht halten. Wird eine ungestützte Konstruktion verwoben, reißen Garne, die Gewebefläche nimmt Schaden und der Webstuhl wird langsamer, doch jedes dauerhafte Stützgarn würde das Handtuch versteifen und die Saugfähigkeit verringern.",
      },
    },
    whereUsed: {
      es: {
        heading: "Dónde interviene el PVA en el proceso",
        body: "El hilo de PVA hidrosoluble se devana y se teje junto con el hilo de pelo o el hilo de base como elemento de soporte temporal. Soporta la tensión durante el tejido, la formación de rizo y los procesos en húmedo, y después se disuelve en el baño de acabado, de modo que solo queda la estructura de algodón.",
      },
      de: {
        heading: "Wo PVA im Prozess zum Einsatz kommt",
        body: "Das wasserlösliche PVA-Garn wird zusammen mit dem Florgarn oder dem Grundgarn als temporäres Stützelement geschärzt und eingewoben. Es trägt die Spannung beim Weben, bei der Frottierbildung und bei der Nassverarbeitung und wird anschließend im Ausrüstungsbad aufgelöst, sodass nur die Baumwollkonstruktion übrig bleibt.",
      },
    },
    whyTemporary: {
      es: {
        heading: "Por qué se requiere un material temporal",
        body: "La función de soporte solo debe existir hasta que la estructura de la toalla sea estable. Después del acabado, el material de soporte residual perjudicaría el tacto, la mullidez y la absorción de agua, por lo que el hilo debe abandonar el tejido de forma limpia en condiciones que el algodón pueda tolerar.",
      },
      de: {
        heading: "Warum ein temporäres Material",
        body: "Die Stützfunktion muss nur so lange bestehen, bis die Handtuchkonstruktion stabil ist. Nach der Ausrüstung würde verbliebenes Stützmaterial Griff, Volumen und Wasseraufnahme beeinträchtigen, deshalb muss das Garn den Stoff unter Bedingungen sauber verlassen, die die Baumwolle aushält.",
      },
    },
    selectionVariables: {
      es: [
        "Título del hilo de soporte en relación con el hilo de pelo de algodón",
        "Tensión de tejido y densidad de la estructura del tejido",
        "Temperatura del agua, tiempo y agitación disponibles en el acabado",
        "Punto final requerido: pérdida de resistencia o eliminación completa",
        "Criterios de aceptación para PVA residual, mullidez y absorción después del lavado",
      ],
      de: [
        "Stützgarnnummer im Verhältnis zum Baumwoll-Florgarn",
        "Webspannung und Konstruktionsdichte des Gewebes",
        "Verfügbare Wassertemperatur, Zeit und Bewegung bei der Ausrüstung",
        "Erforderlicher Endpunkt: Festigkeitsverlust oder vollständige Entfernung",
        "Akzeptanzkriterien für PVA-Rückstände, Volumen und Saugfähigkeit nach der Wäsche",
      ],
    },
    testing: {
      es: {
        heading: "Consideraciones para el ensayo",
        body: "Ensaye la estructura de toalla más densa con la receta de acabado real antes de aprobar un grado. Evalúe tras la eliminación el material residual, la mullidez, la absorción, el tacto y la estabilidad dimensional, y registre las condiciones del baño que produjeron el resultado aprobado.",
      },
      de: {
        heading: "Hinweise zur Prüfung",
        body: "Testen Sie die dichteste Handtuchkonstruktion mit der tatsächlichen Ausrüstungsrezeptur, bevor Sie eine Sorte freigeben. Bewerten Sie nach der Entfernung Materialreste, Volumen, Saugfähigkeit, Griff und Maßhaltigkeit und dokumentieren Sie die Badbedingungen, die zum freigegebenen Ergebnis geführt haben.",
      },
    },
  },
  "embroidery-sewing": {
    name: {
      es: "Bordado y costura",
      de: "Stickerei & Näherei",
    },
    summary: {
      es: "El hilo de PVA hidrosoluble y el hilo de coser mantienen en su lugar costuras, hilos guía y estructuras cosidas temporales y, después, se eliminan limpiamente en el lavado sin afectar al artículo terminado.",
      de: "Wasserlösliches PVA-Garn und Nähgarn halten temporäre Nähte, Führungsfäden und Nähkonstruktionen an ihrem Platz und werden anschließend im Waschgang rückstandsfrei entfernt, ohne das fertige Teil zu beeinträchtigen.",
    },
    imageAlt: {
      es: "Hilo de coser de PVA hidrosoluble para costuras temporales",
      de: "Wasserlösliches PVA-Nähgarn für temporäre Nähte",
    },
    problem: {
      es: {
        heading: "El problema de producción",
        body: "El encaje bordado, la confección de prendas y las operaciones de posicionamiento requieren puntadas que aguanten con fiabilidad toda la producción, pero que no deben quedar en el artículo terminado. Las roturas de hilo detienen las máquinas; los hilos permanentes exigen una retirada manual que daña el producto.",
      },
      de: {
        heading: "Das Produktionsproblem",
        body: "Bordurspitze, Konfektion und Fixierarbeiten brauchen Nähte, die durch die gesamte Produktion zuverlässig halten, im fertigen Teil aber nicht verbleiben dürfen. Reißende Fäden stillen die Maschinen; dauerhafte Fäden erfordern ein manuelles Entfernen, das das Produkt beschädigt.",
      },
    },
    whereUsed: {
      es: {
        heading: "Dónde interviene el PVA en el proceso",
        body: "El hilo de coser de PVA forma la propia costura temporal, mientras que el hilo hidrosoluble puede actuar como guía o elemento de soporte en estructuras de bordado y encaje. Ambos se mantienen en su lugar durante el cosido, el corte y la manipulación, y después se disuelven durante el ciclo de acabado en húmedo.",
      },
      de: {
        heading: "Wo PVA im Prozess zum Einsatz kommt",
        body: "Das PVA-Nähgarn bildet die temporäre Naht selbst, während das wasserlösliche Garn in Stickerei- und Spitzenkonstruktionen als Führung oder Stützelement dienen kann. Beide bleiben beim Nähen, Zuschneiden und Handhaben an ihrem Platz und lösen sich danach im Waschgang der Ausrüstung auf.",
      },
    },
    whyTemporary: {
      es: {
        heading: "Por qué se requiere un material temporal",
        body: "La puntada o el hilo guía han terminado su función una vez completada la confección o el bordado. La eliminación debe producirse a la temperatura segura de la prenda terminada, sin que se vean afectados el teñido, los accesorios ni los hilos decorativos.",
      },
      de: {
        heading: "Warum ein temporäres Material",
        body: "Die Naht oder der Führungsfaden hat ihre Aufgabe erfüllt, sobald Konfektion oder Stickerei abgeschlossen sind. Das Entfernen muss bei der sicheren Temperatur des fertigen Kleidungsstücks erfolgen, ohne dass Färbung, Accessoires oder Dekorgarne beeinflusst werden.",
      },
    },
    selectionVariables: {
      es: [
        "Título y número de cabos del hilo para la operación de costura",
        "Tipo de máquina, aguja, puntada y tipo de costura",
        "Velocidad de trabajo y exposición al calor de la aguja",
        "Temperatura máxima segura del agua para el tejido, los tintes y los accesorios",
        "Punto final requerido: pérdida de resistencia de la costura o eliminación completa",
      ],
      de: [
        "Garnnummer und Zahl der Fäden für den Nähvorgang",
        "Maschinentyp, Nadel, Stich und Nahtkonstruktion",
        "Nähgeschwindigkeit und Belastung durch Nadelhitze",
        "Maximale sichere Wassertemperatur für Gewebe, Farbstoffe und Accessoires",
        "Erforderlicher Endpunkt: Verlust der Nahtfestigkeit oder vollständige Entfernung",
      ],
    },
    testing: {
      es: {
        heading: "Consideraciones para el ensayo",
        body: "Una demostración con una hebra suelta no reproduce las condiciones reales de costura. Pruebe el hilo en la máquina y la costura previstas y haga pasar después la construcción cosida completa por el ciclo real de acabado, comprobando el calor de la aguja, la tensión, las roturas y la limpieza de la eliminación.",
      },
      de: {
        heading: "Hinweise zur Prüfung",
        body: "Eine Demonstration mit losem Faden bildet die Nähbedingungen nicht ab. Nähen Sie den Faden auf der vorgesehenen Maschine und Naht und führen Sie die komplette Nahtkonstruktion anschließend durch den tatsächlichen Ausrüstungszyklus, wobei Sie Nadelhitze, Spannung, Fadenbrüche und die Sauberkeit der Entfernung prüfen.",
      },
    },
  },
  "knitting": {
    name: {
      es: "Tricotado y prendas de punto",
      de: "Maschenware & Strickkonfektion",
    },
    summary: {
      es: "El hilo y la fibra de PVA aportan soporte temporal y una estructura de fácil eliminación en los tejidos de punto y en las rutas de hilatura para punto, y protegen el tacto final de la prenda.",
      de: "PVA-Garn und Faser bieten temporäre Stütze und eine leicht zu entfernende Struktur in Maschenwaren und den Spinnrouten für Strickgarne und schützen den endgültigen Griff des Kleidungsstücks.",
    },
    imageAlt: {
      es: "Hilo de PVA preparado para aplicaciones de soporte en tejido de punto",
      de: "PVA-Garn für Stützanwendungen in der Maschenwarenherstellung",
    },
    problem: {
      es: {
        heading: "El problema de producción",
        body: "Las estructuras de punto y los hilos fantasía pueden necesitar un elemento de soporte durante la hilatura, el platinado o el tejido de punto que debe desaparecer antes de que la prenda se lleve puesta. El calor o la química agresiva no siempre son posibles porque las fibras circundantes son sensibles.",
      },
      de: {
        heading: "Das Produktionsproblem",
        body: "Maschenkonstruktionen und Effektgarne benötigen beim Spinnen, Plattieren oder Verarbeiten zu Maschenware ein Stützelement, das vor dem Tragen des Kleidungsstücks wieder verschwunden sein muss. Hitze oder aggressive Chemie sind nicht immer möglich, weil die umgebenden Fasern empfindlich sind.",
      },
    },
    whereUsed: {
      es: {
        heading: "Dónde interviene el PVA en el proceso",
        body: "Según la ruta, el PVA entra como hilo de platinado o de soporte, como componente de la mezcla en la hilatura o como fibra cortada en la mezcla. Estabiliza la estructura durante la preparación y el tejido de punto y después se disuelve en un ciclo de lavado suave.",
      },
      de: {
        heading: "Wo PVA im Prozess zum Einsatz kommt",
        body: "Je nach Route wird PVA als Plattier- oder Stützgarn, als Mischungsbestandteil in der Spinnerei oder als Stapelfaser im Gemisch eingebracht. Es stabilisiert die Konstruktion während der Vorbereitung und der Maschenbildung und löst sich anschließend in einem schonenden Waschzyklus auf.",
      },
    },
    whyTemporary: {
      es: {
        heading: "Por qué se requiere un material temporal",
        body: "El soporte solo se necesita mientras el punto es frágil. Una vez que el tejido es estable, cualquier material restante cambiaría el tacto, la estructura y la contracción, por lo que suele preferirse una ruta de eliminación a baja temperatura.",
      },
      de: {
        heading: "Warum ein temporäres Material",
        body: "Die Stütze wird nur gebraucht, solange die Maschenware empfindlich ist. Sobald der Stoff stabil ist, würde verbliebenes Material Griff, Struktur und Einlaufen verändern, weshalb ein Entfernen bei niedriger Temperatur meist bevorzugt wird.",
      },
    },
    selectionVariables: {
      es: [
        "Forma del material: hilo de soporte, hilo de platinado o fibra cortada en la mezcla",
        "Longitud y finura de la fibra cuando se mezcla",
        "Proceso de tejido de punto, tensión y compatibilidad con la máquina",
        "Requisito de disolución a baja temperatura",
        "Criterios del tejido final: tacto, estructura, contracción y residuos",
      ],
      de: [
        "Materialform: Stützgarn, Plattiergarn oder beigemischte Stapelfaser",
        "Faserlänge und Feinheit bei Zumischung",
        "Strickprozess, Spannung und Kompatibilität mit der Maschine",
        "Anforderung an die Auflösung bei niedriger Temperatur",
        "Kriterien für das fertige Gewebe: Griff, Struktur, Einlaufen und Rückstände",
      ],
    },
    testing: {
      es: {
        heading: "Consideraciones para el ensayo",
        body: "Ensaye la mezcla real o la ruta de tejido de punto y evalúe después el tejido acabado en cuanto a tacto, estructura, contracción y residuos tras la eliminación. Compruebe que el ciclo de lavado se mantiene dentro de la temperatura que las fibras circundantes toleran.",
      },
      de: {
        heading: "Hinweise zur Prüfung",
        body: "Testen Sie die tatsächliche Mischung oder die tatsächliche Strickroute und bewerten Sie anschließend das fertige Gewebe nach der Entfernung auf Griff, Struktur, Einlaufen und Rückstände. Stellen Sie sicher, dass der Waschzyklus innerhalb der Temperatur bleibt, die die umgebenden Fasern vertragen.",
      },
    },
  },
  "papermaking": {
    name: {
      es: "Fabricación de papel",
      de: "Papierherstellung",
    },
    summary: {
      es: "Las fibras de PVA cortadas se adaptan a la fórmula de fibras, la dispersión y las propiedades objetivo del papel — reforzando las hojas o formando poros de sacrificio que se disuelven después del procesamiento.",
      de: "Geschnittene PVA-Fasern werden auf Faserstoffgemisch, Dispergierung und die gewünschten Papiereigenschaften abgestimmt — sie festigen die Bahn oder bilden Opferporen, die sich nach der Verarbeitung auflösen.",
    },
    imageAlt: {
      es: "Fibra de PVA cortada para la fórmula de fibras de la fabricación de papel",
      de: "Geschnittene PVA-Faser für das Faserstoffgemisch in der Papierherstellung",
    },
    problem: {
      es: {
        heading: "El problema de producción",
        body: "Las hojas de papel y los no tejidos especiales necesitan fibras de adición que se dispersen de forma uniforme en una fórmula de fibras en medio acuoso. Una dispersión deficiente provoca floculación y defectos en la hoja, y la fibra debe unirse de forma permanente o abandonar la hoja en una etapa definida.",
      },
      de: {
        heading: "Das Produktionsproblem",
        body: "Papier- und Spezialvliesbahnen brauchen Zusatzfasern, die sich im wässrigen Faserstoffgemisch gleichmäßig dispergieren. Eine schlechte Dispersion führt zu Flockbildung und Bahnfehlern, und die Faser muss sich entweder dauerhaft verbinden oder die Bahn in einem definierten Stadium verlassen.",
      },
    },
    whereUsed: {
      es: {
        heading: "Dónde interviene el PVA en el proceso",
        body: "La fibra cortada de PVA se dosifica en la fórmula de fibras junto con la mezcla de pasta. La longitud, la finura y el estado superficial controlan la apertura, la distribución y la unión; los grados hidrosolubles pueden disolverse después para crear porosidad o liberar una hoja estructurada.",
      },
      de: {
        heading: "Wo PVA im Prozess zum Einsatz kommt",
        body: "Die PVA-Stapelfaser wird zusammen mit der Zellstoffmischung in das Faserstoffgemisch dosiert. Länge, Feinheit und Oberflächenzustand steuern Öffnung, Verteilung und Verbindung; wasserlösliche Sorten können sich später auflösen, um Porosität zu erzeugen oder eine strukturierte Bahn freizusetzen.",
      },
    },
    whyTemporary: {
      es: {
        heading: "Por qué se requiere un material temporal",
        body: "Algunos grados deben permanecer y reforzar la hoja; otros existen para ser eliminados — dejando poros o liberando una capa durante el procesamiento. Lo que decide qué grado es adecuado es el comportamiento exigido frente al agua, no el nombre del producto.",
      },
      de: {
        heading: "Warum ein temporäres Material",
        body: "Einige Sorten müssen verbleiben und die Bahn festigen; andere werden nur eingesetzt, um entfernt zu werden — sie hinterlassen Poren oder setzen während der Verarbeitung eine Schicht frei. Welche Sorte passt, entscheidet das geforderte Wasserverhalten, nicht die Produktbezeichnung.",
      },
    },
    selectionVariables: {
      es: [
        "Longitud y finura de la fibra (p. ej. los formatos de 2 dtex de nuestro catálogo)",
        "Composición de la fórmula de fibras, aditivos, pH y condiciones del agua",
        "Comportamiento de dispersión y floculación en la secuencia de mezcla",
        "Requisito de hidrosolubilidad o de retención del grado",
        "Propiedad objetivo del papel y dosificación aprobada",
      ],
      de: [
        "Faserlänge und Feinheit (z. B. die in unserem Katalog verwendeten 2-dtex-Formate)",
        "Zusammensetzung des Faserstoffgemischs, Additive, pH-Wert und Wasserbedingungen",
        "Dispersions- und Flockbildungsverhalten in der Mischsequenz",
        "Anforderung an Wasserlöslichkeit oder Rückhaltung der Sorte",
        "Gewünschte Papiereigenschaft und freigegebene Dosierung",
      ],
    },
    testing: {
      es: {
        heading: "Consideraciones para el ensayo",
        body: "Evalúe la apertura, la distribución y la compatibilidad en unas condiciones de mezcla representativas de la producción, mida después la propiedad del papel que importa — resistencia, porosidad o liberación — y registre la dosificación aprobada y las condiciones del proceso.",
      },
      de: {
        heading: "Hinweise zur Prüfung",
        body: "Bewerten Sie Öffnung, Verteilung und Kompatibilität unter productionsnahen Mischbedingungen, messen Sie anschließend die relevante Papiereigenschaft — Festigkeit, Porosität oder Trennverhalten — und dokumentieren Sie die freigegebene Dosierung und die Prozessbedingungen.",
      },
    },
  },
  "technical-textiles": {
    name: {
      es: "Textiles técnicos y composites",
      de: "Technische Textilien und Verbundwerkstoffe",
    },
    summary: {
      es: "El filamento continuo de PVA forma canales temporales, estructuras de sacrificio y elementos de soporte en textiles técnicos, composites y tejidos especializados.",
      de: "Endloses PVA-Filament bildet temporäre Kanäle, Opferstrukturen und Stützelemente in technischen Textilien, Verbundwerkstoffen und spezialisierten Webwaren.",
    },
    imageAlt: {
      es: "Hilo de filamento continuo de PVA para el procesamiento de textiles técnicos",
      de: "Endloses PVA-Filamentgarn für die Verarbeitung technischer Textilien",
    },
    problem: {
      es: {
        heading: "El problema de producción",
        body: "Las construcciones técnicas suelen necesitar un componente que solo existe durante la fabricación: un canal que después se convierte en una cavidad, un refuerzo que soporta carga hasta que la matriz cura o un elemento continuo que debe sobrevivir al procesamiento sin dejar rastro en servicio.",
      },
      de: {
        heading: "Das Produktionsproblem",
        body: "Technische Konstruktionen brauchen häufig eine Komponente, die nur während der Herstellung existiert: einen Kanal, der später zum Hohlraum wird, eine Verstärkung, die Last trägt, bis die Matrix aushärtet, oder ein endloses Element, das die Verarbeitung überstehen muss, im Einsatz jedoch keine Spuren hinterlässt.",
      },
    },
    whereUsed: {
      es: {
        heading: "Dónde interviene el PVA en el proceso",
        body: "El hilo de filamento corre como elemento continuo por guías, dispositivos de tensión y equipos de colocación; la fibra cortada y los hilos pueden tejerse o conformarse en la estructura. Después del procesamiento, la disolución controlada elimina el PVA y deja la geometría diseñada.",
      },
      de: {
        heading: "Wo PVA im Prozess zum Einsatz kommt",
        body: "Das Filamentgarn läuft als endloses Element durch Führungen, Spannungselemente und Ablegeanlagen; Stapelfaser und Garne können eingewebt oder in die Struktur geformt werden. Nach der Verarbeitung entfernt die kontrollierte Auflösung das PVA und hinterlässt die ausgelegte Geometrie.",
      },
    },
    whyTemporary: {
      es: {
        heading: "Por qué se requiere un material temporal",
        body: "La función del componente termina cuando la estructura está conformada. Solo debe quedar el material del cliente, habiendo aportado el PVA resistencia o geometría durante la producción y habiéndose eliminado después en condiciones definidas.",
      },
      de: {
        heading: "Warum ein temporäres Material",
        body: "Die Aufgabe der Komponente endet mit dem Formen der Struktur. Übrig bleiben darf nur das Material des Kunden, wobei das PVA während der Herstellung Festigkeit oder Geometrie beigesteuert und anschließend unter definierten Bedingungen entfernt wurde.",
      },
    },
    selectionVariables: {
      es: [
        "Construcción del filamento, resistencia y elongación",
        "Tensión de procesamiento, guías y superficies de contacto",
        "Qué etapas en seco o en húmedo debe soportar el material",
        "Condiciones definidas de ablandamiento, pérdida de resistencia o eliminación",
        "Formato de bobina y comportamiento en marcha en el equipo",
      ],
      de: [
        "Filamentkonstruktion, Festigkeit und Dehnung",
        "Verarbeitungsspannung, Führungen und Kontaktflächen",
        "Welche Trocken- oder Nassstufen das Material überstehen muss",
        "Definierte Bedingungen für Erweichung, Festigkeitsverlust oder Entfernung",
        "Spulenformat und Laufverhalten auf der Anlage",
      ],
    },
    testing: {
      es: {
        heading: "Consideraciones para el ensayo",
        body: "Defina primero el recorrido del filamento y la ventana de servicio y ensaye después una muestra trazable en un equipo representativo. Registre por separado la estabilidad de procesamiento y los resultados de eliminación antes de confirmar cantidad alguna de producción.",
      },
      de: {
        heading: "Hinweise zur Prüfung",
        body: "Erfassen Sie zunächst den Filamentverlauf und das Einsatzfenster und testen Sie anschließend eine rückverfolgbare Probe auf repräsentativer Anlage. Dokumentieren Sie Verarbeitungsstabilität und Entfernungsergebnisse getrennt, bevor eine Produktionsmenge bestätigt wird.",
      },
    },
  },
} as const;
