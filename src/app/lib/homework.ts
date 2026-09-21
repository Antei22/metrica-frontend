import type {
  HomeworkReview,
  HomeworkStatus,
  Lesson,
  SubmissionStatus,
} from "../types/domain";

export const HOMEWORK_FILE_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf";

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
    return "border-success/20 bg-success-soft text-ink";
  }

  if (status === "sent" || status === "submitted") {
    return "border-warning/20 bg-warning-soft text-ink";
  }

  return "border-border bg-panel text-muted-foreground";
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

export type HomeworkStatusView = {
  label: string;
  className: string;
  isPendingReview: boolean;
};

export function hasHomeworkTask(lesson: Lesson) {
  return Boolean(lesson.homeworkDeadline || lesson.homeworkTaskFiles.length > 0);
}

export function getHomeworkStatusView(lesson: Lesson | null): HomeworkStatusView {
  if (lesson?.homeworkStatus === "checked") {
    return {
      label: "Проверено",
      className: "border-success/20 bg-success-soft text-ink",
      isPendingReview: false,
    };
  }

  if (lesson?.homeworkStatus === "sent") {
    return {
      label: "На проверке",
      className: "border-blue/20 bg-panel-blue text-ink",
      isPendingReview: true,
    };
  }

  if (lesson && isHomeworkDeadlineMissed(lesson)) {
    return {
      label: "Еще не отправлено",
      className: "border-danger/20 bg-danger-soft text-ink",
      isPendingReview: false,
    };
  }

  return {
    label: "Еще не отправлено",
    className: "border-border bg-panel text-muted-foreground",
    isPendingReview: false,
  };
}

export type HomeworkCardState = "not_sent" | "overdue" | "sent" | "checked";

export function getHomeworkCardState(lesson: Lesson): HomeworkCardState {
  if (lesson.homeworkStatus === "checked") {
    return "checked";
  }

  if (lesson.homeworkStatus === "sent") {
    return "sent";
  }

  if (isHomeworkDeadlineMissed(lesson)) {
    return "overdue";
  }

  return "not_sent";
}

function getCreatedTimestamp(lesson: Lesson) {
  // createdAt с бэка — naive ISO без TZ; Date.parse трактует как local,
  // единообразно для всех строк, поэтому сравнение между уроками корректно.
  const parsed = lesson.createdAt ? Date.parse(lesson.createdAt) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function compareLessonsByCreatedDesc(a: Lesson, b: Lesson) {
  const diff = getCreatedTimestamp(b) - getCreatedTimestamp(a);

  if (diff !== 0) {
    return diff;
  }

  return b.id - a.id;
}

export interface HomeworkStack {
  tutorStudentId: number;
  studentName: string;
  /** По убыванию createdAt: [0] — верхняя (самая свежая) карточка. */
  lessons: Lesson[];
}

/**
 * Стопки актуальных ДЗ по ученикам и плоский список погашенных.
 * Актуальное = НЕ (проверено И ученику уже назначено более новое ДЗ).
 * Непроверенное/неотправленное никогда не гаснет автоматически.
 */
export function buildHomeworkStacks(lessons: Lesson[]): {
  active: HomeworkStack[];
  settled: Lesson[];
} {
  const grouped = new Map<number, Lesson[]>();

  for (const lesson of lessons) {
    if (!hasHomeworkTask(lesson)) {
      continue;
    }

    const current = grouped.get(lesson.tutorStudentId) || [];
    current.push(lesson);
    grouped.set(lesson.tutorStudentId, current);
  }

  const active: HomeworkStack[] = [];
  const settled: Lesson[] = [];

  for (const [tutorStudentId, group] of grouped) {
    const ordered = [...group].sort(compareLessonsByCreatedDesc);
    const stackLessons: Lesson[] = [];

    ordered.forEach((lesson, index) => {
      // index > 0 означает, что есть более новое Lesson с ДЗ (фильтр уже применён).
      if (index > 0 && lesson.homeworkStatus === "checked") {
        settled.push(lesson);
      } else {
        stackLessons.push(lesson);
      }
    });

    active.push({
      tutorStudentId,
      studentName: stackLessons[0]?.studentName || "",
      lessons: stackLessons,
    });
  }

  active.sort((a, b) => compareLessonsByCreatedDesc(a.lessons[0], b.lessons[0]));
  settled.sort(compareLessonsByCreatedDesc);

  return { active, settled };
}

export function applyReviewToLesson(lesson: Lesson, review: HomeworkReview): Lesson {
  return {
    ...lesson,
    homeworkStatus: "checked",
    homeworkGrade: review.grade,
    homeworkStars: review.starsAwarded,
    checkedFile: review.checkedFiles[0] ?? lesson.checkedFile,
    submission: lesson.submission
      ? {
          ...lesson.submission,
          status: "checked",
          comment: review.comment,
          grade: review.grade,
          starsAwarded: review.starsAwarded,
          checkedFiles: review.checkedFiles,
          checkedFileUrl: review.checkedFileUrl,
          checkedFileName: review.checkedFileName,
        }
      : lesson.submission,
  };
}
