import type { Lesson, LessonMaterial } from "../types/domain";
import type { LessonFormValues } from "../components/tutor/TutorLessonFormDialog";

const LAST_MEET_LINK_STORAGE_KEY = "metrica:last-meet-link";

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function normalizeLessonTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length < 4) {
    return "";
  }

  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function getStoredMeetLink() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(LAST_MEET_LINK_STORAGE_KEY)?.trim() || "";
}

export function storeMeetLink(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedValue = value.trim();

  if (normalizedValue) {
    window.localStorage.setItem(LAST_MEET_LINK_STORAGE_KEY, normalizedValue);
    return;
  }

  window.localStorage.removeItem(LAST_MEET_LINK_STORAGE_KEY);
}

export function getDefaultCreateLessonFormValues(
  tutorStudentId = "",
): LessonFormValues {
  return {
    tutorStudentId,
    date: "",
    time: "",
    subject: "",
    topic: "",
    meetLink: getStoredMeetLink(),
    homeworkDeadline: "",
  };
}

export function appendFiles(currentFiles: File[], nextFiles: File[]) {
  const knownFiles = new Set(currentFiles.map(getFileKey));
  const appendedFiles = [...currentFiles];

  for (const file of nextFiles) {
    const fileKey = getFileKey(file);

    if (!knownFiles.has(fileKey)) {
      knownFiles.add(fileKey);
      appendedFiles.push(file);
    }
  }

  return appendedFiles;
}

export function removeFileAtIndex(files: File[], index: number) {
  return files.filter((_, fileIndex) => fileIndex !== index);
}

export function collectPersistedFileIds(files: LessonMaterial[]) {
  const ids = files
    .map((file) => file.fileId)
    .filter((fileId): fileId is number => fileId !== null && fileId > 0);

  return ids.length > 0 ? Array.from(new Set(ids)) : undefined;
}

export function mergeFileIds(existingIds: number[] | undefined, uploadedIds: number[]) {
  const mergedIds = [...(existingIds || []), ...uploadedIds].filter((id) => id > 0);
  return mergedIds.length > 0 ? Array.from(new Set(mergedIds)) : undefined;
}

export function buildLessonPayload(
  form: LessonFormValues,
  materialFileIds: number[] | undefined,
  homeworkTaskFileIds: number[] | undefined,
) {
  return {
    tutorStudentId: Number(form.tutorStudentId),
    date: form.date,
    time: normalizeLessonTime(form.time),
    subject: form.subject.trim(),
    topic: form.topic.trim(),
    meetLink: form.meetLink.trim(),
    homeworkDeadline: form.homeworkDeadline,
    materialFileIds,
    homeworkTaskFileIds,
  };
}

export function getLessonFormValues(lesson: Lesson): LessonFormValues {
  return {
    tutorStudentId: String(lesson.tutorStudentId || ""),
    date: lesson.date || "",
    time: normalizeLessonTime(lesson.time),
    subject: lesson.subject || "",
    topic: lesson.topic || "",
    meetLink: lesson.meetLink || "",
    homeworkDeadline: lesson.homeworkDeadline || "",
  };
}
