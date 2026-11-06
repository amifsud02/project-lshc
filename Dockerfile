# Production image (built by Dokploy). For local development run `pnpm dev` against docker-compose's Mongo.
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dokploy passes these as build-time arguments. The ISR pages are prerendered against the database, and
# builds can't see dokploy-network, so BUILD_DATABASE_URL goes through the build-db-proxy stack: it forwards
# the Docker bridge address to Mongo, which keeps the database off the public internet.
ARG BUILD_DATABASE_URL
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_GA_CONSENT_MODE
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ARG NEXT_PUBLIC_BING_SITE_VERIFICATION
# next.config.mjs reads this file at build and at start, so each image gets its own deployment id.
RUN date +%s > .deployment-id && DATABASE_URL="$BUILD_DATABASE_URL" pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 8080
CMD ["pnpm", "start"]
