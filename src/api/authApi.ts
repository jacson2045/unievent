import { api } from "./client";
import {
  AuthUser,
  mapRolBackendToFrontend,
  mapRolFrontendToBackend,
  saveAuth,
  Role,
} from "../utils/auth";

export interface LoginPayload {
  correo: string;
  password: string;
}

export interface RegisterPayload {
  nombreCompleto: string;
  correo: string;
  password: string;
  rol: Role;
}

interface BackendAuthResponse {
  token: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
}

function adaptResponse(res: BackendAuthResponse): AuthUser {
  const rol = mapRolBackendToFrontend(res.rol);
  return saveAuth(res.token, {
    nombreCompleto: res.nombreCompleto,
    correo: res.correo,
    rol,
  });
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const res = await api.post<BackendAuthResponse>("/api/auth/login", {
    service: "auth",
    rawBody: {
      correo: payload.correo,
      password: payload.password,
    },
  });
  return adaptResponse(res);
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const res = await api.post<BackendAuthResponse>("/api/auth/registro", {
    service: "auth",
    rawBody: {
      nombreCompleto: payload.nombreCompleto,
      correo: payload.correo,
      password: payload.password,
      rol: mapRolFrontendToBackend(payload.rol),
    },
  });
  return adaptResponse(res);
}
