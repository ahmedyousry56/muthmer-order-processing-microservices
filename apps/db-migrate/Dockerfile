FROM node:24.15.0-slim
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig*.json ./
# needs devDeps for ts-node (used by prisma seed)
RUN npm install --ignore-scripts
COPY libs/shared/prisma ./libs/shared/prisma
RUN npx --yes prisma generate --schema=libs/shared/prisma/schema.prisma
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]
