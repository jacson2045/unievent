# Arquitectura del sistema

UniEvent Pay utiliza una arquitectura distribuida basada en microservicios. Cada servicio tiene una responsabilidad funcional específica.

## Componentes principales

| Componente | Responsabilidad |
|---|---|
| Frontend | Interfaz web para los usuarios |
| API Gateway | Punto de entrada para las solicitudes |
| Auth Service | Autenticación y autorización |
| Event Service | Gestión de eventos y categorías |
| Enrollment Service | Inscripciones y pagos |
| Notification Service | Gestión de notificaciones |
| Attendance Service | Control de asistencia mediante QR |

## Comunicación entre servicios

- El frontend consume las API del backend.
- El API Gateway centraliza el acceso a los servicios.
- Enrollment Service consulta eventos mediante OpenFeign.
- Resilience4j proporciona tolerancia ante fallos.
- Apache Kafka permite la comunicación asíncrona para notificaciones.

## Persistencia

Los servicios utilizan bases de datos PostgreSQL independientes para separar sus datos.

## Seguridad

La autenticación utiliza tokens JWT y la autorización se basa en roles:

- ESTUDIANTE
- ORGANIZADOR
- ADMIN
