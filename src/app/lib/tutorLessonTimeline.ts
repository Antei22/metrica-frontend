import { isValid, parse, parseISO, set } from "date-fns";
import type { Lesson } from "../types/domain";

function parseLessonDate(date: string) {
  const isoDate = parseISO(date);

  if (isValid(isoDate)) {
    return isoDate;
  }

  const localDate = parse(date, "yyyy-MM-dd", new Date());
  return isValid(localDate) ? localDate : null;
}

function applyLessonTime(date: Date, time: string | null) {
  if (!time) {
    return date;
  }

  const [hours = "0", minutes = "0", seconds = "0"] = time.split(":");
  const parsedHours = Number.parseInt(hours, 10);
  const parsedMinutes = Number.parseInt(minutes, 10);
  const parsedSeconds = Number.parseInt(seconds, 10);

  if (
    !Number.isFinite(parsedHours) ||
    !Number.isFinite(parsedMinutes) ||
    !Number.isFinite(parsedSeconds)
  ) {
    return date;
  }

  return set(date, {
    hours: parsedHours,
    minutes: parsedMinutes,
    seconds: parsedSeconds,
    milliseconds: 0,
  });
}

export function getLessonTimestamp(lesson: Lesson) {
  if (!lesson.date) {
    return null;
  }

  const parsedDate = parseLessonDate(lesson.date);

  if (!parsedDate) {
    return null;
  }

  const dateWithTime = applyLessonTime(parsedDate, lesson.time);
  const timestamp = dateWithTime.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function compareLessonsChronologically(first: Lesson, second: Lesson) {
  const firstTimestamp = getLessonTimestamp(first);
  const secondTimestamp = getLessonTimestamp(second);

  if (firstTimestamp === null && secondTimestamp === null) {
    return first.id - second.id;
  }

  if (firstTimestamp === null) {
    return 1;
  }

  if (secondTimestamp === null) {
    return -1;
  }

  return firstTimestamp - secondTimestamp;
}

export function sortLessonsChronologically(lessons: Lesson[]) {
  return [...lessons].sort(compareLessonsChronologically);
}

export function getNearestUpcomingLesson(lessons: Lesson[], now = Date.now()) {
  return sortLessonsChronologically(lessons).find((lesson) => {
    const timestamp = getLessonTimestamp(lesson);
    return timestamp !== null && timestamp >= now;
  }) || null;
}

export function getLatestPastLesson(lessons: Lesson[], now = Date.now()) {
  const sortedLessons = sortLessonsChronologically(lessons);

  for (let index = sortedLessons.length - 1; index >= 0; index -= 1) {
    const lesson = sortedLessons[index];
    const timestamp = getLessonTimestamp(lesson);

    if (timestamp !== null && timestamp < now) {
      return lesson;
    }
  }

  return null;
}
