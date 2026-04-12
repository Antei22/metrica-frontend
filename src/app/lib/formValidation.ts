export const FIELD_LIMITS = {
  lessonTopic: 100,
  personName: 100,
  email: 254,
  password: 255,
  meetLink: 2048,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalize(value: string) {
  return value.trim();
}

export function validateFirstName(value: string) {
  const normalized = normalize(value);

  if (!normalized) {
    return "Введите имя.";
  }

  if (normalized.length > FIELD_LIMITS.personName) {
    return "Введите более короткое имя.";
  }

  return null;
}

export function validateLastName(value: string) {
  const normalized = normalize(value);

  if (!normalized) {
    return "Введите фамилию.";
  }

  if (normalized.length > FIELD_LIMITS.personName) {
    return "Введите более короткую фамилию.";
  }

  return null;
}

export function validateEmail(value: string) {
  const normalized = normalize(value);

  if (!normalized) {
    return "Введите email.";
  }

  if (normalized.length > FIELD_LIMITS.email) {
    return "Введите более короткий email.";
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return "Введите корректный email.";
  }

  return null;
}

export function validatePassword(value: string) {
  if (!value) {
    return "Введите пароль.";
  }

  if (value.length < 6) {
    return "Пароль должен содержать минимум 6 символов.";
  }

  if (value.length > FIELD_LIMITS.password) {
    return "Введите более короткий пароль.";
  }

  return null;
}

export function validateLessonTopic(value: string) {
  const normalized = normalize(value);

  if (!normalized) {
    return "Введите тему занятия.";
  }

  if (normalized.length > FIELD_LIMITS.lessonTopic) {
    return "Введите более короткую тему занятия.";
  }

  return null;
}

export function validateMeetLink(value: string) {
  const normalized = normalize(value);

  if (!normalized) {
    return null;
  }

  if (normalized.length > FIELD_LIMITS.meetLink) {
    return "Ссылка на созвон слишком длинная.";
  }

  try {
    const url = new URL(normalized);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Введите корректную ссылку на созвон.";
    }
  } catch {
    return "Введите корректную ссылку на созвон.";
  }

  return null;
}

export function validateLessonTime(value: string) {
  const normalized = normalize(value);

  if (!normalized) {
    return "Р’С‹Р±РµСЂРёС‚Рµ РІСЂРµРјСЏ Р·Р°РЅСЏС‚РёСЏ.";
  }

  if (!TIME_PATTERN.test(normalized)) {
    return "Р’РІРµРґРёС‚Рµ РєРѕСЂСЂРµРєС‚РЅРѕРµ РІСЂРµРјСЏ РІ С„РѕСЂРјР°С‚Рµ ЧЧ:ММ.";
  }

  return null;
}

export function validateLessonForm(input: {
  tutorStudentId: string;
  date: string;
  time: string;
  topic: string;
  meetLink: string;
}) {
  if (!input.tutorStudentId) {
    return "Выберите ученика.";
  }

  if (!input.date) {
    return "Выберите дату занятия.";
  }

  if (!input.time) {
    return "Выберите время занятия.";
  }

  return validateLessonTime(input.time) || validateLessonTopic(input.topic) || validateMeetLink(input.meetLink);
}
