import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import { mapLesson } from "./mappers";
import type { LessonCollection } from "../types/domain";

interface CreateLessonInput {
  tutorStudentId: number;
  date: string;
  time: string;
  topic: string;
  meetLink: string;
  homeworkDeadline: string;
  materialFileIds: number[];
  homeworkTaskFileIds: number[];
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

export async function createTutorLesson(input: CreateLessonInput) {
  const payload = await apiRequest(apiConfig.tutor.lessons, {
    method: "POST",
    body: JSON.stringify({
      tutor_student_id: input.tutorStudentId,
      date: input.date,
      time: input.time,
      topic: input.topic,
      meet_link: input.meetLink || null,
      homework_deadline: input.homeworkDeadline || null,
      material_file_ids: input.materialFileIds,
      homework_task_file_ids: input.homeworkTaskFileIds,
    }),
  });

  return mapLesson(payload);
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
