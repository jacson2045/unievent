# syntax=docker/dockerfile:1
# Frontend (React + Vite): se compila con pnpm y se sirve como estático con nginx.
# Contexto de construcción: la raíz del repositorio.

FROM node:22-alpine AS build
WORKDIR /app
# Misma versión de pnpm con la que se generó pnpm-lock.yaml.
RUN npm install -g pnpm@12.15.0
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY index.html vite.config.ts tsconfig.json ./
COPY .figma/make/site.json ./.figma/make/site.json
COPY src ./src
RUN pnpm build

FROM nginx:1.27-alpine
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
