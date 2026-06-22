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
RUN npm install --omit=dev && npm cache clean --force
COPY --from=builder /app/apps/orders-service/dist ./dist
EXPOSE ${PORT:-3000}
CMD ["node", "dist/main.js"]