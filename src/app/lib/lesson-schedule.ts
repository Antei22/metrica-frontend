import {
  addDays,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import type { Lesson } from "../types/domain";

function getComparableDate(date: string | null | undefined, time: string | null | undefined) {
  if (!date) {
    return Number.NEGATIVE_INFINITY;
  }

  return new Date(`${date}T${time || "00:00"}:00`).getTime();
}

export function compareLessonsByDate(first: Lesson, second: Lesson) {
  return getComparableDate(first.date, first.time) - getComparableDate(second.date, second.time);
}

export function getCurrentWeekStart() {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

export function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getLessonsForWeek(lessons: Lesson[], weekStart: Date) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  return lessons
    .filter((lesson) => {
      if (!lesson.date) {
        return false;
      }

      const lessonDate = parseISO(lesson.date);
      return lessonDate >= weekStart && lessonDate <= weekEnd;
    })
    .sort(compareLessonsByDate);
}

export function getLessonsForDay(lessons: Lesson[], day: Date) {
  return lessons.filter((lesson) => lesson.date && parseISO(lesson.date).getTime() === day.getTime());
}

export function formatWeekLabel(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);

  if (isSameMonth(weekStart, weekEnd)) {
    return `${format(weekStart, "d", { locale: ru })} - ${format(weekEnd, "d MMMM yyyy", { locale: ru })}`;
  }

  return `${format(weekStart, "d MMMM", { locale: ru })} - ${format(weekEnd, "d MMMM yyyy", {
    locale: ru,
  })}`;
}

export function getNearestUpcomingLesson(lessons: Lesson[]) {
  return [...lessons].sort(compareLessonsByDate)[0] || null;
}

export function getLastScheduledLesson(lessons: Lesson[]) {
  return [...lessons].sort(compareLessonsByDate).at(-1) || null;
}
