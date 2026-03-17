import { ApiError } from "../api/client";

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const normalizedDetail = error.detail.trim();

    if (normalizedDetail && normalizedDetail !== `Request failed with status ${error.status}`) {
      return normalizedDetail;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
