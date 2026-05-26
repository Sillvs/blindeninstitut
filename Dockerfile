# syntax=docker/dockerfile:1.7
#
# On-prem Docker image for the Eltern-Infobogen Generator.
#
# Built for institutional deployment: the Blindeninstitut can run this in
# its own data center, bypassing US-hosted PaaS providers. Image is small,
# non-root, and pinned by digest is recommended in production.
#
# Build:   docker build -t eltern-infobogen .
# Run:     docker run -p 3000:3000 \
#            -e OPENAI_API_KEY=... \
#            -e OPENAI_BASE_URL=... \
#            -e API_TOKEN=$(openssl rand -hex 32) \
#            eltern-infobogen
#
# See SECURITY.md and BSI.md for deployment hardening guidance.

# -----------------------------------------------------------------------------
# 1. Dependencies — production only, cached layer
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Build-time tools needed for native modules (pdf-parse → none, but future-proof)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# -----------------------------------------------------------------------------
# 2. Builder — compiles Next.js standalone output
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Telemetry off. We collect nothing.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# -----------------------------------------------------------------------------
# 3. Runner — minimal runtime image, non-root user
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root: avoids container-escape escalation paths
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy public assets and the standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check — hits the static homepage. Adjust if you put the app behind
# a subpath.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
