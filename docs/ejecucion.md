# Ejecución del proyecto

Hay dos formas de ejecutar UniEvent Pay. La **opción A (Docker)** es la recomendada:
levanta el sistema completo con un solo comando y solo requiere Docker.

## Opción A — Sistema completo con Docker (recomendada)

### Requisitos

- Docker Desktop 4.x (Docker Engine 24+ con Compose v2) con al menos **8 GB de RAM** asignados (el sistema completo usa unos 4,5 GB; la primera construcción necesita más).
- Git.

No se necesita Java, Maven ni Node.js: las imágenes compilan cada servicio dentro de Docker.

### Pasos

```bash
git clone https://github.com/jacson2045/unievent.git
cd unievent
cp .env.example .env
```

Edita `.env` y completa como mínimo:

| Variable | Descripción |
|---|---|
| `POSTGRES_PASSWORD` | Clave de las 4 bases de datos PostgreSQL |
| `JWT_SECRET` | Clave de firma de los JWT, **mínimo 64 caracteres** (`openssl rand -base64 64 \| tr -d '\n'`) |
| `ADMIN_PASSWORD` | Clave del administrador inicial `admin@upeu.edu.pe` (mínimo 8 caracteres) |
| `MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_PUBLIC_KEY` | Credenciales **de prueba** de Mercado Pago (opcional: sin ellas no se pueden pagar eventos con costo) |

Luego:

```bash
docker compose up -d --build
```

La primera construcción tarda varios minutos (descarga dependencias de Maven y npm).
El orden de arranque lo controla Compose con *healthchecks*:

```
PostgreSQL x4 + Kafka  →  Config Server  →  Discovery (Eureka)
  →  auth / event / enrollment / notification  →  API Gateway  →  Frontend
```

Para ver el estado (todos deben quedar `healthy`):

```bash
docker compose ps
```

### Direcciones

| Componente | URL |
|---|---|
| Frontend | http://localhost:8443 |
| API Gateway | http://localhost:8000 |
| Eureka (registro de servicios) | http://localhost:8761 |
| Grafana (`admin` / `GRAFANA_ADMIN_PASSWORD`) | http://localhost:3000 |
| Prometheus | http://localhost:9090 |
| Kafka UI | http://localhost:8085 |
| Zipkin (trazas distribuidas) | http://localhost:9411 |

### Operaciones útiles

```bash
docker compose logs -f enrollment-service          # logs de un servicio
docker compose up -d --scale event-service=2       # segunda instancia (balanceo por Eureka)
docker compose --profile tests run --rm e2e        # pruebas integrales (27 casos)
docker compose down                                # detener (conserva los datos)
docker compose down -v                             # detener y borrar los datos
```

## Opción B — Desarrollo local (sin Docker para los servicios)

Requisitos: Java JDK 21, Node.js 22 y pnpm, Docker Desktop (para la infraestructura).

1. Infraestructura (Kafka, Prometheus, Grafana, Kafka UI): `docker compose -f infra/docker-compose.yml up -d`
2. Bases de datos: `docker compose -f services/<servicio>/compose-dev.yml up -d` para cada servicio.
3. Variables de entorno: `JWT_SECRET`, `ENROLLMENT_DB_PASSWORD`, `NOTIFICATION_DB_PASSWORD`,
   `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY` y, opcionalmente, `ADMIN_PASSWORD`.
4. Arrancar en este orden con `./mvnw spring-boot:run` dentro de cada carpeta:

| Orden | Servicio | Carpeta | Puerto |
|---:|---|---|---:|
| 1 | Discovery Server (Eureka) | `services/discovery-server` | 8761 |
| 2 | Config Server | `infra/unievent-config` | 18888 |
| 3 | Auth Service | `services/auth-service` | 8082 |
| 3 | Event Service | `services/event-service` | 8080 |
| 3 | Enrollment Service | `services/enrollment-service` | 8083 |
| 3 | Notification Service | `services/notification-service` | 8084 |
| 4 | API Gateway | `services/api-gateway` | 8000 |

5. Frontend: `pnpm install` y `pnpm dev` en la raíz → http://localhost:8443
