# Equipo y aporte individual

## Datos del proyecto

| Campo | Valor |
|---|---|
| Curso | Desarrollo de Aplicaciones Distribuidas |
| Producto | Unidad 3 — Producto final |
| Universidad | Universidad Peruana Unión |
| Integrante | **Yacson Carrizales Chuquimamani** |
| Repositorio | <https://github.com/jacson2045/unievent> (`jacson2045`) |

## Integrante y responsabilidades

El proyecto fue desarrollado de forma **individual** por **Yacson Carrizales Chuquimamani**, responsable
de todas las capas del sistema:

| Área | Aporte |
|---|---|
| Arquitectura | Diseño de los microservicios, sus responsabilidades y la comunicación síncrona y asíncrona |
| Backend | auth-service, event-service, enrollment-service, notification-service, API Gateway y Discovery Server (Spring Boot 4, Java 21) |
| Seguridad | Autenticación JWT, autorización por rol y por dueño de cada recurso, administración de usuarios |
| Mensajería y consistencia | Eventos de negocio en Kafka, consumidores idempotentes y compensación de pagos rechazados |
| Resiliencia | Circuit breaker con Resilience4j, balanceo con Eureka, reintentos y timeouts en el gateway |
| Integraciones | Pagos con Mercado Pago (sandbox), mapa de Google Maps, asistencia con código QR |
| Frontend | Interfaz React para estudiante, organizador y administrador, conectada al backend por el gateway |
| Infraestructura | Configuración centralizada por ambiente, Docker Compose con healthchecks, imágenes multi-etapa |
| Observabilidad | Health checks, métricas con Prometheus, panel de Grafana, logs correlacionados y trazas con Zipkin |
| Validación | 27 pruebas integrales E2E, bitácora de 16 hallazgos corregidos |
| Documentación | Este sitio MkDocs, README y guía de ejecución |

## Evidencia del aporte

La autoría se verifica en el historial del repositorio: todos los commits son de `jacson2045`.

```bash
git shortlog -sn --all              # commits por autor
git log --stat --author="Yacson"    # archivos modificados en cada commit
```

Hitos principales, en orden:

| Etapa | Commits |
|---|---|
| Base del sistema | Estado inicial; Feign + circuit breaker en enrollment-service; Swagger con JWT; secretos en variables de entorno |
| Mensajería | Notificaciones con Kafka |
| Frontend conectado al backend | Eventos, inscripción y pago con Mercado Pago, inscripciones, notificaciones, pagos, panel del organizador, asistencia con QR, perfil y administración |
| Plataforma distribuida | Eureka y balanceo, Docker Compose, pruebas integrales, trazas y paneles |
| Cierre | Bitácora, documentación, limpieza del repositorio, mapa de ubicación |
