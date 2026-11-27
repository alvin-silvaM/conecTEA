# syntax=docker/dockerfile:1

FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Copiamos só os arquivos de dependências primeiro: enquanto package*.json não mudar,
# o Docker reaproveita o cache desta camada e não reinstala tudo a cada build.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# A imagem oficial do Node já traz o usuário "node" (sem privilégios de root).
USER node

EXPOSE 3000
CMD ["node", "src/app.js"]
