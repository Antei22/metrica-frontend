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
  createdAt: string | null;
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

export interface AiMathError {
  location: string;
  student_wrote: string;
  correct: string;
  explanation: string;
  topic: string;
  severity: "conceptual" | "computational" | "careless";
}

export interface AiTaskReview {
  task_label: string;
  transcription: string;
  is_correct: boolean;
  errors: AiMathError[];
  task_types: string[];
}

export interface AiPracticeTask {
  topic: string;
  question: string;
  hint: string;
  answer: string;
  solution: string;
}

export interface AiHomeworkResult {
  readable: boolean;
  quality_note: string | null;
  tasks: AiTaskReview[];
  summary: string;
  error_topics: string[];
  practice: AiPracticeTask[];
}

export interface AiReviewState {
  id: number | null;
  lesson_id: number;
  status: "not_started" | "pending" | "running" | "completed" | "failed";
  available: boolean;
  result: AiHomeworkResult | null;
  error_message: string | null;
}

export interface AiHomeworkHistoryItem {
  homework_number: number;
  homework_label: string;
  created_at: string;
}

export interface AiErrorCluster {
  label: string;
  description: string;
  homework_labels: string[];
  error_count: number;
}

export interface AiProgressReport {
  homework_count: number;
  threshold_reached: boolean;
  narrative: string;
  strengths: string[];
  focus_areas: string[];
  clusters: AiErrorCluster[];
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
