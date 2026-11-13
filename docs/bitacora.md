# Bitácora de validación y estabilización

Registro de los hallazgos encontrados al integrar, probar y estabilizar el sistema completo:
qué se detectó, por qué ocurría, cómo se corrigió y **cómo se comprobó** que quedó corregido.
Cada corrección está en un commit del repositorio y, cuando aplica, en un caso de prueba
automatizado ([Pruebas integrales](pruebas.md)) que impide que el error vuelva.

| ID | Severidad | Área | Hallazgo | Estado |
|---|---|---|---|---|
| H-01 | Alta | Seguridad | Un organizador podía editar o borrar eventos de otros organizadores | Corregido |
| H-02 | Crítica | Seguridad | Cualquiera podía registrarse como ADMIN | Corregido |
| H-03 | Alta | Seguridad | auth-service no validaba tokens: todas sus rutas eran públicas | Corregido |
| H-04 | Crítica | Pagos | Pagos marcados como aprobados sin haberse pagado | Corregido |
| H-05 | Media | Consistencia | El contador de inscritos de los eventos siempre era 0 | Corregido |
| H-06 | Media | Consistencia | La compensación por pago rechazado no se informaba al estudiante | Corregido |
| H-07 | Media | Negocio | Se aceptaban inscripciones a eventos que ya ocurrieron | Corregido |
| H-08 | Media | Pagos | Mercado Pago devolvía al estudiante a una URL inexistente | Corregido |
| H-09 | Media | Configuración | enrollment, notification y gateway no usaban el Config Server | Corregido |
| H-10 | Alta | Resiliencia | Al caer una instancia, ~35 s con la mitad de respuestas en 500 | Corregido |
| H-11 | Alta | Resiliencia | En Docker, retirar una réplica dejaba peticiones colgadas | Corregido |
| H-12 | Baja | Resiliencia | Con event-service caído, la inscripción respondía 409 en vez de 503 | Corregido |
| H-13 | Media | Despliegue | Las fechas se guardaban en UTC dentro de los contenedores | Corregido |
| H-14 | Media | Operación | El Config Server se detuvo por clases compiladas con Java 25 | Mitigado |
| H-15 | Media | Operación | Docker se quedó sin memoria al construir con el sistema corriendo | Mitigado |
| H-16 | Media | Frontend | 13 de 18 pantallas mostraban datos simulados | Corregido |

---

## H-01 — Un organizador podía modificar eventos ajenos

- **Detección:** revisión de la autorización por objeto (requisito de la rúbrica) en event-service.
- **Causa:** las rutas de escritura solo exigían el rol `ORGANIZADOR`; el evento no guardaba quién lo creó.
- **Corrección:** columna `organizador_correo` (migración `V5`), el dueño se toma del JWT y
  editar/cancelar/eliminar exige ser el dueño o ADMIN (403 en caso contrario). — commit `55be4a0`
- **Verificación:** CP-10 (el organizador P recibe 403 al editar, cancelar o borrar el evento de O
  y el evento queda intacto) y CP-17 (P no ve los participantes de O).

## H-02 — Registro público como ADMIN

- **Detección:** revisión de `RegistroRequest` al implementar la gestión de usuarios.
- **Causa:** la validación aceptaba `ESTUDIANTE|ORGANIZADOR|ADMIN` en el registro abierto.
- **Corrección:** el registro solo admite estudiante u organizador; el primer administrador se crea
  al arrancar con la variable `ADMIN_PASSWORD` (nunca en el repositorio). — commit `4c95b26`
- **Verificación:** CP-05 (registro con rol ADMIN → 400).

## H-03 — auth-service sin validación de JWT

- **Detección:** al implementar el perfil, el endpoint protegido respondía sin token.
- **Causa:** `SecurityConfig` permitía `/api/auth/**` completo y no había filtro JWT.
- **Corrección:** filtro JWT propio; solo login y registro son públicos (401 sin token o con token
  inválido). — commit `a6a929f`
- **Verificación:** CP-06 (`/api/auth/perfil` sin token → 401).

## H-04 — Pagos aprobados sin haberse pagado

- **Detección:** la primera ejecución de la prueba integral CP-23 falló: al repetir la solicitud de
  pago, el sistema respondía "La inscripción ya tiene un pago aprobado".
- **Causa:** la referencia enviada a Mercado Pago (`external_reference`) era el id autoincremental del
  pago. Con una base de datos nueva los ids se repitieron y la búsqueda en Mercado Pago encontró pagos
  **aprobados** antiguos de la misma cuenta de pruebas: el pago nuevo se marcaba como aprobado y la
  inscripción se confirmaba sin pago.
- **Corrección:** cada pago tiene una referencia propia (UUID) en `referencia_externa`
  (migración `V7`); los pagos antiguos conservan la suya. — commit `143c508`
- **Verificación:** CP-23 comprueba que un pago recién creado sigue `PENDING` y la inscripción
  `PENDIENTE`; la suite pasa 27/27.

## H-05 — Contador de inscritos siempre en 0

- **Detección:** el detalle del evento mostraba "0 inscritos" aunque hubiera inscripciones confirmadas.
- **Causa:** event-service nunca se enteraba de las inscripciones (solo notification-service
  consumía el evento de Kafka).
- **Corrección:** event-service es un segundo consumidor del tópico `unievent.inscripciones`
  (grupo propio) e incrementa el contador de forma atómica e idempotente (tabla
  `eventos_procesados`). Solo cuenta `INSCRIPCION_CONFIRMADA`. — commits `1ae36e7`, `e9f6483`
- **Verificación:** CP-14 (tras la inscripción, `inscritos = 1`). Al enviar el mismo mensaje dos veces,
  el log muestra "Evento duplicado … ignorado (idempotencia)".
- **Nota:** los datos de desarrollo anteriores a la integración con Kafka se alinearon manualmente.

## H-06 — Compensación invisible para el estudiante

- **Detección:** al implementar *Mis pagos*: un pago rechazado anulaba la inscripción, pero nadie lo sabía.
- **Corrección:** la compensación publica `INSCRIPCION_CANCELADA` en Kafka y notification-service
  crea el aviso "Pago no completado: inscripción anulada". — commit `e9f6483`
- **Verificación:** pruebas unitarias del publicador y de `NotificacionService`; mensaje de prueba en
  Kafka enviado dos veces → una sola notificación y el contador de inscritos sin cambios.

## H-07 — Inscripción a eventos ya realizados

- **Detección:** prueba manual: los eventos de ejemplo vencidos seguían aceptando inscripciones.
- **Corrección:** enrollment-service rechaza eventos con fecha pasada (409) y el frontend los muestra
  como "Finalizado". — commit `1ae36e7`
- **Verificación:** inscripción al evento vencido → 409 "El evento ya se realizó".

## H-08 — Retorno de Mercado Pago a una URL inexistente

- **Causa:** las `back_urls` apuntaban a `http://localhost:4200/pago-exitoso` (otro proyecto).
- **Corrección:** URL configurable `FRONTEND_URL`; nueva página *Resultado del pago* que verifica el
  estado con reintentos. — commit `1ae36e7`
- **Verificación:** redirección al checkout sandbox y retorno a la página de resultado.

## H-09 — Servicios que no usaban la configuración centralizada

- **Detección:** el health check de enrollment-service no mostraba el componente `clientConfigServer`.
- **Causa:** tenía `spring.config.import: optional:configserver:…` pero no la dependencia
  `spring-cloud-starter-config`; al ser `optional:` se ignoraba sin error. notification-service y el
  gateway no estaban conectados.
- **Corrección:** cliente de Config Server en los cinco servicios, configuración común en
  `config-repo/application.yml` y ambiente `docker`. — commits `0bcdc7a`, `201d8f3`
- **Verificación:** *Monitoreo del sistema* muestra "Config Server: UP" en todos los servicios.

## H-10 — Errores 500 al caer una instancia

- **Detección:** prueba de tolerancia a fallos con dos instancias de event-service: al terminar una,
  durante unos 35 s la mitad de las peticiones respondía 500.
- **Causa:** el gateway seguía enviando tráfico a la instancia muerta mientras figuraba en su caché.
- **Corrección:** filtro `Retry` para peticiones GET (reintenta en otra instancia) y caché del balanceador
  de 5 s. — commit `0bcdc7a`
- **Verificación:** misma prueba repetida: 40/40 respuestas 200 (máx. 170 ms).

## H-11 — Peticiones colgadas al retirar una réplica en Docker

- **Detección:** al bajar `event-service` de 2 a 1 réplica, peticiones del panel de monitoreo
  quedaban esperando sin respuesta.
- **Causa:** el gateway no tenía tiempo máximo de conexión; la IP del contenedor eliminado no responde.
- **Corrección:** `connect-timeout` de 2 s y `response-timeout` de 15 s en el gateway. — commit `201d8f3`
- **Verificación:** 40/40 respuestas 200 tras retirar la réplica; la más lenta, 3,2 s.

## H-12 — Código HTTP incorrecto con event-service caído

- **Causa:** el *fallback* del circuit breaker lanzaba una excepción que el manejador traducía a 409.
- **Corrección:** se responde 503 (servicio no disponible). — commit `1ae36e7`

## H-13 — Fechas en UTC dentro de los contenedores

- **Detección:** la hora de asistencia registrada en Docker aparecía con 5 horas de diferencia.
- **Corrección:** `TZ=America/Lima` en los contenedores Java y PostgreSQL. — commit `201d8f3`
- **Verificación:** `date` en los contenedores muestra `-05`.

## H-14 — Config Server detenido por clases de Java 25

- **Detección:** el Config Server dejó de responder; el log mostró
  `UnsupportedClassVersionError (class file version 69.0)`.
- **Causa:** el IDE recompiló las clases con JDK 25 mientras el servicio corría con Java 21 y el
  reinicio automático de *devtools* falló.
- **Mitigación:** compilación limpia con JDK 21. Las imágenes Docker compilan siempre con JDK 21, por lo
  que el entorno de presentación no se ve afectado. **Recomendación:** configurar el IDE con JDK 21.

## H-15 — Docker sin memoria durante la construcción

- **Detección:** Docker Desktop dejó de responder al construir imágenes con todo el sistema en marcha
  (máquina virtual en 6,8 de 8 GB).
- **Mitigación:** construir con el sistema detenido y de a una imagen; límites de memoria por JVM; la
  guía exige 8 GB para Docker. Docker se recuperó sin pérdida de datos.

## H-16 — Pantallas con datos simulados

- **Detección:** auditoría inicial del frontend: 13 de 18 pantallas usaban `mockData.ts` o simulaban
  acciones con esperas.
- **Corrección:** todas las pantallas conectadas al backend en los pasos 1 a 9 y eliminación de
  `mockData.ts`. — commits `48920bf` a `4c95b26`

---

## Riesgos aceptados

| Riesgo | Justificación |
|---|---|
| El evento de Kafka se publica antes de confirmar la transacción (sin patrón *outbox*) | Si la base falla justo después, el aviso queda enviado; los consumidores son idempotentes. El patrón outbox queda como mejora. |
| Una cuenta desactivada conserva su sesión hasta que vence el JWT (24 h) | Los JWT son *stateless*; revocarlos requiere una lista negra compartida. |
| Registro de asistencia sin ventana horaria en desarrollo | `app.asistencia.validar-fecha` la habilita en producción; se desactiva para la demo. |
| Mercado Pago en modo sandbox | El proyecto es académico; no se procesan pagos reales. |
