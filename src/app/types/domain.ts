export type UserRole = "tutor" | "student";

export interface CurrentUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  role: UserRole;
}

export interface AuthSession {
  user: CurrentUser;
}

export type StudentSubmissionStatus = "none" | "pending" | "checked";

export interface TutorStudent {
  id: number;
  studentId: number;
  fullName: string;
  subject: string | null;
  classInfo: string | null;
  lastSubmissionId: number | null;
  lastSubmissionStatus: StudentSubmissionStatus;
}

export type LessonFileKind = "material" | "homework_task" | "submission";

export interface LessonMaterial {
  id: string;
  fileId: number | null;
  name: string;
  url: string;
  kind: LessonFileKind;
  mimeType: string | null;
}

export type SubmissionStatus = "submitted" | "checked";
export type HomeworkStatus = "not_sent" | "sent" | "checked";

export interface HomeworkSubmission {
  id: number;
  status: SubmissionStatus;
  comment: string | null;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: string | null;
}

export interface Lesson {
  id: number;
  tutorStudentId: number;
  date: string | null;
  time: string | null;
  topic: string | null;
  meetLink: string | null;
  homeworkDone: boolean;
  homeworkDeadline: string | null;
  homeworkStatus: HomeworkStatus;
  studentName: string | null;
  tutorName: string | null;
  subject: string | null;
  classInfo: string | null;
  materials: LessonMaterial[];
  homeworkTaskFiles: LessonMaterial[];
  submission: HomeworkSubmission | null;
}

export interface LessonCollection {
  upcoming: Lesson[];
  past: Lesson[];
}

export interface HomeworkReview {
  id: number;
  student: string;
  lessonDate: string | null;
  lessonTopic: string | null;
  fileUrl: string | null;
  fileName: string | null;
  status: SubmissionStatus;
  comment: string | null;
}

export interface UploadedFileRef {
  fileId: number;
}
