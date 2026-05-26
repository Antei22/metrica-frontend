import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import { mapLesson, mapParentChild } from "./mappers";
import type { LessonCollection } from "../types/domain";

function mapLessonCollection(payload: unknown): LessonCollection {
  if (Array.isArray(payload)) {
    return {
      upcoming: payload.map(mapLesson),
      past: [],
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      upcoming: [],
      past: [],
    };
  }

  const record = payload as { upcoming?: unknown; past?: unknown };

  return {
    upcoming: Array.isArray(record.upcoming) ? record.upcoming.map(mapLesson) : [],
    past: Array.isArray(record.past) ? record.past.map(mapLesson) : [],
  };
}

export async function listParentChildren() {
  const payload = await apiRequest<unknown[]>(apiConfig.parent.children);
  return payload.map(mapParentChild);
}

export async function addParentChild(email: string) {
  const payload = await apiRequest(apiConfig.parent.children, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return mapParentChild(payload);
}

export async function listParentLessons(studentId?: number | null) {
  const endpoint = studentId
    ? `${apiConfig.parent.lessons}?student_id=${encodeURIComponent(studentId)}`
    : apiConfig.parent.lessons;
  const payload = await apiRequest(endpoint);
  return mapLessonCollection(payload);
}

export async function getParentLesson(lessonId: number | string) {
  const payload = await apiRequest(apiConfig.parent.lessonById(lessonId));
  return mapLesson(payload);
}
