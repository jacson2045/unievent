# UniEvent Pay

**UniEvent Pay** es una plataforma web distribuida para gestionar eventos universitarios:
publicación de eventos, inscripciones, pagos en línea con Mercado Pago, control de asistencia con
código QR y notificaciones.

Producto final del curso **Desarrollo de Aplicaciones Distribuidas** — Universidad Peruana Unión.

## Problema

En la universidad, los eventos (congresos, talleres, charlas, actividades culturales) se difunden por
canales dispersos, las inscripciones se hacen en formularios sueltos, los pagos se verifican a mano y la
asistencia se controla con listas en papel. El organizador no sabe en tiempo real cuántos cupos quedan
ni quién pagó, y el estudiante no recibe confirmaciones.

## Solución

Un sistema de **microservicios** detrás de un **API Gateway**, cada uno con su propia base de datos,
que se comunican de forma **síncrona** (REST + Feign con circuit breaker) y **asíncrona** (eventos de
negocio en **Kafka**):

| Rol | Qué puede hacer |
|---|---|
| Estudiante | Explorar eventos, inscribirse, pagar con Mercado Pago, ver su código QR de asistencia, recibir notificaciones |
| Organizador | Crear y administrar *sus* eventos, ver participantes y pagos, registrar asistencia escaneando el QR, ver estadísticas |
| Administrador | Gestionar usuarios y roles, ver métricas globales y el estado de los servicios |

## Valor

- **Un solo lugar** para publicar, inscribir, cobrar y controlar asistencia.
- **Información en tiempo real**: cupos, pagos y asistencia actualizados por eventos de negocio.
- **Seguro**: autenticación con JWT, autorización por rol y por dueño de cada recurso.
- **Resiliente y observable**: balanceo con Eureka, reintentos, circuit breaker, métricas, paneles y
  trazas distribuidas.

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Java 21, Spring Boot 4, Spring Cloud 2025.1 (Gateway, Config, Eureka, OpenFeign, LoadBalancer), Resilience4j |
| Datos y mensajería | PostgreSQL 16 (una base por servicio), Flyway, Apache Kafka 4 |
| Seguridad | Spring Security, JWT |
| Pagos | Mercado Pago (sandbox) |
| Observabilidad | Actuator, Micrometer, Prometheus, Grafana, Zipkin |
| Despliegue | Docker y Docker Compose |

## Inicio rápido

```bash
git clone https://github.com/jacson2045/unievent.git && cd unievent
cp .env.example .env        # completar las claves
docker compose up -d --build
```

Luego abre <http://localhost:8443>. Detalles en [Instalación y ejecución](ejecucion.md).

## Contenido de esta documentación

| Sección | Contenido |
|---|---|
| [Instalación y ejecución](ejecucion.md) | Requisitos, configuración y comandos |
| [Uso del sistema](uso.md) | Flujo principal por rol y guía rápida de la API |
| [Arquitectura](arquitectura.md) | Componentes, comunicación y decisiones técnicas |
| [Microservicios y API](microservicios.md) | Responsabilidad y endpoints de cada servicio |
| [Datos y consistencia](datos.md) | Modelo por servicio, eventos, idempotencia y compensación |
| [Observabilidad](observabilidad.md) | Health checks, métricas, paneles y trazas |
| [Pruebas integrales](pruebas.md) y [Bitácora](bitacora.md) | Casos, resultados y hallazgos corregidos |
| [Equipo](equipo.md) · [Repositorio](repositorio.md) · [Limitaciones](limitaciones.md) | Autoría, estándares y mejoras |
