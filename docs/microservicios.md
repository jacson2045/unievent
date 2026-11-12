# Microservicios y API

Todas las rutas se consumen a través del **API Gateway** (`http://localhost:8000`). Las rutas
protegidas requieren la cabecera `Authorization: Bearer <JWT>`. Cada servicio publica además su
documentación OpenAPI en `/swagger-ui.html` (puerto interno del servicio).

Convenciones de respuesta: `400` validación · `401` sin sesión o token inválido · `403` sin permiso
(rol u objeto ajeno) · `404` no existe · `409` regla de negocio (duplicado, sin cupos, evento cerrado) ·
`503` servicio dependiente no disponible. Cada respuesta incluye la cabecera `X-Trace-Id`.

## auth-service — usuarios y autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/registro` | Público | Registro como `ESTUDIANTE` u `ORGANIZADOR` |
| POST | `/api/auth/login` | Público | Devuelve el JWT, nombre y rol |
| GET | `/api/auth/perfil` | Autenticado | Perfil del usuario del token |
| PUT | `/api/auth/perfil` | Autenticado | Cambiar el nombre |
| PUT | `/api/auth/password` | Autenticado | Cambiar la contraseña (requiere la actual) |
| GET | `/api/auth/admin/usuarios` | ADMIN | Listar usuarios |
| PUT | `/api/auth/admin/usuarios/{id}/estado` | ADMIN | Activar / desactivar (`{"activo": false}`) |
| PUT | `/api/auth/admin/usuarios/{id}/rol` | ADMIN | Cambiar rol |

Crea el administrador inicial al arrancar si no existe ninguno (`ADMIN_PASSWORD`).

## event-service — eventos y categorías

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/eventos` · `/api/eventos/{id}` | Público | Catálogo y detalle (incluye inscritos y cupos disponibles) |
| GET | `/api/eventos/mis-eventos` | ORGANIZADOR, ADMIN | Eventos del organizador (ADMIN: todos) |
| POST | `/api/eventos` | ORGANIZADOR, ADMIN | Crear; el dueño se toma del JWT |
| PUT | `/api/eventos/{id}` | Dueño o ADMIN | Editar (la capacidad no puede bajar de los inscritos) |
| PUT | `/api/eventos/{id}/cancelar` | Dueño o ADMIN | Cancelar (deja de aceptar inscripciones) |
| DELETE | `/api/eventos/{id}` | Dueño o ADMIN | Eliminar (solo sin inscritos) |
| GET/POST/PUT/DELETE | `/api/categorias[/{id}]` | Lectura pública; escritura ORGANIZADOR, ADMIN | Categorías |

Consume `unievent.inscripciones` para mantener el contador de inscritos.

## enrollment-service — inscripciones, pagos y asistencia

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/inscripciones` | ESTUDIANTE | Inscribirse (`{"eventoId": 1}`); gratis → `CONFIRMADA`, de pago → `PENDIENTE`; reutiliza una pendiente |
| GET | `/api/inscripciones` · `/{id}` | ESTUDIANTE (propias) | Mis inscripciones con su pago y código QR |
| POST | `/api/inscripciones/{id}/pago` | ESTUDIANTE (propia) | Crea o reutiliza el checkout de Mercado Pago |
| GET | `/api/inscripciones/{id}/pago/estado` | ESTUDIANTE (propia) | Estado del pago, sincronizado con Mercado Pago |
| GET | `/api/inscripciones/pagos` | ESTUDIANTE | Historial de pagos |
| GET | `/api/inscripciones/organizador[?eventoId=]` | ORGANIZADOR, ADMIN | Inscripciones de sus eventos |
| POST | `/api/inscripciones/organizador/asistencia` | ORGANIZADOR (dueño) | Check-in por código QR (`{"codigo": "UEP-…"}`) |
| POST | `/api/inscripciones/organizador/{id}/asistencia` | ORGANIZADOR (dueño) | Check-in manual |

Publica `INSCRIPCION_CONFIRMADA` e `INSCRIPCION_CANCELADA` en Kafka. Llama a event-service con Feign
(circuit breaker `eventoService`).

## notification-service — notificaciones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/notificaciones` | Autenticado (propias) | Mis notificaciones |
| GET | `/api/notificaciones/no-leidas` | Autenticado | Contador de no leídas |
| PUT | `/api/notificaciones/{id}/leida` | Autenticado (propia) | Marcar como leída |
| PUT | `/api/notificaciones/leidas` | Autenticado | Marcar todas como leídas |

Consume `unievent.inscripciones` y crea la notificación correspondiente.

## Plataforma

| Servicio | Puerto | Función |
|---|---:|---|
| api-gateway | 8000 | Enrutamiento `lb://`, CORS, `Retry`, timeouts; `/monitor/{servicio}/health` |
| discovery-server | 8761 | Registro Eureka (consola web en la misma URL) |
| config-server | 18888 | `GET /{servicio}/{perfil}` devuelve la configuración efectiva |
