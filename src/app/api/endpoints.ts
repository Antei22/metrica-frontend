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
    lessons: "/tutor/lessons",
    lessonById: (lessonId: number | string) => `/tutor/lessons/${lessonId}`,
    pendingSubmissions: "/tutor/submissions/pending",
    checkSubmission: (submissionId: number) =>
      `/tutor/submissions/${submissionId}/check`,
    upload: "/tutor/upload",
  },
  student: {
    lessons: "/student/lessons",
    lessonById: (lessonId: number | string) => `/student/lessons/${lessonId}`,
    submitHomework: (lessonId: number | string) =>
      `/student/lessons/${lessonId}/submit-homework`,
  },
} as const;
