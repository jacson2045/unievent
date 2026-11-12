# UniEvent Pay

Plataforma **distribuida** para gestionar eventos universitarios: publicación de eventos,
inscripciones, pagos en línea con Mercado Pago (sandbox), asistencia con código QR y notificaciones.
Producto final del curso *Desarrollo de Aplicaciones Distribuidas* — Universidad Peruana Unión.

📖 **Documentación completa:** carpeta [`docs/`](docs/index.md) (sitio MkDocs).

## Arquitectura

```
Navegador (React) ──► API Gateway ──lb://──► auth · event · enrollment · notification
                         │                         │            │
                    Eureka · Config Server    PostgreSQL x4   Kafka (unievent.inscripciones)
                                                   └── Prometheus · Grafana · Zipkin
```

| Requisito | Implementación |
|---|---|
| Microservicios con responsabilidad clara | auth, event, enrollment, notification |
| Configuración centralizada por ambiente | Spring Cloud Config (`dev`, `docker`) |
| Registro y descubrimiento | Eureka |
| API Gateway con rutas y balanceo | Spring Cloud Gateway, `lb://`, reintentos y timeouts |
| Persistencia por servicio | 4 bases PostgreSQL con Flyway |
| Comunicación síncrona resiliente | OpenFeign + circuit breaker (Resilience4j) |
| Seguridad distribuida | JWT, roles y autorización por dueño de cada recurso |
| Mensajería asíncrona | Kafka: `INSCRIPCION_CONFIRMADA` / `INSCRIPCION_CANCELADA` |
| Consistencia | Consumidores idempotentes y compensación ante pagos rechazados |
| Observabilidad | Health checks, Prometheus, panel de Grafana, logs correlacionados y Zipkin |
| Entorno reproducible | Docker Compose con healthchecks y orden de arranque |
| Pruebas integrales | 27 casos E2E con casos de error y dos usuarios por rol |

## Inicio rápido

Requisitos: Docker Desktop con 8 GB de RAM y Git.

```bash
git clone https://github.com/jacson2045/unievent.git
cd unievent
cp .env.example .env              # completar POSTGRES_PASSWORD, JWT_SECRET y ADMIN_PASSWORD
docker compose up -d --build      # la primera vez tarda varios minutos
```

| Servicio | URL |
|---|---|
| Aplicación | http://localhost:8443 |
| API Gateway | http://localhost:8000 |
| Eureka | http://localhost:8761 |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |
| Zipkin | http://localhost:9411 |
| Kafka UI | http://localhost:8085 |

Pruebas integrales con el sistema levantado:

```bash
docker compose --profile tests run --rm e2e
```

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/` | Frontend React + TypeScript + Vite |
| `services/` | api-gateway, discovery-server y los cuatro microservicios (Spring Boot) |
| `infra/` | Config Server y su repositorio de configuración, Prometheus y Grafana |
| `tests/e2e/` | Pruebas integrales contra el sistema real |
| `docs/` | Documentación (MkDocs): arquitectura, datos, pruebas, bitácora |

## Documentación

[Instalación](docs/ejecucion.md) · [Uso del sistema](docs/uso.md) · [Arquitectura](docs/arquitectura.md) ·
[Microservicios y API](docs/microservicios.md) · [Datos y consistencia](docs/datos.md) ·
[Observabilidad](docs/observabilidad.md) · [Pruebas](docs/pruebas.md) · [Bitácora](docs/bitacora.md) ·
[Limitaciones](docs/limitaciones.md)
