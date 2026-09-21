export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, ""),
  auth: {
    register: "/auth/register",
    registerInvite: (token: string) => `/auth/register/invite/${token}`,
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    me: "/auth/me",
    resendVerification: "/auth/resend-verification",
    verifyEmail: "/auth/verify-email",
    invitePreview: (token: string) => `/auth/invite/${token}`,
  },
  tutor: {
    students: "/tutor/students",
    studentById: (tutorStudentId: number | string) =>
      `/tutor/students/${tutorStudentId}`,
    inviteStudent: "/tutor/students/invite",
    inviteParent: (tutorStudentId: number | string) =>
      `/tutor/students/${tutorStudentId}/invite-parent`,
    lessons: "/tutor/lessons",
    lessonById: (lessonId: number | string) => `/tutor/lessons/${lessonId}`,
    aiReview: (lessonId: number | string) =>
      `/tutor/lessons/${lessonId}/ai-review`,
    aiHistory: (lessonId: number | string) =>
      `/tutor/lessons/${lessonId}/ai-history`,
    aiProgress: (lessonId: number | string) =>
      `/tutor/lessons/${lessonId}/ai-progress`,
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
    aiReview: (lessonId: number | string) =>
      `/student/lessons/${lessonId}/ai-review`,
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
