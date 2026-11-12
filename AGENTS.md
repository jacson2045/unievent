# UniEvent Pay — guía para asistentes de código

Plataforma distribuida de eventos universitarios: frontend React + microservicios Spring Boot.
La documentación completa está en `docs/` (MkDocs) y el resumen en `README.md`.

## Estructura

- `src/` — Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4.
  - `src/App.tsx` navegación por rol (estudiante, organizador, administrador) con `currentPage`.
  - `src/api/` clientes HTTP; **todas** las llamadas pasan por el API Gateway (`http://localhost:8000`).
  - `src/pages/{student,organizer,admin,auth}/` pantallas; `src/components/` layout y UI.
- `services/` — Backend Spring Boot 4 / Java 21 (un proyecto Maven por servicio):
  `api-gateway`, `discovery-server` (Eureka), `auth-service`, `event-service`,
  `enrollment-service`, `notification-service`.
- `infra/unievent-config/` — Config Server; `config-repo/` tiene la configuración por servicio y
  ambiente (`*-dev.yml`, `*-docker.yml`, `application*.yml`).
- `infra/prometheus/`, `infra/grafana/` — observabilidad (paneles versionados).
- `tests/e2e/` — pruebas integrales contra el sistema real (`pnpm test:e2e`).
- `docker-compose.yml` — sistema completo; `.env.example` lista las variables.

## Ejecutar

- Todo el sistema: `cp .env.example .env` y `docker compose up -d --build`.
- Frontend en desarrollo: `pnpm install` y `pnpm dev` (puerto 8443).
- Un servicio: `./mvnw spring-boot:run` dentro de su carpeta (requiere Eureka, Config Server,
  PostgreSQL y Kafka; ver `docs/ejecucion.md`).

## Convenciones

- Código, mensajes y documentación en español.
- Cambios de esquema solo con migraciones Flyway nuevas (`V<n>__descripcion.sql`); nunca editar una ya aplicada.
- El usuario autenticado se toma siempre del JWT, nunca de parámetros de la petición.
- Comunicación entre servicios: síncrona con Feign (resuelto por Eureka) o asíncrona con Kafka
  (tópico `unievent.inscripciones`, consumidores idempotentes).
- Secretos solo por variables de entorno (`.env` no se versiona).
- Strings TypeScript con apóstrofo: usar comillas dobles. Exportar componentes como `default`.
- Commits con prefijos `feat:`, `fix:`, `test:`, `docs:`, `chore:`.
