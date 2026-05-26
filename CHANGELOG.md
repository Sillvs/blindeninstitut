# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project follows semantic versioning.

## [0.1.1] - 2026-05-26

### Added
- Bearer-token auth gate on every `/api/*` route via `API_TOKEN` env var. Fails closed in any non-`development` environment.
- Per-IP token-bucket rate limiting (configurable trusted IP header via `TRUSTED_CLIENT_IP_HEADER`).
- Edge proxy at `src/proxy.ts` (Next 16 `proxy` convention) enforcing body-size cap → auth → rate limit on every `/api/*` request.
- LLM provider abstraction: `OPENAI_BASE_URL` and `LLM_MODEL` env vars route OpenAI SDK calls to any OpenAI-compatible endpoint (Azure OpenAI EU, self-hosted vLLM/Ollama, llama.cpp) without code change.
- Multi-stage `Dockerfile` (Next.js standalone, non-root nextjs:1001, healthcheck) for on-prem deployment.
- Prompt-injection hardening via per-request 96-bit nonce fences around user content in LLM messages.
- PDF magic-byte and MIME validation with 15 s wall-clock timeout (defends against PDF bombs).
- Security headers in `next.config.ts`: CSP (no `unsafe-eval`), HSTS, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.
- `robots: noindex` meta + `/robots.txt` (tool processes special-category health data).
- `logError` helper with PII redaction (dates, emails, long digit runs), 80-char bound, no stack traces.
- `SECURITY.md` — audit history and deployment checklist.
- `BSI.md` — BSI IT-Grundschutz module mapping (CON.1, CON.8, NET.1.1, OPS.1.1.4, APP.3.1, APP.3.3) and DSGVO article matrix (Art. 5/9/25/28/30/32/33/35) as a working document for the foundation's external security firm.
- `.env.example` with full env var documentation.

### Changed
- Next.js upgraded from 16.2.1 to 16.2.6 — patches 13 CVEs including SSRF (CVSS 8.6) and middleware bypass (CVSS 8.1).
- OpenAI SDK pinned to 30 s wall-clock timeout, `maxRetries=1` (was SDK default of 10 minutes / 2 retries).
- Every `chat.completions.create` call now sets `max_tokens` (output cost cap).
- Strict request-body validation on every `/api/*` route with length caps and runtime role whitelist for `chatHistory` (TypeScript `as` cast was a runtime no-op).
- Next.js `output: "standalone"` for on-prem Docker builds.
- `shadcn` CLI moved from `dependencies` to `devDependencies` (removed 249 transitive deps from production bundle).
- `dompurify`, `postcss`, `brace-expansion` pinned via `npm overrides` — `npm audit` now reports 0 vulnerabilities.

### Fixed
- Request body size is now enforced before JSON parsing in the edge proxy (411 if Content-Length missing, 413 if oversized).

## [0.1.0] - 2026-05-26

Initial release: Eltern-Infobogen Generator for orthoptic reports.
