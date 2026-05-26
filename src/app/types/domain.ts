export type UserRole = "tutor" | "student" | "parent";

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
  email: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  subject: string | null;
  classInfo: string | null;
  lastSubmissionId: number | null;
  lastSubmissionStatus: StudentSubmissionStatus;
  starRewardsEnabled: boolean;
  parentContactEnabled: boolean;
  starGoal: number | null;
  starRewardTitle: string | null;
  earnedStars: number;
}

export type LessonFileKind = "material" | "homework_task" | "submission" | "parent_message";

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
  studentComment: string | null;
  fileUrl: string | null;
  fileName: string | null;
  files: LessonMaterial[];
  checkedFileUrl: string | null;
  checkedFileName: string | null;
  checkedFiles: LessonMaterial[];
  grade: number | null;
  starsAwarded: number;
  submittedAt: string | null;
}

export interface Lesson {
  id: number;
  tutorStudentId: number;
  starRewardsEnabled: boolean;
  date: string | null;
  time: string | null;
  topic: string | null;
  meetLink: string | null;
  homeworkDone: boolean;
  homeworkDeadline: string | null;
  homeworkDeadlineMissed: boolean;
  homeworkStatus: HomeworkStatus;
  studentName: string | null;
  tutorName: string | null;
  subject: string | null;
  classInfo: string | null;
  materials: LessonMaterial[];
  homeworkTaskFiles: LessonMaterial[];
  parentMessageFiles: LessonMaterial[];
  parentComment: string | null;
  submission: HomeworkSubmission | null;
  checkedFile: LessonMaterial | null;
  homeworkGrade: number | null;
  homeworkStars: number;
}

export interface LessonCollection {
  upcoming: Lesson[];
  past: Lesson[];
}

export interface HomeworkReview {
  id: number;
  student: string;
  starRewardsEnabled: boolean;
  lessonDate: string | null;
  lessonTopic: string | null;
  fileUrl: string | null;
  fileName: string | null;
  files: LessonMaterial[];
  checkedFileUrl: string | null;
  checkedFileName: string | null;
  checkedFiles: LessonMaterial[];
  status: SubmissionStatus;
  comment: string | null;
  studentComment: string | null;
  submittedAt: string | null;
  homeworkDeadline: string | null;
  homeworkDeadlineMissed: boolean;
  grade: number | null;
  starsAwarded: number;
}

export interface UploadedFileRef {
  fileId: number;
}

export interface ParentChild {
  id: number;
  studentId: number;
  fullName: string;
  createdAt: string | null;
}

export interface BonusTask {
  id: number;
  tutorStudentId: number;
  title: string;
  description: string | null;
  stars: number;
  rewardTitle: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  createdAt: string | null;
  completedAt: string | null;
}

export interface Gamification {
  tutorStudentId: number;
  studentId: number;
  studentName: string;
  tutorName: string | null;
  starRewardsEnabled: boolean;
  starGoal: number | null;
  starRewardTitle: string | null;
  homeworkStars: number;
  bonusStars: number;
  earnedStars: number;
  bonusTasks: BonusTask[];
}
