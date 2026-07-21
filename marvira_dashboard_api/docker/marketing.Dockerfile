FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/marketing/package.json ./apps/marketing/
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @marvira/marketing...

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/marketing/node_modules ./apps/marketing/node_modules
COPY . .
RUN pnpm --filter @marvira/marketing build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
COPY --from=builder /app/apps/marketing/.next ./apps/marketing/.next
COPY --from=builder /app/apps/marketing/public ./apps/marketing/public
COPY --from=builder /app/apps/marketing/package.json ./apps/marketing/package.json
COPY --from=builder /app/apps/marketing/node_modules ./apps/marketing/node_modules
COPY --from=builder /app/node_modules ./node_modules
WORKDIR /app/apps/marketing
EXPOSE 3002
CMD ["npx", "next", "start", "--port", "3002"]
