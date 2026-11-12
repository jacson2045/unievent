import { api } from "./client";
import type { Profile } from "./authApi";

const authOpts = { service: "auth" as const, requiresAuth: true };

export type BackendRole = "ESTUDIANTE" | "ORGANIZADOR" | "ADMIN";

export function listUsers(): Promise<Profile[]> {
  return api.get<Profile[]>("/api/auth/admin/usuarios", authOpts);
}

export function setUserActive(id: number, activo: boolean): Promise<Profile> {
  return api.put<Profile>(`/api/auth/admin/usuarios/${id}/estado`, { ...authOpts, rawBody: { activo } });
}

export function setUserRole(id: number, rol: BackendRole): Promise<Profile> {
  return api.put<Profile>(`/api/auth/admin/usuarios/${id}/rol`, { ...authOpts, rawBody: { rol } });
}

/** Servicios que el gateway expone en /monitor/{nombre}/health. */
export const MONITORED_SERVICES = [
  { id: "auth-service", label: "Auth Service", port: 8082, desc: "Registro, login, JWT y usuarios" },
  { id: "event-service", label: "Event Service", port: 8080, desc: "Eventos, categorías y contador de inscritos" },
  { id: "enrollment-service", label: "Enrollment Service", port: 8083, desc: "Inscripciones, pagos (Mercado Pago) y asistencia" },
  { id: "notification-service", label: "Notification Service", port: 8084, desc: "Notificaciones a partir de eventos Kafka" },
  { id: "discovery-server", label: "Discovery Server (Eureka)", port: 8761, desc: "Registro y descubrimiento de servicios" },
  { id: "config-server", label: "Config Server", port: 18888, desc: "Configuración centralizada" },
] as const;

export interface HealthComponent {
  status: string;
  details?: Record<string, unknown>;
  components?: Record<string, HealthComponent>;
}

export interface ServiceHealth {
  id: string;
  status: "UP" | "DOWN" | "UNKNOWN";
  latencyMs: number | null;
  components: Record<string, HealthComponent>;
  error?: string;
}

/** Consulta el health check de un servicio a través del gateway y mide la latencia. */
export async function getServiceHealth(id: string): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const res = await api.get<HealthComponent>(`/monitor/${id}/health`, { service: "gateway" });
    return {
      id,
      status: res.status === "UP" ? "UP" : "DOWN",
      latencyMs: Math.round(performance.now() - start),
      components: res.components ?? {},
    };
  } catch (err) {
    // Spring devuelve 503 con el detalle cuando algún componente está DOWN.
    return {
      id,
      status: "DOWN",
      latencyMs: Math.round(performance.now() - start),
      components: {},
      error: err instanceof Error ? err.message : "Sin respuesta",
    };
  }
}
