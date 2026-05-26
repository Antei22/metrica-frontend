import type { HomeworkStatus, Lesson, SubmissionStatus } from "../types/domain";

export const HOMEWORK_FILE_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf";

export const STAR_GRADES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function formatStars(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Без оценки";
  }

  return value.toLocaleString("ru-RU");
}

export function normalizeHalfStepValue(
  value: string | number,
  { max = 1000, min = 0.5 }: { max?: number; min?: number } = {},
) {
  const parsed = typeof value === "number" ? value : Number(value.replace(",", "."));

  if (!Number.isFinite(parsed)) {
    return "";
  }

  const rounded = Math.round(parsed * 2) / 2;
  const normalized = Math.min(max, Math.max(min, rounded));
  return String(normalized);
}

export function parseHalfStepValue(
  value: string,
  options?: { max?: number; min?: number },
) {
  const normalized = normalizeHalfStepValue(value, options);

  if (!normalized) {
    return null;
  }

  return Number(normalized.replace(",", "."));
}

export function getHomeworkStatusLabel(status: HomeworkStatus | SubmissionStatus) {
  if (status === "checked") {
    return "Проверено";
  }

  if (status === "sent" || status === "submitted") {
    return "На проверке";
  }

  return "Не отправлено";
}

export function getHomeworkStatusClasses(status: HomeworkStatus | SubmissionStatus) {
  if (status === "checked") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "sent" || status === "submitted") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getDateOnlyTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day).getTime();
}

function getTodayTimestamp() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

export function isHomeworkDeadlineMissed(
  lesson:
    | Pick<
        Lesson,
        "homeworkDeadline" | "homeworkDeadlineMissed" | "homeworkStatus" | "submission"
      >
    | null
    | undefined,
) {
  if (lesson?.homeworkDeadlineMissed) {
    return true;
  }

  const deadline = getDateOnlyTimestamp(lesson?.homeworkDeadline);

  if (!lesson || deadline === null) {
    return false;
  }

  const submittedAt = getDateOnlyTimestamp(lesson.submission?.submittedAt);

  if (submittedAt !== null) {
    return submittedAt > deadline;
  }

  if (lesson.homeworkStatus !== "checked") {
    return deadline < getTodayTimestamp();
  }

  return false;
}

export function isSubmittedAfterHomeworkDeadline(
  homeworkDeadline: string | null | undefined,
  submittedAt: string | null | undefined,
  fallbackMissed = false,
) {
  if (!submittedAt) {
    return false;
  }

  const deadline = getDateOnlyTimestamp(homeworkDeadline);
  const submitted = getDateOnlyTimestamp(submittedAt);

  if (deadline === null || submitted === null) {
    return fallbackMissed;
  }

  return submitted > deadline;
}
