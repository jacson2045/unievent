# Pruebas integrales

Las pruebas integrales verifican el **sistema real** de punta a punta: todos los microservicios,
PostgreSQL, Kafka, Eureka y el API Gateway levantados con Docker Compose. Se comunican con el
backend exactamente como el frontend: a través del gateway.

- Código: [`tests/e2e/flujo-principal.test.mjs`](https://github.com/jacson2045/unievent/blob/main/tests/e2e/flujo-principal.test.mjs)
- Herramienta: ejecutor de pruebas nativo de Node.js (`node:test`), sin dependencias adicionales.
- Cada ejecución registra usuarios nuevos (sufijo único), por lo que se puede repetir sin limpiar datos.
- Usuarios: **dos estudiantes (A y B)** y **dos organizadores (O y P)** para verificar la
  autorización a nivel de objeto, más el administrador inicial.

## Cómo ejecutarlas

Con el sistema levantado (`docker compose up -d`):

```bash
# Sin instalar nada (contenedor de Node en la red de Docker)
docker compose --profile tests run --rm e2e

# Con Node.js 22+ instalado (además genera tests/e2e/reportes/resultado-junit.xml)
pnpm test:e2e
```

Los casos que dependen de credenciales externas se marcan como omitidos (*skipped*) si faltan:
CP-23 requiere credenciales de prueba de Mercado Pago y CP-27 requiere `ADMIN_PASSWORD`.

## Casos de prueba

| Código | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| CP-01 | Plataforma | Los 5 servicios están registrados en Eureka | API-GATEWAY, AUTH, EVENT, ENROLLMENT, NOTIFICATION |
| CP-02 | Plataforma | Health check de cada servicio vía gateway | `UP` en los 6 componentes |
| CP-03 | Éxito | Login con credenciales válidas | 200 + JWT |
| CP-04 | Error | Login con contraseña incorrecta | 401 |
| CP-05 | Error | Registro público con rol ADMIN | 400 |
| CP-06 | Error | Rutas protegidas sin token | 401 / 403 |
| CP-07 | Error | Estudiante intenta crear un evento | 403 |
| CP-08 | Éxito | Organizador O crea eventos gratuito y de pago | 201 y aparecen en "mis eventos" |
| CP-09 | Error | Evento con fecha pasada | 400 (validación) |
| CP-10 | **Dos usuarios** | Organizador P edita / cancela / borra el evento de O | 403 en los tres y el evento queda intacto |
| CP-11 | Éxito | El dueño O edita su evento | 200 |
| CP-12 | Éxito | Estudiante A se inscribe a evento gratuito | 201, `CONFIRMADA`, código QR |
| CP-13 | Error | Inscripción duplicada | 409 |
| CP-14 | Asíncrono | event-service suma el inscrito (consumidor Kafka) | `inscritos = 1` |
| CP-15 | Asíncrono | notification-service crea la notificación (consumidor Kafka) | Notificación con el nombre del evento |
| CP-16 | **Dos usuarios** | B consulta la inscripción y notificaciones de A | 403 / no aparecen / 404 al marcar |
| CP-17 | **Dos usuarios** | Participantes del evento: O sí, P no | 200 sin códigos QR / 403 |
| CP-18 | **Dos usuarios** | P registra asistencia en el evento de O | 403 |
| CP-19 | Error | Código de asistencia inexistente | 404 |
| CP-20 | Éxito | O registra la asistencia de A, una sola vez | 200, luego 409; A ve su asistencia |
| CP-21 | Éxito | Inscripción a evento de pago, idempotente | `PENDIENTE`, misma inscripción al repetir |
| CP-22 | **Dos usuarios** | B paga o consulta el pago de A | 403 |
| CP-23 | Éxito / regresión | Checkout de Mercado Pago, idempotente y sin aprobaciones falsas | 201, mismo checkout, pago `PENDING` |
| CP-24 | Error | Evento sin cupos | 409 "No hay cupos disponibles" |
| CP-25 | Error | Borrar evento con inscritos / inscribirse a evento cancelado | 409 / 409 |
| CP-26 | Error | Estudiante u organizador en gestión de usuarios | 403 |
| CP-27 | Éxito | Admin lista usuarios y desactiva una cuenta | 200; la cuenta desactivada no inicia sesión |

## Resultado

Ejecución sobre el stack Docker (12/11/2026):

```
ℹ tests 27
ℹ pass 27
ℹ fail 0
ℹ skipped 0
ℹ duration_ms 2489
```

La suite se ejecutó también dentro de un contenedor (`docker compose --profile tests run --rm e2e`)
y dos veces consecutivas con el mismo resultado.

## Hallazgo detectado por las pruebas

**H-07 — Pagos marcados como aprobados sin haberse pagado.** La primera ejecución de CP-23
falló: al repetir la solicitud de pago, el sistema respondía "La inscripción ya tiene un pago
aprobado".

- **Causa:** la referencia que se enviaba a Mercado Pago (`external_reference`) era el id
  autoincremental del pago. Al iniciar el entorno Docker con una base de datos nueva, los ids se
  repitieron, y la consulta a Mercado Pago encontró pagos *aprobados* antiguos de la misma cuenta
  de pruebas con esa referencia. El pago nuevo se marcaba como aprobado y la inscripción se
  confirmaba sin pago.
- **Corrección:** cada pago tiene una referencia externa propia (UUID) en la columna
  `referencia_externa` (migración `V7`). Los pagos antiguos conservan su referencia anterior.
- **Verificación:** CP-23 comprueba ahora que un pago recién creado sigue `PENDING` y la
  inscripción `PENDIENTE`. La suite pasa 27/27.
