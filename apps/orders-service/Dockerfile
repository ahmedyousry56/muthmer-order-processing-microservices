# ── Stage 1: build ──────────────────────────────────────────────────
FROM node:24.15.0 AS builder
WORKDIR /app
COPY package*.json ./
COPY nx.json tsconfig*.json ./
RUN npm install
COPY . .
RUN npx nx build orders-service --prod

# ── Stage 2: production image ────────────────────────────────────────
FROM node:24.15.0-slim AS production
WORKDIR /app
ARG PORT
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force
COPY libs/shared/prisma ./libs/shared/prisma
RUN npx --yes prisma generate --schema=libs/shared/prisma/schema.prisma
# NX outputs to dist/apps/<name>, not apps/<name>/dist
COPY --from=builder /app/dist/apps/orders-service ./dist
EXPOSE ${PORT:-3000}
CMD ["node", "dist/main.js"]