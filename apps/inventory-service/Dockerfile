FROM node:24.15.0 AS builder
WORKDIR /app
COPY package*.json ./
COPY nx.json tsconfig*.json ./
RUN npm install
COPY . .
RUN npx nx build inventory-service --prod

FROM node:24.15.0-slim AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force
COPY libs/shared/prisma ./libs/shared/prisma
RUN npx --yes prisma generate --schema=libs/shared/prisma/schema.prisma
COPY --from=builder /app/dist/apps/inventory-service ./dist
CMD ["node", "dist/main.js"]