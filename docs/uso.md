# Uso del sistema

## Cuentas

- **Administrador:** `admin@upeu.edu.pe` con la contraseña definida en `ADMIN_PASSWORD` (`.env`).
- **Estudiantes y organizadores:** se registran desde la pantalla *Crear cuenta*. El administrador puede
  cambiar el rol de cualquier usuario desde *Gestión de usuarios*.

## Flujo principal (demo de punta a punta)

| # | Rol | Acción | Qué ocurre en el sistema |
|---|---|---|---|
| 1 | Organizador | *Crear evento* (gratuito o de pago) | event-service guarda el evento con el organizador como dueño |
| 2 | Estudiante | *Explorar eventos* → detalle → *Inscribirme* | enrollment-service consulta el evento por **Feign** (circuit breaker) y valida cupos, fecha y duplicados |
| 3a | Estudiante | Evento gratuito: la inscripción queda **confirmada** | Se publica `INSCRIPCION_CONFIRMADA` en **Kafka** |
| 3b | Estudiante | Evento de pago: *Pagar con Mercado Pago* → checkout sandbox → vuelve a *Resultado del pago* | Al aprobarse el pago se confirma y se publica en Kafka; si se rechaza, la inscripción se anula (**compensación**) |
| 4 | — | (asíncrono) | event-service suma el inscrito; notification-service crea la notificación |
| 5 | Estudiante | *Notificaciones* y *Mis inscripciones* | Ve la confirmación y su estado de pago |
| 6 | Estudiante | *Mis asistencias* | Muestra su **código QR** |
| 7 | Organizador | *Asistencia* → escanear el QR (o escribir el código) | Se registra la asistencia una sola vez |
| 8 | Organizador | *Participantes*, *Pagos*, *Estadísticas* | Datos de **sus** eventos; exportación CSV |
| 9 | Administrador | *Dashboard*, *Gestión de usuarios*, *Monitoreo del sistema* | Métricas globales y health checks en vivo |

!!! tip "Pago de prueba"
    En el checkout sandbox de Mercado Pago se usan las tarjetas y el usuario comprador de prueba de la
    cuenta de desarrollador. No se cobra dinero real.

## Pantallas por rol

| Estudiante | Organizador | Administrador |
|---|---|---|
| Inicio (indicadores y próximos eventos) | Dashboard (indicadores, inscripciones por día) | Dashboard (métricas globales) |
| Explorar eventos y detalle | Mis eventos (editar, cancelar, eliminar) | Gestión de usuarios (rol, activar/desactivar) |
| Inscripción y pago | Crear / editar evento | Monitoreo del sistema (health checks) |
| Mis inscripciones | Participantes (filtros, CSV) | Notificaciones y perfil |
| Mis pagos (comprobante imprimible) | Asistencia (QR con cámara o código) | |
| Mis asistencias (QR) | Pagos y Estadísticas | |
| Notificaciones y perfil | Notificaciones y perfil | |

## Guía rápida de la API

Ejemplo del flujo principal con `curl` (todas las rutas pasan por el gateway):

```bash
G=http://localhost:8000

# 1. Registrar un organizador y un estudiante (devuelven el JWT)
ORG=$(curl -s -X POST $G/api/auth/registro -H 'Content-Type: application/json' \
  -d '{"nombreCompleto":"Ana Org","correo":"ana.org@upeu.edu.pe","password":"ClaveSegura1","rol":"ORGANIZADOR"}' | jq -r .token)
EST=$(curl -s -X POST $G/api/auth/registro -H 'Content-Type: application/json' \
  -d '{"nombreCompleto":"Luis Est","correo":"luis@upeu.edu.pe","password":"ClaveSegura1","rol":"ESTUDIANTE"}' | jq -r .token)

# 2. El organizador crea un evento gratuito
EV=$(curl -s -X POST $G/api/eventos -H "Authorization: Bearer $ORG" -H 'Content-Type: application/json' \
  -d '{"nombre":"Charla de IA","fecha":"2027-05-10T10:00:00","lugar":"Aula Magna","capacidad":50,"precio":0,"categoriaId":1}' | jq .id)

# 3. El estudiante se inscribe (queda CONFIRMADA y recibe su código QR)
curl -s -X POST $G/api/inscripciones -H "Authorization: Bearer $EST" -H 'Content-Type: application/json' \
  -d "{\"eventoId\":$EV}"

# 4. Efectos asíncronos (Kafka): contador y notificación
curl -s $G/api/eventos/$EV | jq '.inscritos'
curl -s $G/api/notificaciones -H "Authorization: Bearer $EST" | jq '.[0].mensaje'
```

La referencia completa de rutas está en [Microservicios y API](microservicios.md).
