# Production image (used by Railway). For local development run `pnpm dev` against docker-compose's Mongo.
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
# Railway passes service variables as build args. The ISR pages are prerendered against the database,
# and the private network is not reachable during builds, so the build uses Mongo's public proxy URL.
ARG BUILD_DATABASE_URL
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_GA_CONSENT_MODE
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ARG NEXT_PUBLIC_BING_SITE_VERIFICATION
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
RUN DATABASE_URL="$BUILD_DATABASE_URL" pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 8080
CMD ["pnpm", "start"]
