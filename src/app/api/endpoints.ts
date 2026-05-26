export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, ""),
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    me: "/auth/me",
  },
  tutor: {
    students: "/tutor/students",
    studentById: (tutorStudentId: number | string) =>
      `/tutor/students/${tutorStudentId}`,
    lessons: "/tutor/lessons",
    lessonById: (lessonId: number | string) => `/tutor/lessons/${lessonId}`,
    parentLessonMessage: (lessonId: number | string) =>
      `/tutor/lessons/${lessonId}/parent-message`,
    submissions: "/tutor/submissions",
    pendingSubmissions: "/tutor/submissions/pending",
    checkSubmission: (submissionId: number) =>
      `/tutor/submissions/${submissionId}/check`,
    studentGamification: (tutorStudentId: number | string) =>
      `/tutor/students/${tutorStudentId}/gamification`,
    bonusTasks: (tutorStudentId: number | string) =>
      `/tutor/students/${tutorStudentId}/bonus-tasks`,
    bonusTaskById: (taskId: number | string) => `/tutor/bonus-tasks/${taskId}`,
    upload: "/tutor/upload",
  },
  student: {
    lessons: "/student/lessons",
    lessonById: (lessonId: number | string) => `/student/lessons/${lessonId}`,
    gamification: "/student/gamification",
    submitHomework: (lessonId: number | string) =>
      `/student/lessons/${lessonId}/submit-homework`,
  },
  parent: {
    children: "/parent/children",
    lessons: "/parent/lessons",
    lessonById: (lessonId: number | string) => `/parent/lessons/${lessonId}`,
  },
} as const;
