// Pruebas integrales de UniEvent Pay contra el sistema REAL (todos los microservicios,
// PostgreSQL, Kafka, Eureka y el API Gateway levantados con docker compose).
//
//   pnpm test:e2e            (o: node --test tests/e2e/)
//
// Cubre el flujo principal de punta a punta, casos de error y autorización a nivel
// de objeto con DOS usuarios por rol (A/B estudiantes, O/P organizadores).

import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { EUREKA, del, enDias, evento, eventually, get, post, put, registrar, RUN } from "./helpers.mjs";

const ctx = {};

before(async () => {
  // Dos estudiantes y dos organizadores nuevos en cada ejecución.
  [ctx.A, ctx.B, ctx.O, ctx.P] = await Promise.all([
    registrar("ESTUDIANTE", "estA"),
    registrar("ESTUDIANTE", "estB"),
    registrar("ORGANIZADOR", "orgO"),
    registrar("ORGANIZADOR", "orgP"),
  ]);
});

describe("1. Plataforma: servicios registrados y saludables", () => {
  it("CP-01 los 5 servicios están registrados en Eureka", async () => {
    const res = await fetch(`${EUREKA}/eureka/apps`, { headers: { Accept: "application/json" } });
    const apps = (await res.json()).applications.application.map((a) => a.name);
    for (const s of ["API-GATEWAY", "AUTH-SERVICE", "EVENT-SERVICE", "ENROLLMENT-SERVICE", "NOTIFICATION-SERVICE"]) {
      assert.ok(apps.includes(s), `${s} no está registrado en Eureka`);
    }
  });

  it("CP-02 health check de cada servicio a través del gateway responde UP", async () => {
    for (const s of ["auth-service", "event-service", "enrollment-service", "notification-service", "discovery-server", "config-server"]) {
      const r = await get(`/monitor/${s}/health`);
      assert.equal(r.status, 200, `${s}: HTTP ${r.status}`);
      assert.equal(r.body.status, "UP", `${s} no está UP`);
    }
  });
});

describe("2. Seguridad: autenticación y roles", () => {
  it("CP-03 login con credenciales válidas devuelve un JWT", async () => {
    const r = await post("/api/auth/login", { correo: ctx.A.correo, password: ctx.A.password });
    assert.equal(r.status, 200);
    assert.match(r.body.token, /^ey/);
    assert.equal(r.body.rol, "ESTUDIANTE");
  });

  it("CP-04 [error] login con contraseña incorrecta responde 401", async () => {
    const r = await post("/api/auth/login", { correo: ctx.A.correo, password: "incorrecta-123" });
    assert.equal(r.status, 401);
  });

  it("CP-05 [error] el registro público no permite crear un ADMIN", async () => {
    const r = await post("/api/auth/registro", {
      nombreCompleto: "Intruso",
      correo: `e2e.intruso.${RUN}@upeu.edu.pe`,
      password: "Intruso-12345",
      rol: "ADMIN",
    });
    assert.equal(r.status, 400);
  });

  it("CP-06 [error] rutas protegidas sin token responden 401/403", async () => {
    assert.equal((await get("/api/auth/perfil")).status, 401);
    assert.equal((await get("/api/inscripciones")).status, 403);
    assert.equal((await post("/api/eventos", evento("Sin token"))).status, 403);
  });

  it("CP-07 [error] un estudiante no puede crear eventos (rol insuficiente)", async () => {
    const r = await post("/api/eventos", evento("Por estudiante"), { token: ctx.A.token });
    assert.equal(r.status, 403);
  });
});

describe("3. Eventos: creación y propiedad (autorización a nivel de objeto)", () => {
  it("CP-08 el organizador O crea un evento gratuito y uno de pago", async () => {
    const libre = await post("/api/eventos", evento("Charla gratuita"), { token: ctx.O.token });
    assert.equal(libre.status, 201, JSON.stringify(libre.body));
    ctx.eventoLibre = libre.body.id;

    const pago = await post("/api/eventos", evento("Taller de pago", { precio: 15 }), { token: ctx.O.token });
    assert.equal(pago.status, 201);
    ctx.eventoPago = pago.body.id;

    const mios = await get("/api/eventos/mis-eventos", { token: ctx.O.token });
    assert.deepEqual(new Set(mios.body.map((e) => e.id)), new Set([ctx.eventoLibre, ctx.eventoPago]));
  });

  it("CP-09 [error] validación: un evento con fecha pasada se rechaza con 400", async () => {
    const r = await post("/api/eventos", evento("Pasado", { fecha: enDias(-1) }), { token: ctx.O.token });
    assert.equal(r.status, 400);
  });

  it("CP-10 [dos usuarios] el organizador P NO puede editar, cancelar ni borrar el evento de O", async () => {
    const id = ctx.eventoLibre;
    assert.equal((await put(`/api/eventos/${id}`, evento("Hackeado"), { token: ctx.P.token })).status, 403);
    assert.equal((await put(`/api/eventos/${id}/cancelar`, undefined, { token: ctx.P.token })).status, 403);
    assert.equal((await del(`/api/eventos/${id}`, { token: ctx.P.token })).status, 403);
    // Y el evento sigue intacto
    const ev = await get(`/api/eventos/${id}`);
    assert.equal(ev.body.estado, "ACTIVO");
    assert.ok(ev.body.nombre.startsWith("Charla gratuita"));
  });

  it("CP-11 el dueño O sí puede editar su evento", async () => {
    const r = await put(`/api/eventos/${ctx.eventoLibre}`, evento("Charla gratuita", { capacidad: 30 }), { token: ctx.O.token });
    assert.equal(r.status, 200);
    assert.equal(r.body.capacidad, 30);
  });
});

describe("4. Flujo principal: inscripción gratuita → Kafka → notificación y contador", () => {
  it("CP-12 el estudiante A se inscribe y queda CONFIRMADA con código de asistencia", async () => {
    const r = await post("/api/inscripciones", { eventoId: ctx.eventoLibre }, { token: ctx.A.token });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.estado, "CONFIRMADA");
    assert.match(r.body.codigoAsistencia, /^UEP-/);
    ctx.inscripcionA = r.body.id;
    ctx.codigoA = r.body.codigoAsistencia;
  });

  it("CP-13 [error] inscribirse dos veces al mismo evento responde 409", async () => {
    const r = await post("/api/inscripciones", { eventoId: ctx.eventoLibre }, { token: ctx.A.token });
    assert.equal(r.status, 409);
  });

  it("CP-14 [asíncrono] event-service cuenta la inscripción (consumidor Kafka)", async () => {
    await eventually(async () => (await get(`/api/eventos/${ctx.eventoLibre}`)).body.inscritos === 1, {
      what: "inscritos = 1",
    });
  });

  it("CP-15 [asíncrono] notification-service crea la notificación para A (consumidor Kafka)", async () => {
    const notif = await eventually(
      async () => (await get("/api/notificaciones", { token: ctx.A.token })).body.find((n) => n.inscripcionId === ctx.inscripcionA),
      { what: "notificación de la inscripción" },
    );
    assert.equal(notif.tipo, "INSCRIPCION_CONFIRMADA");
    assert.match(notif.mensaje, /Charla gratuita/);
    ctx.notificacionA = notif.id;
  });

  it("CP-16 [dos usuarios] B no ve la inscripción ni las notificaciones de A", async () => {
    assert.equal((await get(`/api/inscripciones/${ctx.inscripcionA}`, { token: ctx.B.token })).status, 403);
    const deB = await get("/api/notificaciones", { token: ctx.B.token });
    assert.equal(deB.status, 200);
    assert.ok(!deB.body.some((n) => n.inscripcionId === ctx.inscripcionA), "B ve una notificación de A");
    // Tampoco puede marcarla como leída
    assert.equal((await put(`/api/notificaciones/${ctx.notificacionA}/leida`, undefined, { token: ctx.B.token })).status, 404);
  });

  it("CP-17 [dos usuarios] el organizador ve sus participantes; el otro organizador no", async () => {
    const deO = await get(`/api/inscripciones/organizador?eventoId=${ctx.eventoLibre}`, { token: ctx.O.token });
    assert.equal(deO.status, 200);
    assert.ok(deO.body.some((i) => i.id === ctx.inscripcionA));
    assert.ok(deO.body.every((i) => i.codigoAsistencia == null), "el organizador no debe recibir códigos QR");

    const deP = await get(`/api/inscripciones/organizador?eventoId=${ctx.eventoLibre}`, { token: ctx.P.token });
    assert.equal(deP.status, 403);
  });
});

describe("5. Asistencia con código QR", () => {
  it("CP-18 [dos usuarios] el organizador P no puede registrar asistencia en el evento de O", async () => {
    const r = await post("/api/inscripciones/organizador/asistencia", { codigo: ctx.codigoA }, { token: ctx.P.token });
    assert.equal(r.status, 403);
  });

  it("CP-19 [error] un código inexistente responde 404", async () => {
    const r = await post("/api/inscripciones/organizador/asistencia", { codigo: "UEP-0000-0000" }, { token: ctx.O.token });
    assert.equal(r.status, 404);
  });

  it("CP-20 el organizador O registra la asistencia de A (una sola vez)", async () => {
    const r = await post("/api/inscripciones/organizador/asistencia", { codigo: ctx.codigoA.toLowerCase() }, { token: ctx.O.token });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.inscripcionId, ctx.inscripcionA);

    const repetido = await post("/api/inscripciones/organizador/asistencia", { codigo: ctx.codigoA }, { token: ctx.O.token });
    assert.equal(repetido.status, 409);

    const mia = await get(`/api/inscripciones/${ctx.inscripcionA}`, { token: ctx.A.token });
    assert.ok(mia.body.fechaAsistencia, "A debería ver su asistencia registrada");
  });
});

describe("6. Pago con Mercado Pago y reglas de negocio", () => {
  it("CP-21 inscripción a evento de pago queda PENDIENTE y es idempotente", async () => {
    const r1 = await post("/api/inscripciones", { eventoId: ctx.eventoPago }, { token: ctx.A.token });
    assert.equal(r1.status, 201);
    assert.equal(r1.body.estado, "PENDIENTE");
    assert.equal(r1.body.requierePago, true);
    const r2 = await post("/api/inscripciones", { eventoId: ctx.eventoPago }, { token: ctx.A.token });
    assert.equal(r2.body.id, r1.body.id, "debe reutilizar la inscripción pendiente");
    ctx.inscripcionPago = r1.body.id;
  });

  it("CP-22 [dos usuarios] B no puede pagar ni consultar el pago de A", async () => {
    assert.equal((await post(`/api/inscripciones/${ctx.inscripcionPago}/pago`, undefined, { token: ctx.B.token })).status, 403);
    assert.equal((await get(`/api/inscripciones/${ctx.inscripcionPago}/pago/estado`, { token: ctx.B.token })).status, 403);
  });

  it("CP-23 se genera el checkout de Mercado Pago (si hay credenciales de prueba)", async (t) => {
    const r = await post(`/api/inscripciones/${ctx.inscripcionPago}/pago`, undefined, { token: ctx.A.token });
    if (r.status === 409 && /preferencia/.test(r.body?.message ?? "")) {
      t.skip("Mercado Pago no está configurado en este entorno");
      return;
    }
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.match(r.body.checkoutUrl, /mercadopago/);
    // Idempotencia: reintentar devuelve el mismo checkout
    const again = await post(`/api/inscripciones/${ctx.inscripcionPago}/pago`, undefined, { token: ctx.A.token });
    assert.equal(again.status, 201, JSON.stringify(again.body));
    assert.equal(again.body.checkoutUrl, r.body.checkoutUrl);

    // Regresión (bitácora H-04): un pago recién creado NO puede aparecer aprobado.
    // Antes, la referencia enviada a Mercado Pago era el id de la tabla y chocaba con
    // pagos aprobados antiguos de la misma cuenta de pruebas.
    const estado = await get(`/api/inscripciones/${ctx.inscripcionPago}/pago/estado`, { token: ctx.A.token });
    assert.equal(estado.body.estado, "PENDING");
    assert.equal(estado.body.estadoInscripcion, "PENDIENTE");
  });

  it("CP-24 [error] sin cupos: el segundo estudiante no puede inscribirse", async () => {
    const lleno = await post("/api/eventos", evento("Cupo único", { capacidad: 1 }), { token: ctx.O.token });
    assert.equal(lleno.status, 201);
    assert.equal((await post("/api/inscripciones", { eventoId: lleno.body.id }, { token: ctx.A.token })).status, 201);
    const r = await post("/api/inscripciones", { eventoId: lleno.body.id }, { token: ctx.B.token });
    assert.equal(r.status, 409);
    assert.match(r.body.message, /cupos/i);
  });

  it("CP-25 [error] un evento cancelado no acepta inscripciones y no se puede borrar con inscritos", async () => {
    assert.equal((await del(`/api/eventos/${ctx.eventoLibre}`, { token: ctx.O.token })).status, 409);
    assert.equal((await put(`/api/eventos/${ctx.eventoLibre}/cancelar`, undefined, { token: ctx.O.token })).status, 200);
    const r = await post("/api/inscripciones", { eventoId: ctx.eventoLibre }, { token: ctx.B.token });
    assert.equal(r.status, 409);
  });
});

describe("7. Administración", () => {
  it("CP-26 [error] un estudiante u organizador no accede a la gestión de usuarios", async () => {
    assert.equal((await get("/api/auth/admin/usuarios", { token: ctx.A.token })).status, 403);
    assert.equal((await get("/api/auth/admin/usuarios", { token: ctx.O.token })).status, 403);
  });

  it("CP-27 el administrador lista usuarios y puede desactivar una cuenta (si hay ADMIN_PASSWORD)", async (t) => {
    if (!process.env.ADMIN_PASSWORD) {
      t.skip("ADMIN_PASSWORD no está definida");
      return;
    }
    const login = await post("/api/auth/login", { correo: "admin@upeu.edu.pe", password: process.env.ADMIN_PASSWORD });
    assert.equal(login.status, 200);
    const admin = login.body.token;

    const usuarios = await get("/api/auth/admin/usuarios", { token: admin });
    assert.equal(usuarios.status, 200);
    const b = usuarios.body.find((u) => u.correo === ctx.B.correo);
    assert.ok(b, "el estudiante B debería estar en la lista");

    assert.equal((await put(`/api/auth/admin/usuarios/${b.id}/estado`, { activo: false }, { token: admin })).status, 200);
    const bloqueado = await post("/api/auth/login", { correo: ctx.B.correo, password: ctx.B.password });
    assert.notEqual(bloqueado.status, 200, "una cuenta desactivada no debe poder iniciar sesión");
    assert.equal((await put(`/api/auth/admin/usuarios/${b.id}/estado`, { activo: true }, { token: admin })).status, 200);
  });
});
