FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @marvira/api...
RUN pnpm --filter @marvira/shared-types build
RUN pnpm --filter @marvira/shared-utils build
RUN cd apps/api && npx prisma generate
RUN pnpm --filter @marvira/api build
# Flatten workspace + deps into a portable folder (Prisma client lives under pnpm store, not apps/api/node_modules/.prisma)
RUN pnpm --filter @marvira/api deploy --prod --legacy /app/deploy

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/deploy ./
COPY --from=builder /app/apps/api/prisma ./prisma
# prisma CLI is a devDependency; needed only for migrate on boot
RUN npm install -g prisma@6.19.3

RUN mkdir -p uploads
EXPOSE 3001
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
