export interface KnowledgeBaseSection {
  name: string;
  keywords: string[];
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeBaseSection[] = [
  {
    name: "VISUELLE AUSDAUER",
    keywords: [
      "Visus", "Ermüdung", "Ausdauer", "Ablenkung", "Abbruch",
      "Verweigerung", "motorische Unruhe", "Sehschärfe", "Konzentration"
    ],
    content: `Visus: Momentaufnahme unter guten Bedingungen.
Ermüdung und Ablenkungsstrategien: viel Sprechen, Quatsch machen, motorische Unruhe, Abbruchtendenzen, Verweigerung.`
  },
  {
    name: "BEIDÄUGIGES / EINÄUGIGES SEHEN",
    keywords: [
      "Binokularsehen", "beidäugig", "einäugig", "Schielen", "Tiefensehen",
      "Greifen", "Gesichtsfeld", "Stereopsis", "Strabismus", "monokular",
      "binokular", "räumlich", "Distanz"
    ],
    content: `Beidäugiges Sehen / Binokularsehen: Augen müssen parallel stehen und gleich gut sein. Wichtig für Tiefensehen in der Nähe, gezieltes Greifen.

Einäugiges Sehen: Nur ein Auge schaut, dadurch eingeschränktes Gesichtsfeld (ca. 1/3 des Gesichtsfeldes auf der anderen Seite fehlt). Menschen und Objekte von dieser Seite werden später wahrgenommen (wird oft durch Hören kompensiert).
Einäugigkeit im gesamten Alltag relevant: sehr junge Kinder nehmen Spielsachen nicht wahr, Dinge und Bezugspersonen "verschwinden" aus dem Blickfeld, mehr Kopfbewegungen nötig, später Vernachlässigung einer Körperseite, von Buchseiten oder Probleme beim Finden von Spielsachen, höherer Energieaufwand, beim Spielen draußen und im Straßenverkehr höhere Unfallgefahr.

Räumliche Wahrnehmung: Durch Erfahrungen erlernte räumliche Gegebenheiten, wichtig für die Ferne, bei Bewegungen, Distanzen, Höhen und Tiefen.
Bedeutung eingeschränkter Augenbeweglichkeit und fehlendes Binokularsehen bei Nystagmus, Lähmungen, Schielen.`
  },
  {
    name: "OKKLUSION",
    keywords: [
      "Okklusion", "Pflaster", "abkleben", "Abkleben", "Augenpflaster",
      "abgeklebt", "Verhaltenveränderung", "sehbehindert"
    ],
    content: `Kind schaut mit dem schlechteren Auge, unter Umständen für lange Zeit am Tag. Dadurch alle Nachteile der Einäugigkeit plus eingeschränktes Sehen.
Durch den Wechsel abgeklebt/nicht abgeklebt entsteht Unsicherheit, eventuell Vermeidung, Verhaltensveränderung: Kind mit Pflaster ist ein komplett anderes Kind als ohne Pflaster: spielt nicht mehr, eingeschränkte Sozialkontakte, fehlende visuelle Kommunikation.
Bei starken Unterschieden zwischen beiden Augen große Verunsicherung, starke Abwehr.
Genaue Prüfung, welchen Visus jedes Auge hat: ist das Kind sehbehindert/blind während der Okklusion?`
  },
  {
    name: "WECHSELSEITIGES SCHIELEN / KREUZFIXATION / DOPPELBILDER",
    keywords: [
      "Kreuzfixation", "Doppelbilder", "wechselseitig", "Schielen",
      "Nasenrücken", "Außenbewegung", "Energie", "Ermüden",
      "wechselnd", "alternierend"
    ],
    content: `Bei wechselndem Schielen schaut Kind nur mit einem Auge, durch ständigen Wechsel kein konstantes Sehen und starke räumliche Unsicherheit.
Durch den Wechsel sind kurzzeitig Doppelbilder möglich, weil das Gehirn nicht schnell genug umschalten kann.
Bei Kreuzfixation schaut das rechte Auge über den Nasenrücken nach links oder das linke Auge über den Nasenrücken nach rechts, weil die Augen keine Außenbewegung machen können; wirkt oft, als ob das Kind an etwas vorbei schaut; Kostet sehr viel Energie und führt zu schnellerem Ermüden und weniger Motivation.`
  },
  {
    name: "SEHVERARBEITUNG",
    keywords: [
      "Sehverarbeitung", "visuell", "komplex", "filtern", "Wimmelbuch",
      "Menschenansammlung", "Schwankungen", "Aufmerksamkeit", "crowding",
      "Reizüberflutung", "Materialien"
    ],
    content: `Unterschiede zwischen einfachen und komplexen Sehanforderungen.
Braucht lange, um visuelle Anforderungen zu erledigen, obwohl es die Aufgabe versteht; lenkt dabei sein Gegenüber ab.
Kann Einzelheiten nicht aus einer Menge herausfiltern: findet einzelne Personen nicht in Menschenansammlungen, Unsicherheit bei Ausflügen, will an der Hand laufen, hat Angst den Anschluss zu verlieren, findet Anziehsachen nicht wieder, sucht ständig nach Spielsachen, mag keine Wimmelbücher, findet auf einem unstrukturierten Arbeitsplatz seine Materialien nicht.
Es gibt scheinbar starke Schwankungen der Sehfähigkeit.`
  },
  {
    name: "KOPPELUNG VON SEHEN UND BEWEGUNG / SENSORISCHE INTEGRATION",
    keywords: [
      "Treppe", "Greifen", "Auge-Hand", "Koordination", "Bauen",
      "Schütten", "Türrahmen", "Möbel", "Treppenabsatz", "sensorisch",
      "Integration", "Gleichgewicht", "tasten"
    ],
    content: `Treppe laufen aufwärts und abwärts: mit/ohne Hilfe, Nachstellschritt/Wechselschritt.
Gezieltes Greifen: Dinge vom Tisch nehmen, Konstruktives Bauen, Schütten und jeweilige Probleme damit wie Glas umstoßen, danebengreifen.
Abstände einschätzen / Höhenunterschiede wahrnehmen: Innehalten bei Farbunterschieden auf Gehwegen, häufiges Stoßen an Türrahmen und Möbeln, Unsicherheit auf Treppenabsätzen.
Bei interessanten Geräuschen "ausschalten" des Sehsinns, Fokus aufs Hören.
Beim Treppenlaufen Ausschalten des Sehsinns: mit dem Fuß tasten.`
  },
  {
    name: "PROBLEME BEIM WECHSEL ZWISCHEN NÄHE UND FERNE",
    keywords: [
      "Akkommodation", "Naheinstellung", "Ferneinstellung", "Wechsel",
      "Nähe", "Ferne", "Tafel", "Fokus", "Umstellung"
    ],
    content: `Schwierigkeiten beim Umschalten der Sehschärfe zwischen nahen und fernen Objekten. Kind braucht länger, um nach dem Blick in die Ferne (z.B. Tafel) wieder scharf in der Nähe (z.B. Heft) zu sehen und umgekehrt. Kann zu Ermüdung und Vermeidung von Aufgaben führen, die häufigen Wechsel erfordern.`
  },
  {
    name: "FARBSEHEN",
    keywords: [
      "Farbsehen", "Farbe", "Farbenblind", "Farbsehschwäche",
      "Grauabstufung", "farborientiert", "Farbzuordnung"
    ],
    content: `Kann erst spät festgestellt werden, Kind muss dafür die Testverfahren verstehen.
Einfache Farbzuordnungen trotz absoluter Farbenblindheit durch Grauabstufungen gut möglich, deshalb fällt es erst spät auf.
Unterscheidung, ob Kind die Farben nicht erkennt oder nur die Begriffe nicht kennt.
Bei Farbsehschwäche/Farbenblindheit müssen Adaptionen stattfinden, weil Spiele im frühkindlichen Bereich im hohen Maße farborientiert sind.`
  },
  {
    name: "BLENDEMPFINDLICHKEIT",
    keywords: [
      "Blendempfindlichkeit", "Blendung", "Licht", "Sonne", "Albinismus",
      "Pigmentierung", "Kolobom", "Pupillenreflex", "Anpassung",
      "hell", "dunkel"
    ],
    content: `Bei geringer Pigmentierung (Albinismus), sehr hellen Augen, Spaltbildung an Iris oder Netzhaut (Kolobom) und bei eingeschränktem Pupillenreflex muss man von hoher Blendempfindlichkeit ausgehen.
Kind draußen vor Licht/Sonne schützen, im Gruppenraum mit dem Rücken oder seitlich zu Fenstern setzen.
Anpassung von Hellen ins Dunkle und umgekehrt dauert lange und führt vorübergehend zu starker Seheinschränkung und Unfallgefahr.`
  },
  {
    name: "NYSTAGMUS",
    keywords: [
      "Nystagmus", "Augenzittern", "Pendeln", "Rucknystagmus",
      "Kopfhaltung", "Nullzone", "unwillkürlich"
    ],
    content: `Unwillkürliches rhythmisches Augenzittern. Kann als Pendelnystagmus (gleichmäßig) oder Rucknystagmus (schnelle und langsame Phase) auftreten.
Kinder finden oft eine Kopfhaltung (Nullzone), in der der Nystagmus am geringsten ist und das Sehen am besten funktioniert. Diese Kopfhaltung sollte toleriert und nicht korrigiert werden.
Nystagmus verstärkt sich bei Müdigkeit, Aufregung und Stress, dadurch verschlechtert sich das Sehen situativ.`
  },
  {
    name: "GESICHTSFELDEINSCHRÄNKUNGEN",
    keywords: [
      "Gesichtsfeld", "Hemianopsie", "Skotom", "peripher",
      "Einschränkung", "Ausfall", "blind", "Quadrant"
    ],
    content: `Teile des Sehfeldes fehlen oder sind eingeschränkt. Kind nimmt Objekte und Personen aus bestimmten Richtungen nicht oder verspätet wahr.
Erhöhte Unfallgefahr, besonders im Straßenverkehr und beim Spielen. Kind muss lernen, den Kopf vermehrt in die Richtung des Ausfalls zu drehen (Kompensationsbewegungen).
Wichtig für die Positionierung im Raum: Kind so setzen, dass wichtige Geschehnisse im intakten Gesichtsfeld stattfinden.`
  },
  {
    name: "REFRAKTIONSFEHLER",
    keywords: [
      "Brille", "Hyperopie", "Myopie", "Weitsichtigkeit", "Kurzsichtigkeit",
      "Astigmatismus", "Hornhautverkrümmung", "Refraktion", "Dioptrie",
      "Brechungsfehler"
    ],
    content: `Optische Fehlsichtigkeit, die durch eine Brille korrigiert wird. Hyperopie (Weitsichtigkeit): Nahsehen anstrengend, Kind ermüdet bei Naharbeiten schneller. Myopie (Kurzsichtigkeit): Fernsehen unscharf. Astigmatismus (Hornhautverkrümmung): Verzerrtes Bild in bestimmten Achsen.
Wichtig: Brille muss getragen werden, damit das Gehirn ein scharfes Bild verarbeiten kann und die Sehentwicklung nicht gefährdet wird. Regelmäßige Kontrolle der Brillenstärke notwendig, da sich die Augen im Wachstum verändern.`
  },
  {
    name: "CEREBRALE SEHSTÖRUNG / CVI",
    keywords: [
      "CVI", "cerebral", "Sehstörung", "Gehirn", "kortikal",
      "Sehverarbeitung", "Reizüberflutung", "visuell", "Hirnschädigung",
      "neuronal"
    ],
    content: `Die Augen können funktionieren, aber das Gehirn verarbeitet die visuellen Informationen nicht richtig. Häufig bei Kindern mit neurologischen Vorerkrankungen.
Typische Merkmale: Starke Schwankungen der Sehleistung je nach Tagesform, Müdigkeit und Reizumgebung. Schwierigkeiten bei visueller Komplexität (viele Objekte gleichzeitig). Kind kann einzelne Objekte erkennen, verliert sie aber in einer Gruppe.
Reizreduktion ist der wichtigste Ansatz: ruhige Umgebung, klare Kontraste, einzelne Objekte präsentieren, ausreichend Zeit geben.`
  },
];

// Generate the prompt-compatible string from structured data
export function generateKnowledgeBasePrompt(): string {
  return KNOWLEDGE_BASE.map(
    (section) => `=== ${section.name} ===\n${section.content}`
  ).join("\n\n");
}

// Deterministic source classification for findings
export function classifyFindingSource(
  findingText: string
): "knowledge_base" | "needs_review" {
  const normalizedText = findingText.toLowerCase();
  let bestMatchCount = 0;

  for (const section of KNOWLEDGE_BASE) {
    let matchCount = 0;
    for (const keyword of section.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
    }
  }

  return bestMatchCount >= 2 ? "knowledge_base" : "needs_review";
}
