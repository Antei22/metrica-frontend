import { apiConfig } from "./endpoints";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  retryOnAuth?: boolean;
}

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

function joinApiPath(baseUrl: string, path: string) {
  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (ABSOLUTE_URL_PATTERN.test(baseUrl)) {
    return `${baseUrl}${normalizedPath}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

async function buildApiError(response: Response) {
  const payload = await parseResponse(response);

  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = payload.detail;
    if (typeof detail === "string") {
      return new ApiError(response.status, detail);
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return new ApiError(response.status, payload.trim());
  }

  return new ApiError(response.status, `Request failed with status ${response.status}`);
}

async function tryRefreshSession() {
  const response = await fetch(joinApiPath(apiConfig.baseUrl, apiConfig.auth.refresh), {
    method: "POST",
    credentials: "include",
  });

  return response.ok;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type") && init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(joinApiPath(apiConfig.baseUrl, path), {
    credentials: "include",
    ...init,
    headers,
  });

  const shouldRetry =
    response.status === 401 &&
    options.retryOnAuth !== false &&
    path !== apiConfig.auth.login &&
    path !== apiConfig.auth.register &&
    path !== apiConfig.auth.refresh &&
    path !== apiConfig.auth.me;

  if (shouldRetry && (await tryRefreshSession())) {
    return apiRequest<T>(path, init, { ...options, retryOnAuth: false });
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await parseResponse(response)) as T;
}

export function resolveApiUrl(path: string | null | undefined) {
  if (!path) {
    return "";
  }

  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (ABSOLUTE_URL_PATTERN.test(apiConfig.baseUrl)) {
    return `${apiConfig.baseUrl}${normalizedPath}`;
  }

  if (normalizedPath.startsWith(apiConfig.baseUrl)) {
    return normalizedPath;
  }

  return `${apiConfig.baseUrl}${normalizedPath}`;
}
