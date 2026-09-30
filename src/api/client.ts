import { getToken, clearAuth } from "../utils/auth";

const BASE_URLS = {
  auth: "http://localhost:8082",
  event: "http://localhost:8080",
  enrollment: "http://localhost:8083",
} as const;

export type ServiceName = keyof typeof BASE_URLS;

export interface ApiError {
  message: string;
  status: number;
}

export class HttpError extends Error implements ApiError {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

export function getBaseUrl(service: ServiceName): string {
  return BASE_URLS[service];
}

interface RequestOptions extends RequestInit {
  service?: ServiceName;
  requiresAuth?: boolean;
  rawBody?: unknown;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    service = "auth",
    requiresAuth = false,
    headers,
    body,
    rawBody,
    ...rest
  } = options;

  const baseUrl = getBaseUrl(service);
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (rawBody !== undefined && !(rawBody instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      throw new HttpError("No hay sesión iniciada", 401);
    }
  }

  const requestBody = rawBody !== undefined
    ? rawBody instanceof FormData
      ? rawBody
      : JSON.stringify(rawBody)
    : body;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: requestBody as BodyInit | null | undefined,
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      let message: string;
      if (isJson && typeof data === "object" && data !== null) {
        message =
          (data as { message?: string }).message ||
          (data as { error?: string }).error ||
          (data as { path?: string; error?: string; status?: number }).error ||
          `Error ${response.status}`;
      } else if (typeof data === "string" && data) {
        message = data;
      } else {
        message = `Error ${response.status}: ${response.statusText}`;
      }

      if (response.status === 401 && requiresAuth) {
        clearAuth();
      }

      throw new HttpError(message, response.status);
    }

    return data as T;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof TypeError) {
      throw new HttpError(
        "No se pudo conectar con el servidor. Verifica que los microservicios estén ejecutándose.",
        0,
      );
    }
    throw new HttpError((err as Error).message || "Error desconocido", 500);
  }
}

export const api = {
  get: <T>(endpoint: string, opts: Omit<RequestOptions, "method"> = {}) =>
    apiRequest<T>(endpoint, { ...opts, method: "GET" }),
  post: <T>(endpoint: string, opts: Omit<RequestOptions, "method"> = {}) =>
    apiRequest<T>(endpoint, { ...opts, method: "POST" }),
  put: <T>(endpoint: string, opts: Omit<RequestOptions, "method"> = {}) =>
    apiRequest<T>(endpoint, { ...opts, method: "PUT" }),
  delete: <T>(endpoint: string, opts: Omit<RequestOptions, "method"> = {}) =>
    apiRequest<T>(endpoint, { ...opts, method: "DELETE" }),
  patch: <T>(endpoint: string, opts: Omit<RequestOptions, "method"> = {}) =>
    apiRequest<T>(endpoint, { ...opts, method: "PATCH" }),
};
