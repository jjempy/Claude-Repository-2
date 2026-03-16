FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build
RUN npm run db:generate

EXPOSE 4000

CMD sh -c "npx prisma migrate deploy && node dist/server.js"
