export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  grade: string;
  homeworkStatus: "completed" | "pending" | "not_assigned";
}

export interface Lesson {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  topic: string;
  subject: string;
  grade: string;
  meetingLink?: string;
  materials?: string[];
  homeworkFile?: string;
  homeworkDeadline?: string;
  homeworkStatus: "not_sent" | "sent" | "checked";
  homeworkComment?: string;
  isPast: boolean;
}

export interface Homework {
  id: string;
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonDate: string;
  lessonTopic: string;
  submittedFile: string;
  submittedAt: string;
  status: "pending" | "checked";
  comment?: string;
}

export const mockStudents: Student[] = [
  {
    id: "1",
    firstName: "Иван",
    lastName: "Иванов",
    email: "ivan@example.com",
    subject: "Математика",
    grade: "7/12",
    homeworkStatus: "completed",
  },
  {
    id: "2",
    firstName: "Иван",
    lastName: "Фамилия",
    email: "ivan2@example.com",
    subject: "Программирование",
    grade: "10/11",
    homeworkStatus: "pending",
  },
  {
    id: "3",
    firstName: "Иван",
    lastName: "Фамилия",
    email: "ivan3@example.com",
    subject: "Математика",
    grade: "7/12",
    homeworkStatus: "not_assigned",
  },
];

export const mockLessons: Lesson[] = [
  {
    id: "1",
    studentId: "1",
    studentName: "Иван Иванов",
    date: "2026-03-20",
    time: "15:00",
    topic: "Начать занятие по математике с Иваном Ивановым",
    subject: "Математика",
    grade: "4 класс",
    meetingLink: "https://meet.example.com/abc123",
    materials: ["presentation.pdf", "homework.pdf"],
    homeworkDeadline: "2026-03-22",
    homeworkStatus: "not_sent",
    isPast: false,
  },
  {
    id: "2",
    studentId: "1",
    studentName: "Иван Иванов",
    date: "2026-03-15",
    time: "17:00",
    topic: "Равенство треугольников",
    subject: "Математика",
    grade: "4 класс",
    meetingLink: "https://meet.example.com/xyz789",
    materials: ["materials.pdf"],
    homeworkFile: "homework.pdf",
    homeworkDeadline: "2026-03-17",
    homeworkStatus: "checked",
    homeworkComment: "Отлично! Все задания выполнены верно.",
    isPast: true,
  },
  {
    id: "3",
    studentId: "1",
    studentName: "Иван Иванов",
    date: "2026-03-08",
    time: "17:00",
    topic: "Равенство треугольников",
    subject: "Математика",
    grade: "4 класс",
    meetingLink: "https://meet.example.com/def456",
    homeworkStatus: "sent",
    isPast: true,
  },
];

export const mockHomework: Homework[] = [
  {
    id: "1",
    studentId: "1",
    studentName: "Иван Иванов",
    lessonId: "3",
    lessonDate: "2026-03-08",
    lessonTopic: "Равенство треугольников",
    submittedFile: "homework_solution.pdf",
    submittedAt: "2026-03-10 14:30",
    status: "pending",
  },
  {
    id: "2",
    studentId: "2",
    studentName: "Петр Петров",
    lessonId: "4",
    lessonDate: "2026-03-09",
    lessonTopic: "Программирование на Python",
    submittedFile: "code.py",
    submittedAt: "2026-03-11 10:00",
    status: "pending",
  },
];
