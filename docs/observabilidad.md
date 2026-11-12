# Observabilidad

UniEvent Pay cubre los cuatro pilares de observabilidad: **health checks**, **métricas**,
**paneles** y **logs correlacionados con trazas distribuidas**. Todo se levanta con
`docker compose up -d` y no requiere configuración manual.

| Herramienta | URL | Para qué |
|---|---|---|
| Actuator (cada servicio) | `/actuator/health`, `/actuator/prometheus` | Salud y métricas expuestas por Spring Boot |
| Panel del administrador | http://localhost:8443 → *Monitoreo del sistema* | Health checks en vivo vía gateway (`/monitor/{servicio}/health`) |
| Prometheus | http://localhost:9090 | Recolección de métricas; descubre los servicios en **Eureka** |
| Grafana | http://localhost:3000 (`admin` / `GRAFANA_ADMIN_PASSWORD`) | Panel *UniEvent Pay — Microservicios* |
| Zipkin | http://localhost:9411 | Trazas distribuidas de cada petición |
| Eureka | http://localhost:8761 | Instancias registradas |
| Kafka UI | http://localhost:8085 | Tópicos y mensajes de `unievent.inscripciones` |

## Health checks

Cada servicio expone `/actuator/health` con sus componentes (base de datos, disco, Config Server,
descubrimiento). Docker Compose los usa para decidir cuándo un servicio está listo (`healthy`) y en
qué orden arrancar. El panel *Monitoreo del sistema* del administrador los consulta cada 15 s a través
del gateway.

## Métricas y panel de Grafana

Prometheus no tiene una lista fija de servicios: usa `eureka_sd_configs`
([`infra/prometheus/prometheus-docker.yml`](https://github.com/jacson2045/unievent/blob/main/infra/prometheus/prometheus-docker.yml)),
así que también mide réplicas nuevas (`docker compose up -d --scale event-service=2`).

El panel está versionado en
[`infra/grafana/dashboards/unievent-overview.json`](https://github.com/jacson2045/unievent/blob/main/infra/grafana/dashboards/unievent-overview.json)
y Grafana lo carga al iniciar (carpeta *UniEvent Pay*). Tiene un filtro por servicio y estos paneles:

| Sección | Paneles |
|---|---|
| Resumen | Servicios en línea · peticiones/s · % de errores 5xx · latencia p95 del gateway |
| Tráfico HTTP | Peticiones/s por servicio · latencia p95 por servicio · errores por servicio y código · endpoints más usados |
| Mensajería y resiliencia | Eventos Kafka publicados/consumidos · estado del circuit breaker enrollment → event · llamadas del circuit breaker · conexiones a la base de datos |
| JVM | Memoria heap · uso de CPU |

## Logs correlacionados y trazas distribuidas

Cada petición recibe un **traceId** (Micrometer Tracing + Brave) que viaja:

- por HTTP entre el gateway y los servicios (cabecera W3C `traceparent`),
- por **Feign** (enrollment-service → event-service),
- por **Kafka**, en las cabeceras del mensaje (enrollment-service → event-service y notification-service).

Cada línea de log incluye `[servicio,traceId,spanId]` y cada respuesta HTTP trae la cabecera
`X-Trace-Id`. En errores 5xx, el frontend muestra el identificador en el mensaje.

### Cómo comprobarlo

1. Inscribirse a un evento (desde el frontend o con la API) y copiar la cabecera `X-Trace-Id` de la respuesta
   (en el navegador: herramientas de desarrollo → Red).
2. Buscar ese identificador en los logs de todos los servicios:

   ```bash
   docker compose logs api-gateway enrollment-service event-service notification-service | grep <traceId>
   ```

3. Abrir la traza en Zipkin: `http://localhost:9411/zipkin/traces/<traceId>`.

Resultado obtenido con una inscripción gratuita (12/11/2026):

```
X-Trace-Id: 6af64375d3a732f0e1bfc68edac9f3ed

Líneas de log con ese traceId:  api-gateway 8 · enrollment-service 13 · event-service 1 · notification-service 2

[enrollment-service,6af64375…,1d98e9ad…]   InscripcionEventPublisher  : Evento … publicado en unievent.inscripciones
[event-service,6af64375…,b2af3727…]        InscripcionEventosListener : Inscritos +1 en evento 24
[notification-service,6af64375…,57872…]    InscripcionEventosListener : Notificacion creada …

Zipkin: 16 spans en 4 servicios (api-gateway, enrollment-service, event-service, notification-service)
```

La misma petición se sigue así a través de la llamada síncrona (Feign) y de la mensajería asíncrona (Kafka).
