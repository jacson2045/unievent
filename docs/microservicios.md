# Microservicios

UniEvent Pay organiza sus funcionalidades backend en servicios independientes.

## API Gateway

- Puerto: `8000`.
- Centraliza el acceso a las API del backend.
- Gestiona el enrutamiento de solicitudes.

## Auth Service

- Puerto: `8082`.
- Gestiona el registro y el inicio de sesión.
- Emite tokens JWT.

## Event Service

- Puerto: `8080`.
- Gestiona eventos y categorías.
- Expone operaciones REST.

## Enrollment Service

- Puerto: `8083`.
- Gestiona inscripciones y pagos.
- Consulta eventos mediante OpenFeign.
- Implementa Circuit Breaker con Resilience4j.
- Integra el flujo de pagos de Mercado Pago.

## Notification Service

- Puerto: `8084`.
- Gestiona las notificaciones.
- Participa en la comunicación mediante Kafka.

## Attendance Service

El control de asistencia mediante QR forma parte de las funcionalidades del proyecto. Su implementación debe distinguirse de los servicios actualmente operativos.

## API REST y Swagger

Los endpoints disponibles pueden consultarse en Swagger UI de cada servicio, cuando su documentación OpenAPI está habilitada.
