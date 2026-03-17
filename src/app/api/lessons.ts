import { apiConfig } from "./endpoints";
import { ApiError, apiRequest } from "./client";
import { mapLesson } from "./mappers";
import type { LessonCollection } from "../types/domain";

export interface TutorLessonInput {
  tutorStudentId: number;
  date: string;
  time: string;
  topic: string;
  meetLink: string;
  homeworkDeadline: string;
  materialFileIds?: number[];
  homeworkTaskFileIds?: number[];
}

const UPDATE_UNSUPPORTED_MESSAGE = "Изменение занятий пока не поддерживается сервером.";
const DELETE_UNSUPPORTED_MESSAGE = "Удаление занятий пока не поддерживается сервером.";

function isFallbackCandidate(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 404 || error.status === 405 || error.status === 501)
  );
}

async function tryLessonRequests<T>(requests: Array<() => Promise<T>>) {
  let lastError: unknown = null;

  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      if (!isFallbackCandidate(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
}

function toUnsupportedMutationError(error: unknown, detail: string) {
  if (error instanceof ApiError) {
    return new ApiError(error.status, detail);
  }

  return error;
}

function buildLessonPayload(input: TutorLessonInput) {
  const payload: Record<string, unknown> = {
    tutor_student_id: input.tutorStudentId,
    date: input.date,
    time: input.time,
    topic: input.topic,
    meet_link: input.meetLink || null,
    homework_deadline: input.homeworkDeadline || null,
  };

  if (input.materialFileIds) {
    payload.material_file_ids = input.materialFileIds;
  }

  if (input.homeworkTaskFileIds) {
    payload.homework_task_file_ids = input.homeworkTaskFileIds;
  }

  return payload;
}

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

export async function listTutorLessons() {
  const payload = await apiRequest(apiConfig.tutor.lessons);
  return mapLessonCollection(payload);
}

export async function createTutorLesson(input: TutorLessonInput) {
  const payload = await apiRequest(apiConfig.tutor.lessons, {
    method: "POST",
    body: JSON.stringify(buildLessonPayload(input)),
  });

  return mapLesson(payload);
}

export async function updateTutorLesson(lessonId: number | string, input: TutorLessonInput) {
  const body = JSON.stringify(buildLessonPayload(input));
  let payload: unknown | null;

  try {
    payload = await tryLessonRequests([
      () =>
        apiRequest<unknown | null>(apiConfig.tutor.lessonById(lessonId), {
          method: "PATCH",
          body,
        }),
      () =>
        apiRequest<unknown | null>(apiConfig.tutor.lessonById(lessonId), {
          method: "PUT",
          body,
        }),
    ]);
  } catch (error) {
    throw toUnsupportedMutationError(error, UPDATE_UNSUPPORTED_MESSAGE);
  }

  return payload ? mapLesson(payload) : null;
}

export async function deleteTutorLesson(lessonId: number | string) {
  try {
    await tryLessonRequests([
      () =>
        apiRequest(apiConfig.tutor.lessonById(lessonId), {
          method: "DELETE",
        }),
    ]);
  } catch (error) {
    throw toUnsupportedMutationError(error, DELETE_UNSUPPORTED_MESSAGE);
  }
}

export async function listStudentLessons() {
  const payload = await apiRequest(apiConfig.student.lessons);
  return mapLessonCollection(payload);
}

export async function getStudentLesson(lessonId: number | string) {
  const payload = await apiRequest(apiConfig.student.lessonById(lessonId));
  return mapLesson(payload);
}

export async function submitStudentHomework(lessonId: number | string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest(apiConfig.student.submitHomework(lessonId), {
    method: "POST",
    body: formData,
  });
}
