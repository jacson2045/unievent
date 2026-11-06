# Observabilidad y monitoreo

UniEvent Pay incorpora herramientas de observabilidad para supervisar el estado y el rendimiento de sus microservicios.

## Prometheus

Prometheus recopila métricas de los servicios backend mediante sus endpoints Actuator.

URL local:

`http://localhost:9090`

Entre las métricas disponibles se encuentran:

- Solicitudes HTTP.
- Estado de salud de los servicios.
- Métricas de JVM.
- Métricas del Circuit Breaker.

## Grafana

Grafana permite visualizar las métricas recopiladas por Prometheus mediante paneles de monitoreo.

URL local:

`http://localhost:3000`

## Spring Boot Actuator

Los microservicios exponen información de salud y métricas mediante endpoints Actuator, según la configuración de cada servicio.

Ejemplos:

- `/actuator/health`
- `/actuator/metrics`
- `/actuator/prometheus`

## Resilience4j y Circuit Breaker

Enrollment Service utiliza Resilience4j para controlar las llamadas al Event Service.

El Circuit Breaker permite identificar fallos y evitar solicitudes repetidas cuando un servicio presenta problemas.

Sus estados principales son:

- CLOSED: permite las solicitudes normalmente.
- OPEN: bloquea temporalmente las solicitudes.
- HALF_OPEN: permite solicitudes de prueba para comprobar la recuperación.

## Kafka

Kafka permite la comunicación asíncrona entre componentes para el procesamiento de notificaciones.

Kafka UI facilita la visualización y administración de los componentes de mensajería.

URL local:

`http://localhost:8085`
