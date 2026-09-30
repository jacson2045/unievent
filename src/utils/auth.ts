export type Role = "student" | "organizer" | "admin";

export interface AuthUser {
  token: string;
  nombreCompleto: string;
  correo: string;
  rol: Role;
}

const TOKEN_KEY = "unievent_token";
const USER_KEY = "unievent_user";

export function mapRolBackendToFrontend(backendRol: string): Role {
  switch (backendRol.toUpperCase()) {
    case "ESTUDIANTE":
    case "STUDENT":
      return "student";
    case "ORGANIZADOR":
    case "ORGANIZER":
      return "organizer";
    case "ADMIN":
    case "ADMINISTRADOR":
      return "admin";
    default:
      return "student";
  }
}

export function mapRolFrontendToBackend(frontendRol: Role): string {
  switch (frontendRol) {
    case "student":
      return "ESTUDIANTE";
    case "organizer":
      return "ORGANIZADOR";
    case "admin":
      return "ADMIN";
    default:
      return "ESTUDIANTE";
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, userData: Omit<AuthUser, "token">): AuthUser {
  const user: AuthUser = { token, ...userData };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    nombreCompleto: user.nombreCompleto,
    correo: user.correo,
    rol: user.rol,
  }));
  return user;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
