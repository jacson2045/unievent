# Limitaciones y mejoras

## Limitaciones actuales

| Limitación | Impacto | Mitigación actual |
|---|---|---|
| Publicación a Kafka sin patrón *transactional outbox* | Si la base fallara justo después de publicar, el aviso quedaría enviado | Consumidores idempotentes; caso muy improbable |
| JWT sin revocación | Una cuenta desactivada conserva su sesión hasta que el token vence (24 h) | No puede volver a iniciar sesión; el token caduca |
| Pagos solo en sandbox de Mercado Pago | No se procesan pagos reales | Proyecto académico |
| Estado del pago por consulta (sin *webhook*) | El pago se confirma cuando el estudiante vuelve o consulta | Página de resultado con reintentos y botón *Verificar* |
| Una sola instancia de Kafka, Eureka y Config Server | Son puntos únicos de falla | Healthchecks y reinicio automático (`restart: unless-stopped`); los servicios usan la última configuración cargada |
| Sin HTTPS ni dominio propio | Solo apto para entorno local | El gateway centraliza el punto donde se terminaría TLS |
| Navegación del frontend sin rutas por URL | Recargar la página vuelve al inicio de la sección | Parámetro `?page=` para enlaces directos |
| Los nombres de los participantes se muestran por correo | El nombre está en auth-service | El correo identifica de forma única al estudiante |
| Registro de asistencia sin ventana horaria en la demo | Se puede registrar antes del evento | `app.asistencia.validar-fecha=true` lo limita a 2 h antes del inicio |

## Riesgos aceptados

Los riesgos y su justificación están en la [bitácora de validación](bitacora.md#riesgos-aceptados).

## Mejoras priorizadas

1. **Webhook de Mercado Pago** para confirmar pagos sin depender de que el estudiante vuelva.
2. **Transactional outbox** en enrollment-service para publicar eventos solo si la transacción se confirma.
3. **Revocación de tokens** (lista de bloqueo en Redis) para que la desactivación sea inmediata.
4. **Aviso a los inscritos cuando se cancela un evento** (nuevo evento `EVENTO_CANCELADO` en Kafka).
5. **Rutas reales en el frontend** (React Router) y enlaces compartibles.
6. **Alta disponibilidad**: Eureka y Config Server replicados, Kafka con 3 brokers.
7. **Despliegue en la nube** con HTTPS y un pipeline CI que ejecute las pruebas integrales en cada cambio.
8. **Notificaciones por correo** además de las notificaciones en la aplicación.
