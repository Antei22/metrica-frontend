export function formatFullName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export function formatDate(date: string | null | undefined) {
  if (!date) {
    return "Не указана";
  }

  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(time: string | null | undefined) {
  if (!time) {
    return "—";
  }

  return time.slice(0, 5);
}

export function formatDayMonth(date: string | null | undefined) {
  if (!date) {
    return "Не указана";
  }

  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
  });
}

export function formatClock(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return formatTime(value);
  }

  return parsedDate.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateClock(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return formatTime(value);
  }

  return `${formatDate(value)} в ${formatClock(value)}`;
}

export function formatDateTime(
  date: string | null | undefined,
  time: string | null | undefined,
) {
  if (!date && !time) {
    return "Дата не указана";
  }

  return `${formatDate(date)}${time ? ` в ${formatTime(time)}` : ""}`;
}

export function formatLessonTitle(
  subject: string | null | undefined,
  topic: string | null | undefined,
  fallback = "Без названия",
) {
  const normalizedSubject = subject?.trim();
  const normalizedTopic = topic?.trim() || fallback;

  return normalizedSubject ? `${normalizedSubject}. ${normalizedTopic}` : normalizedTopic;
}

export function isPastLesson(date: string | null | undefined, time: string | null | undefined) {
  if (!date) {
    return false;
  }

  const value = new Date(`${date}T${time || "00:00"}`);
  return value.getTime() < Date.now();
}
