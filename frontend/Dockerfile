# syntax=docker/dockerfile:1

# ---------- Etapa 1: dependências ----------
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Etapa 2 (desenvolvimento): servidor do Vite com HMR ----------
# Só é usada pelo docker-compose.dev.yml (build.target: dev).
FROM deps AS dev
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------- Etapa 3: build de produção ----------
FROM deps AS build
COPY . .
# O front chama a API em "/api" por padrão (veja src/services/api.js).
# Não declare ARG/ENV de VITE_API_BASE aqui: uma variável vazia anularia o padrão "/api".
RUN npm run build

# ---------- Etapa 4 (produção): Nginx servindo os arquivos estáticos ----------
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
