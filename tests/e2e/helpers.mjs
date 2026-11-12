// Utilidades de las pruebas integrales: cliente HTTP contra el API Gateway y esperas
// para los efectos asíncronos (Kafka).

export const GATEWAY = process.env.E2E_GATEWAY_URL ?? "http://localhost:8000";
export const EUREKA = process.env.E2E_EUREKA_URL ?? "http://localhost:8761";

/** Sufijo único por ejecución: las pruebas se pueden repetir sin chocar con datos previos. */
export const RUN = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

/**
 * Llama al gateway y devuelve { status, body }. Nunca lanza por códigos HTTP:
 * cada prueba verifica explícitamente el código esperado (incluidos los de error).
 */
export async function call(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(`${GATEWAY}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* respuesta no JSON */
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

export const get = (path, opts) => call("GET", path, opts);
export const post = (path, body, opts = {}) => call("POST", path, { ...opts, body });
export const put = (path, body, opts = {}) => call("PUT", path, { ...opts, body });
export const del = (path, opts) => call("DELETE", path, opts);

/** Reintenta `fn` hasta que devuelva un valor "verdadero" o se agote el tiempo (eventos Kafka). */
export async function eventually(fn, { timeoutMs = 20000, intervalMs = 500, what = "condición" } = {}) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    last = await fn();
    if (last) return last;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Tiempo agotado esperando: ${what} (último valor: ${JSON.stringify(last)})`);
}

/** Registra un usuario y devuelve { token, correo, password }. */
export async function registrar(rol, alias) {
  const correo = `e2e.${alias}.${RUN}@upeu.edu.pe`;
  const password = `E2e-${RUN}-Clave`;
  const r = await post("/api/auth/registro", {
    nombreCompleto: `E2E ${alias} ${RUN}`,
    correo,
    password,
    rol,
  });
  if (r.status !== 201) throw new Error(`No se pudo registrar ${alias}: ${r.status} ${JSON.stringify(r.body)}`);
  return { token: r.body.token, correo, password };
}

/** Fecha ISO local (sin zona) a N días desde hoy, formato que acepta el backend. */
export function enDias(dias, hora = 10) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00:00`;
}

export function evento(nombre, extra = {}) {
  return {
    nombre: `${nombre} ${RUN}`,
    descripcion: "Evento creado por las pruebas integrales",
    fecha: enDias(30),
    lugar: "Aula E2E",
    capacidad: 20,
    precio: 0,
    categoriaId: 1,
    ...extra,
  };
}
