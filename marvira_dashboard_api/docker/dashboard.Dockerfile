FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/dashboard ./apps/dashboard
COPY packages ./packages
# Railway passes service vars into Docker only when declared as ARG (same name)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "NEXT_PUBLIC_API_URL must be set on the Railway dashboard service (no quotes)" && exit 1)
RUN echo "Building dashboard with NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
RUN pnpm install --frozen-lockfile --filter @marvira/dashboard...
RUN pnpm --filter @marvira/shared-types build
RUN pnpm --filter @marvira/shared-utils build
RUN pnpm --filter @marvira/dashboard build
# Next may have no static assets; ensure public/ exists for the runner COPY
RUN mkdir -p apps/dashboard/public

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

WORKDIR /app/apps/dashboard
EXPOSE 3000
CMD ["pnpm", "start"]
