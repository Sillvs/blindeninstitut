# BSI Grundschutz + DSGVO Art. 9 — Compliance-Mapping

Dieses Dokument ist eine Arbeitsvorlage für die externe Sicherheitsfirma der Blindeninstitutsstiftung. Es ordnet die im Code umgesetzten technischen Maßnahmen den relevanten BSI-IT-Grundschutz-Bausteinen und DSGVO-Artikeln zu.

**Status:** Technische Maßnahmen umgesetzt. Organisatorische Maßnahmen (AVV, Löschkonzept, Verantwortlichkeiten) liegen außerhalb des Codes und müssen von der Stiftung definiert werden — siehe Abschnitt „Offen".

---

## 1. Datenklassifikation

| Datenkategorie | DSGVO-Einstufung | Beispiele |
|---|---|---|
| Identifikationsdaten Minderjähriger | Art. 9 Abs. 1 (Gesundheitsdaten i.V.m. Personenstand) | Kindname, Geburtsdatum |
| Klinische Befunde | Art. 9 Abs. 1 (Gesundheitsdaten) | Sehschärfe, Diagnosen, Therapieempfehlungen |
| Berufliche Kontaktdaten | Art. 6 Abs. 1 | Name Orthoptistin, Untersuchungsdatum |

**Konsequenz:** Verarbeitung nur auf Grundlage von Art. 9 Abs. 2 lit. b/h DSGVO (z.B. Sozialleistung, Gesundheitsvorsorge mit Berufsgeheimnis). Erfordert TOMs nach Art. 32.

---

## 2. BSI-Grundschutz-Module — Umsetzungsnachweis

### CON.1 — Kryptokonzept
| Anforderung | Umsetzung | Datei |
|---|---|---|
| TLS für alle Verbindungen | HSTS-Header `max-age=63072000; includeSubDomains; preload`, `upgrade-insecure-requests` in CSP | `next.config.ts` |
| Authentisierung im Constant-Time-Vergleich | Edge-kompatible XOR-Akkumulation, keine Early-Exits | `src/lib/security/auth.ts` → `constantTimeEquals` |
| Sichere Zufallszahlen | `crypto.getRandomValues` (Web-Crypto, edge-runtime) für Prompt-Injection-Nonces | `src/lib/security/fence.ts` |

### CON.8 — Software-Entwicklung
| Anforderung | Umsetzung |
|---|---|
| Quellcode-Versionierung | Git-Repository |
| Sichere Default-Konfiguration | App fail-closed bei fehlendem `API_TOKEN` außerhalb `NODE_ENV=development` |
| Reproduzierbarer Build | `package-lock.json` committed, `npm ci` im Dockerfile |
| Dependency-Hygiene | `npm audit` clean. `npm overrides` für transient-bekannte CVEs (dompurify, postcss, brace-expansion). |
| Statische Analyse | TypeScript strict + ESLint (`eslint-config-next`) |

### NET.1.1 — Netzarchitektur
| Anforderung | Umsetzung | Datei |
|---|---|---|
| Trennung Frontend/Backend-Trust-Boundaries | Edge-Proxy als zentraler Eingangspunkt für alle `/api/*` | `src/proxy.ts` |
| Eingangsfilterung | Body-Size-Cap (411/413) → Auth → Rate-Limit, alle drei vor Route-Handler | `src/proxy.ts` |

### OPS.1.1.4 — Schutz vor Schadprogrammen
| Anforderung | Umsetzung | Datei |
|---|---|---|
| Eingangskontrolle Datei-Uploads | MIME-Check (`application/pdf`) + Magic-Byte-Check (`%PDF-`) | `src/lib/security/validate.ts` → `validatePdfFile` |
| Größenbegrenzung | 6 MB harte Grenze, Body-Cap 7 MB im Proxy | `src/lib/security/limits.ts` |
| Sandbox-Parser mit Timeout | `Promise.race` 15 s gegen pdf-parse, defendiert gegen PDF-Bomben | `src/app/api/extract/route.ts` → `parsePdfWithTimeout` |

### OPS.1.2.3 — Datensicherung
**Status:** Nicht relevant — die App speichert keine Daten persistent. PDFs werden in der Request-Session verarbeitet und nach Antwort verworfen. Falls in Zukunft Persistierung hinzukommt, Löschkonzept nach Art. 5 Abs. 1 lit. e DSGVO + § 10 BDSG dokumentieren.

### OPS.1.2.5 — Fernzugriff / OPS.1.2.6 — Remote-Wartung
**Status:** Über `API_TOKEN` Bearer-Auth ausschließlich, kein SSH/Shell-Zugriff zum Anwendungs-Container. Wartung erfolgt durch Re-Deploy eines neuen Container-Builds.

### APP.3.1 — Webanwendungen
| Anforderung | Umsetzung | Datei |
|---|---|---|
| Eingabevalidierung Server-seitig | Hand-gerollte Validatoren ohne externe Dep, längen- und typ-geprüft | `src/lib/security/validate.ts` |
| Output-Encoding | React rendert alles als Text-Knoten, kein `dangerouslySetInnerHTML` | Alle Komponenten in `src/components/` |
| Sicherheits-Header | CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy | `next.config.ts` |
| Schutz vor XSS | CSP ohne `unsafe-eval`; React-Default-Escaping; keine HTML-Senken in der App | `next.config.ts`, Komponenten |
| Schutz vor CSRF | Stateless API mit Bearer-Token-Auth, keine Cookie-Session | `src/lib/security/auth.ts` |
| Rate-Limiting | Per-IP Token-Bucket, Routen-spezifisch, fail-closed bei fehlendem IP-Header | `src/lib/security/rate-limit.ts` |
| Logging ohne PII | `logError` redactet Datum/Email/lange Zahlen, max. 80 Zeichen, keine Stack-Traces | `src/lib/security/log.ts` |

### APP.3.3 — Server-API-Schutz
| Anforderung | Umsetzung |
|---|---|
| Authentifizierung | Bearer-Token Pflicht außerhalb dev |
| Eingabe-Schemavalidierung | Längen-/Typ-Caps in `validate.ts`, Body-Size-Cap im Proxy |
| Output-Schemavalidierung | Strikte Role-Whitelist für ChatHistory, Filterung der LLM-Ausgabe |
| Anti-Automation | Token-Bucket pro IP, Rate-Caps pro Route |

### CON.3 — Datensicherungskonzept / CON.6 — Löschen und Vernichten
**Offen** — Stiftung muss Aufbewahrungs- und Löschkonzept dokumentieren, sobald Persistierung eingeführt wird. Aktuell triviallösung: keine Persistierung.

---

## 3. DSGVO-Artikel-Mapping

| DSGVO-Artikel | Anforderung | Umsetzung im Code | Verbleibende organisatorische Maßnahme |
|---|---|---|---|
| **Art. 5 Abs. 1 lit. c** (Datenminimierung) | Nur notwendige Daten verarbeiten | Größenlimits, Truncation auf 80k Zeichen vor LLM-Versand | **Manuelle Anonymisierung der PDFs vor Upload** (UI-Hinweis ergänzbar). Automatische Pseudonymisierung wartet auf Security-Firmen-Feedback. |
| **Art. 5 Abs. 1 lit. f** (Integrität, Vertraulichkeit) | Schutz vor unbefugtem Zugriff | Auth + Rate-Limit + Security-Header + Body-Cap | Operations: Secret-Rotation, Backup-Verschlüsselung |
| **Art. 9 Abs. 2 lit. b/h** (Gesundheitsdaten) | Erlaubnistatbestand | — | Rechtsgrundlage durch DSB der Stiftung dokumentieren |
| **Art. 13/14** (Informationspflichten) | Datenschutzerklärung | — | Privacy-Notice auf Login-/Upload-Seite ergänzen, sobald Stiftung Wording freigegeben hat |
| **Art. 25** (Privacy by Design / Default) | Defaults sicher | Auth fail-closed; CSP ohne unsafe-eval; noindex; pseudonyme Logs | — |
| **Art. 28** (Auftragsverarbeitung) | AVV mit jedem Verarbeiter | — | **Pflicht: AVV mit OpenAI (EU-Region) oder Wechsel zu Azure OpenAI EU / lokalem LLM.** Code unterstützt beides via `OPENAI_BASE_URL` + `LLM_MODEL`. |
| **Art. 30** (Verzeichnis der Verarbeitungstätigkeiten) | Dokumentation | — | DSB der Stiftung trägt App in VVT ein |
| **Art. 32** (Sicherheit der Verarbeitung) | TOMs | Siehe BSI-Module oben | Notfallkonzept, Mitarbeiterschulung |
| **Art. 33/34** (Meldepflicht) | Incident-Response | — | Runbook + Verantwortlichkeit definieren |
| **Art. 35** (DSFA) | Risikoabschätzung | — | DSFA durchführen (Gesundheitsdaten + KI = wahrscheinlich Pflicht) |

---

## 4. Empfohlene Deployment-Optionen (DSGVO-konform)

Aktueller Code unterstützt alle drei Optionen ohne Source-Änderung über Environment-Variablen.

### Option A — Vercel EU + Azure OpenAI EU (kürzester Weg)
- Hosting: Vercel Frankfurt-Region (`fra1`)
- LLM: Azure OpenAI Service in West-Europa (Niederlande/Schweden) mit Microsoft-AVV
- Konfiguration: `OPENAI_BASE_URL=https://<resource>.openai.azure.com/openai/deployments/<deployment>` + Azure-API-Key
- Verbleibende Risiken: Vercel ist ein US-Unternehmen → Schrems II-Diskussion. Für Behörden meist nicht ausreichend.

### Option B — On-Prem Docker + Azure OpenAI EU (institutionsfreundlich)
- Hosting: Eigener Linux-Server der Stiftung, Reverse-Proxy mit TLS (nginx/Caddy)
- Container: `Dockerfile` in diesem Repo (Multi-Stage, non-root, healthcheck)
- LLM: Azure OpenAI EU mit Microsoft-AVV
- Build: `docker build -t eltern-infobogen .` → ein Image, kein Code-Außenkontakt zur Cloud
- Erfüllt: BSI-Grundschutz NET.1.1 (Netzarchitektur), Datenhoheit, kein Hyperscaler-Hosting

### Option C — On-Prem Docker + lokales LLM (maximale Datenhoheit)
- Hosting: wie Option B
- LLM: Eigener vLLM- oder Ollama-Server mit Llama 3.1 70B / Qwen 2.5 72B
- Konfiguration: `OPENAI_BASE_URL=http://ollama.intern:11434/v1`, `LLM_MODEL=llama3.1:70b`
- Hardware-Bedarf: 1× GPU mit ≥48 GB VRAM (z.B. RTX A6000) oder 2× RTX 4090
- **Keine Daten verlassen das Institut.** Kein AVV nötig, kein DSGVO-Drittland-Transfer, kein Schrems II.
- Trade-off: Qualität ggü. gpt-4o leicht reduziert, Latenz höher, Wartung des LLM-Servers nötig.

---

## 5. Offene Punkte (organisatorisch, kein Code)

1. **AVV mit OpenAI / Azure OpenAI / Anbieter des lokalen LLMs**
2. **Datenschutz-Folgenabschätzung (DSFA)** durch DSB der Stiftung — wahrscheinlich Pflicht nach Art. 35 (Gesundheitsdaten Minderjähriger + automatisierte Verarbeitung)
3. **Eintrag im Verzeichnis der Verarbeitungstätigkeiten (Art. 30)**
4. **Privacy-Notice / Datenschutzerklärung** für die Upload-Seite
5. **Löschkonzept** (sobald Persistierung eingeführt wird)
6. **Wartungs-/SLA-Vertrag** mit dem Entwickler — siehe Mail-Thread vom 26.05.2026
7. **Mitarbeiterschulung** zum sicheren Umgang (z.B. „nur anonymisierte PDFs hochladen, solange die Pseudonymisierungs-Funktion noch nicht freigeschaltet ist")
8. **Incident-Response-Runbook** mit Meldeschwellen + Verantwortlichen

---

## 6. Roadmap technische Härtung (in Diskussion)

Folgende Punkte sind als Code-Erweiterung vorbereitet, aber bewusst noch nicht ausgerollt — sie warten auf die Rückmeldung der externen Sicherheitsfirma der Stiftung:

- **Automatische Pseudonymisierung** (Namen, Datum, Adressen): Modul-Stub vorhanden, aktivierbar via `DATA_MINIMIZATION=true`. Aktuell deaktiviert, da die Stiftung entscheiden möchte, ob Pseudonymisierung mit Reverse-Map (Browser kennt Klartext) oder vollständige Anonymisierung (Klartext geht verloren) gefordert ist.
- **SSO-Integration** statt Bearer-Token: Auth.js + OIDC gegen den Identity-Provider der Stiftung. Bearer-Token ist ein Minimum-Gate; SSO wäre die organisationsweite Lösung.
- **Audit-Trail** pro Benutzer + Aktion: bedingt durch SSO.

---

## 7. Audit-Historie

- **2026-05-26 — Runde 1+2 (CSO-Audit, intern):** 21 Code-Findings adressiert (Auth, Rate-Limit, Body-Validation, Prompt-Injection-Härtung, Dep-Updates, Headers, Logging, Timeouts).
- **2026-05-26 — Runde 3 (unabhängiges Re-Audit, intern):** 0 exploitable findings ≥ 7/10.
- **2026-05-26 — Runde 4 (Compliance-Pass nach IT-Feedback):** LLM-Provider-Abstraktion + Dockerfile + dieses BSI-Mapping ergänzt.
- **OFFEN:** Externe Prüfung durch Sicherheitsfirma der Stiftung (frühestens nach Urlaubszeit Ende Juni 2026 nach Aussage IT-Referat).
