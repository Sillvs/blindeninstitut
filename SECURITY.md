# Security Posture — Eltern-Infobogen Generator

Diese App verarbeitet **Gesundheitsdaten von Kindern** (DSGVO Art. 9 — besondere Kategorien personenbezogener Daten). Sie ist gebaut für den produktiven Einsatz bei der Blindeninstitutsstiftung (Stiftung des öffentlichen Rechts) und folgt entsprechenden Sicherheitsanforderungen.

## Architektur — Vertrauensgrenzen

```
Browser  ──HTTPS──►  Next.js Middleware  ──►  /api/* Routen  ──HTTPS──►  OpenAI API
                    (Auth + Rate-Limit)        (Input-Validation)
```

Alle API-Routen liegen hinter:
1. **Optionale Bearer-Token-Auth** (`API_TOKEN` env var) — opt-in. Wenn gesetzt, jede Anfrage ohne gültiges Token bekommt 401. Wenn ungesetzt: anonymer Demo-Modus (siehe „Auth-Posture" unten).
2. **Per-IP Rate-Limit** (Token-Bucket, in-memory) — bremst Cost-Amplification-Angriffe auf OpenAI-Quota
3. **Input-Validation** — Längenbegrenzungen, MIME-Check, PDF-Magic-Bytes, strikte Role-Whitelist für Chat-History

## Auth-Posture — bewusste Wahl pro Deployment

| Modus | Konfig | Wann |
|---|---|---|
| **Anonymer Demo-Modus** | `API_TOKEN` ungesetzt | Public PoC, Demo-URLs (z.B. die Vercel-Preview, die die Stiftung testen darf). Rate-Limit + max_tokens-Caps sind die einzigen Cost-Gates. Akzeptables Risiko-Niveau weil die App stateless ist und keine PII persistiert. |
| **Bearer-Mode** | `API_TOKEN=<32+ char hex>` | Institutionelle Deployments hinter Reverse-Proxy / SSO. Der Proxy injiziert den Authorization-Header. Anfragen ohne Token → 401. |

Frühere Versionen hatten einen `fail-closed`-Default in Production wenn kein `API_TOKEN` gesetzt war. Das hat die Demo-URL der Stiftung blockiert (sie haben das Tool ohne Passwort erwartet). Das fail-closed-Verhalten passte nur zum Bearer-Mode und wurde entfernt. Die übrigen Härtungen (Rate-Limit, max_tokens-Caps, Body-Size-Cap, Prompt-Injection-Nonce-Fences, CSP, PII-redacted Logs, PDF-Validation, CVE-Patches) bleiben in beiden Modi aktiv.

## Implementierte Härtungen

| Bereich | Maßnahme | Datei |
|---|---|---|
| Auth | Bearer-Token via `API_TOKEN` env var (≥16 Zeichen), constant-time compare, **fail-closed** in jedem nicht-`development`-Environment | `src/lib/security/auth.ts` |
| Rate-Limit | Per-IP Token-Bucket, Routen-spezifisch. Kein-Header-Fallback teilt sich einen Bucket (fail-closed). | `src/lib/security/rate-limit.ts` |
| Edge-Proxy (Next 16) | Schützt alle `/api/*` Routen by default: Body-Size-Cap (411/413) → Auth → Rate-Limit | `src/proxy.ts` |
| Body-Size-Cap | 7 MB für `/api/extract`, 256 KB für JSON-Routen. `Content-Length` Pflicht (chunked TE wird abgelehnt). | `src/proxy.ts`, `src/lib/security/limits.ts` |
| Input-Validation | Hand-gerollt (keine zusätzliche Dep), Längen-Caps, Role-Whitelist für Chat-History | `src/lib/security/validate.ts` |
| Cost-Caps | PDF ≤ 6 MB, PDF-Text ≤ 80k Zeichen, Chat-Message ≤ 4k, History ≤ 10 Items. `max_tokens` auf jedem OpenAI-Call (Output-Cap). | `src/lib/security/limits.ts` |
| OpenAI-Timeout | 30 s wall-clock pro Request, maxRetries=1. Verhindert dauerhaft offene Function-Slots. | `src/lib/openai.ts` |
| PDF-Validation | MIME-Check + Magic-Byte-Check (`%PDF-`), Größe vor Parsing | `src/lib/security/validate.ts` |
| pdf-parse-Timeout | 15 s wall-clock via `Promise.race`. Schützt vor PDF-Bomben (cyclische Refs etc). | `src/app/api/extract/route.ts` |
| Prompt-Injection | Per-Request **Nonce-Fences** (96 bit Random) um alle User-Inhalte. Angreifer kann das schließende Tag nicht erraten. User-Inhalte landen ausschließlich in `user`-Role, niemals in `system`. ChatHistory-Roles werden runtime-validiert. | `src/lib/security/fence.ts`, `/api/chat`, `/api/generate` |
| Sichere Logs | `logError()`: nur `error.name` + 80 Zeichen redacted Message (PII-Filter: Datum/Email/Lange-Zahlen). Niemals voller Stack oder Original-Message. | `src/lib/security/log.ts` |
| Security-Headers | CSP (kein `unsafe-eval` mehr), HSTS, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy | `next.config.ts` |
| robots/noindex | Meta-Robots + `/robots.txt` blockieren Indexing | `src/app/layout.tsx`, `public/robots.txt` |
| Dependency-Hygiene | `npm audit` clean (0 vulns). `shadcn` CLI als devDep verschoben. Overrides für `dompurify`, `postcss`, `brace-expansion`. Next.js auf 16.2.6 (13 CVEs gepatcht). | `package.json` |

## Vor Produktivbetrieb — Pflicht-Checklist

- [ ] **`API_TOKEN` setzen** (z.B. `openssl rand -hex 32`, min. 16 Zeichen) — App fail-closed wenn `NODE_ENV !== "development"` und Token fehlt: `/api/*` antwortet mit 503
- [ ] **`TRUSTED_CLIENT_IP_HEADER`** setzen, falls die Deployment-Edge nicht XFF benutzt (z.B. `cf-connecting-ip` für Cloudflare). Sonst landen alle Requests im selben Rate-Limit-Bucket.
- [ ] **Auftragsverarbeitungsvertrag (AVV)** mit OpenAI (EU-Region wählen)
- [ ] **TLS-Terminierung** durch Vercel/eigenen Reverse-Proxy
- [ ] **Logs ohne PII** — Vercel-Log-Drain oder ähnlich, mit Retention nach DSGVO-Vorgaben
- [ ] **Datensparsamkeit** — Vor Upload prüfen, ob Kind-Name/Geburtsdatum überhaupt nötig sind, oder ob anonymisierte Berichte ausreichen
- [ ] **Aufbewahrungsfrist** — Aktuell speichert die App nichts persistent. Falls in Zukunft persistiert wird: Löschkonzept dokumentieren

## Bedrohungsmodell — was die App NICHT abdeckt

- **Browser-side Persistenz**: Es gibt aktuell keine. PDFs werden nur in der laufenden Session verarbeitet. Falls Vercel/CDN den Upload zwischenspeichert, kann sensitive Daten in Caches landen — daher CDN-Caching für `/api/*` deaktiviert lassen.
- **Mehrbenutzer-Isolation**: Bei Setzen von `API_TOKEN` haben alle Benutzer dasselbe Token. Für Audit-Trail pro Benutzer → echte SSO einbauen (Auth.js mit dem Institutions-IdP).
- **OpenAI-Side-Channel**: OpenAI sieht den vollständigen PDF-Text. Falls das unvereinbar mit Schweigepflicht ist, lokales LLM (z.B. Llama 3 70B) einsetzen — die App ist so gebaut, dass `src/lib/openai.ts` der einzige Berührungspunkt ist und auf jeden OpenAI-kompatiblen Endpoint umgestellt werden kann.

## Deployment-Optionen für DSGVO-konformen Betrieb

Der Code unterstützt drei Provider-Konfigurationen ohne Source-Änderung:

| Option | LLM-Provider | Hosting | Konfiguration |
|---|---|---|---|
| A | OpenAI USA | Vercel EU | (Default — *nur Test/PoC, nicht für Echtdaten*) |
| B | Azure OpenAI EU (Microsoft AVV) | On-Prem Docker | `OPENAI_BASE_URL=https://<resource>.openai.azure.com/openai/deployments/<deployment>`, Azure-Key in `OPENAI_API_KEY` |
| C | Lokales LLM (Ollama / vLLM, kein Drittlandtransfer) | On-Prem Docker | `OPENAI_BASE_URL=http://ollama.intern:11434/v1`, `LLM_MODEL=llama3.1:70b`, `OPENAI_API_KEY=local` |

On-Prem-Deployment: siehe `Dockerfile` im Repo. Build: `docker build -t eltern-infobogen .`, Run: siehe Header-Kommentar in Dockerfile.

Detaillierte BSI-Grundschutz- und DSGVO-Artikel-Zuordnung: siehe **`BSI.md`** (Vorlage für die externe Sicherheitsfirma der Stiftung).

## Bekannte Restrisiken

- **`pdf-parse@1.1.1`** wird nicht mehr aktiv gewartet (letzter Release 2018). Mitigationen: Magic-Byte-Check vorgelagert, Size-Cap 10 MB, läuft im sandbox'd Next.js-Runtime, kein JS-Eval auf PDFs. Migration auf `unpdf` oder `pdf2json` ist auf der Roadmap.
- **Postcss XSS Advisory (GHSA-qx2v-qp2m-jg93)** — build-time only, kein attacker-controlled CSS-Pfad. Per `overrides` auf gepatchte Version gezogen.

## Audit-Historie

- **2026-05-26 — Runde 1**: Initialer Security-Audit. Findings: keine Auth, kein Rate-Limit, Prompt-Injection (chatHistory + Anmerkungen), Next.js 16.2.1 mit 13 CVEs (SSRF CVSS 8.6), keine Input-Validierung, keine Security-Headers. **Fixes:** Bearer-Auth + Rate-Limit + Body-Validation + Next.js 16.2.6 + CSP/HSTS/X-Frame + noindex + `npm audit` clean.
- **2026-05-26 — Runde 2** (unabhängiger Re-Audit): 9 weitere Findings. **Fixes:** Body-Size-Cap im Edge-Proxy (411/413), pdf-parse Timeout, max_tokens auf jedem OpenAI-Call, OpenAI SDK Timeout 30 s, Nonce-Fences gegen Prompt-Injection-Tag-Breakout, Auth fail-closed in allen Nicht-Dev-Envs, `unsafe-eval` aus CSP entfernt, `logError` mit PII-Filter, TRUSTED_CLIENT_IP_HEADER für robuste Rate-Limit-Buckets.
- **2026-05-26 — Runde 3** (unabhängiger Re-Audit): **0 Findings ≥ 7/10 Confidence.** Ship-ready.
- **2026-05-26 — Runde 4** (Compliance-Pass nach IT-Feedback der Stiftung): LLM-Provider-Abstraktion (`OPENAI_BASE_URL` + `LLM_MODEL` → Azure OpenAI EU / lokales LLM möglich), Multi-Stage Dockerfile für On-Prem-Betrieb, `BSI.md` mit Grundschutz-Modul-Mapping als Vorlage für externe Sicherheitsfirma. Pseudonymisierung wartet bewusst auf Rückmeldung der Security-Firma (Stiftung entscheidet Reverse-Map vs. volle Anonymisierung).
