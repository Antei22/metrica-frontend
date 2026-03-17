import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ApiError } from "../api/client";
import { uploadTutorFile } from "../api/files";
import { createTutorLesson, listTutorLessons } from "../api/lessons";
import { listTutorStudents } from "../api/students";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { formatDate, formatDateTime } from "../lib/format";
import { getErrorMessage } from "../lib/errors";
import type { Lesson, LessonCollection, TutorStudent } from "../types/domain";

interface LessonFormState {
  tutorStudentId: string;
  date: string;
  time: string;
  topic: string;
  meetLink: string;
  homeworkDeadline: string;
}

const initialLessonFormState: LessonFormState = {
  tutorStudentId: "",
  date: "",
  time: "",
  topic: "",
  meetLink: "",
  homeworkDeadline: "",
};

function sortLessonsByDate(a: Lesson, b: Lesson) {
  const first = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`).getTime();
  const second = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`).getTime();
  return first - second;
}

export function TutorDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [lessonGroups, setLessonGroups] = useState<LessonCollection>({
    upcoming: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonsWarning, setLessonsWarning] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(initialLessonFormState);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [homeworkFiles, setHomeworkFiles] = useState<File[]>([]);

  const upcomingLessons = [...lessonGroups.upcoming].sort(sortLessonsByDate);
  const pastLessons = [...lessonGroups.past]
    .sort((first, second) => sortLessonsByDate(second, first))
    .slice(0, 5);
  const latestLesson = [...lessonGroups.upcoming, ...lessonGroups.past]
    .sort((first, second) => sortLessonsByDate(second, first))[0];

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    setLessonsWarning(null);

    try {
      const tutorStudents = await listTutorStudents();
      setStudents(tutorStudents);

      try {
        const lessons = await listTutorLessons();
        setLessonGroups(lessons);
      } catch (lessonError) {
        setLessonGroups({ upcoming: [], past: [] });

        if (lessonError instanceof ApiError && lessonError.status === 404) {
          setLessonsWarning(
            "Бекенд пока не вернул список занятий. Создание новых занятий продолжит работать.",
          );
        } else {
          setLessonsWarning(
            getErrorMessage(lessonError, "Не удалось загрузить расписание занятий."),
          );
        }
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить кабинет репетитора."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  function updateLessonForm<K extends keyof LessonFormState>(
    key: K,
    value: LessonFormState[K],
  ) {
    setLessonForm((currentState) => ({
      ...currentState,
      [key]: value,
    }));
  }

  async function handleCreateLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const [materialRefs, homeworkRefs] = await Promise.all([
        Promise.all(materialFiles.map((file) => uploadTutorFile(file))),
        Promise.all(homeworkFiles.map((file) => uploadTutorFile(file))),
      ]);

      const selectedStudent = students.find(
        (student) => student.id === Number(lessonForm.tutorStudentId),
      );

      const createdLesson = await createTutorLesson({
        tutorStudentId: Number(lessonForm.tutorStudentId),
        date: lessonForm.date,
        time: lessonForm.time,
        topic: lessonForm.topic,
        meetLink: lessonForm.meetLink,
        homeworkDeadline: lessonForm.homeworkDeadline,
        materialFileIds: materialRefs.map((file) => file.fileId),
        homeworkTaskFileIds: homeworkRefs.map((file) => file.fileId),
      });

      setLessonGroups((currentGroups) => ({
        ...currentGroups,
        upcoming: [
          {
            ...createdLesson,
            studentName: selectedStudent?.fullName || createdLesson.studentName,
            subject: selectedStudent?.subject || createdLesson.subject,
            classInfo: selectedStudent?.classInfo || createdLesson.classInfo,
          },
          ...currentGroups.upcoming,
        ],
      }));
      setLessonsWarning(null);
      setIsDialogOpen(false);
      setLessonForm(initialLessonFormState);
      setMaterialFiles([]);
      setHomeworkFiles([]);
      toast.success("Занятие создано");
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Не удалось создать занятие."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout
      title="Кабинет репетитора"
      description="Создавайте занятия, следите за ближайшими встречами и быстро переходите к проверке домашних заданий."
      actions={
        <>
          <Button variant="outline" onClick={() => navigate("/tutor/students")}>
            Ученики
          </Button>
          <Button variant="outline" onClick={() => navigate("/tutor/homework")}>
            Проверка ДЗ
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                disabled={students.length === 0}
              >
                Создать занятие
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать занятие</DialogTitle>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleCreateLesson}>
                <div className="space-y-2">
                  <Label htmlFor="lesson-student">Ученик</Label>
                  <select
                    id="lesson-student"
                    className="border-input bg-input-background flex h-9 w-full rounded-md border px-3 text-sm outline-none"
                    value={lessonForm.tutorStudentId}
                    onChange={(event) => updateLessonForm("tutorStudentId", event.target.value)}
                    required
                  >
                    <option value="">Выберите ученика</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-date">Дата</Label>
                    <Input
                      id="lesson-date"
                      type="date"
                      value={lessonForm.date}
                      onChange={(event) => updateLessonForm("date", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lesson-time">Время</Label>
                    <Input
                      id="lesson-time"
                      type="time"
                      value={lessonForm.time}
                      onChange={(event) => updateLessonForm("time", event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-topic">Тема занятия</Label>
                  <Input
                    id="lesson-topic"
                    placeholder="Например, дроби и проценты"
                    value={lessonForm.topic}
                    onChange={(event) => updateLessonForm("topic", event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-link">Ссылка на созвон</Label>
                  <Input
                    id="lesson-link"
                    placeholder="https://..."
                    type="url"
                    value={lessonForm.meetLink}
                    onChange={(event) => updateLessonForm("meetLink", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-materials">Материалы занятия</Label>
                  <Input
                    id="lesson-materials"
                    multiple
                    type="file"
                    onChange={(event) =>
                      setMaterialFiles(Array.from(event.target.files || []))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-homework-files">Файлы домашнего задания</Label>
                  <Input
                    id="lesson-homework-files"
                    multiple
                    type="file"
                    onChange={(event) =>
                      setHomeworkFiles(Array.from(event.target.files || []))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-deadline">Дедлайн домашнего задания</Label>
                  <Input
                    id="lesson-deadline"
                    type="date"
                    value={lessonForm.homeworkDeadline}
                    onChange={(event) =>
                      updateLessonForm("homeworkDeadline", event.target.value)
                    }
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Создаем..." : "Создать занятие"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {loading ? <LoadingState title="Загружаем кабинет..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось загрузить кабинет"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadDashboardData()}
        />
      ) : null}

      {!loading && !error ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">Всего учеников</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{students.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">Ближайших занятий</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {upcomingLessons.length}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">Последнее занятие в списке</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {latestLesson ? formatDate(latestLesson.date) : "Пока без занятий"}
                </p>
              </CardContent>
            </Card>
          </section>

          {students.length === 0 ? (
            <EmptyState
              title="Сначала добавьте ученика"
              description="Создание занятия доступно только после того, как ученик привязан к вашему аккаунту."
              actionLabel="Перейти к ученикам"
              onAction={() => navigate("/tutor/students")}
            />
          ) : null}

          {lessonsWarning ? (
            <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="p-6 text-sm text-amber-800">{lessonsWarning}</CardContent>
            </Card>
          ) : null}

          {students.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Ближайшие занятия</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Все, что уже создано и запланировано.
                </p>
              </div>

              {upcomingLessons.length === 0 ? (
                <EmptyState
                  title="Пока нет будущих занятий"
                  description="Создайте первое занятие, и оно сразу появится в этом списке."
                  actionLabel="Создать занятие"
                  onAction={() => setIsDialogOpen(true)}
                />
              ) : (
                <div className="grid gap-4">
                  {upcomingLessons.map((lesson) => (
                    <Card key={lesson.id} className="rounded-3xl border-slate-200 shadow-sm">
                      <CardHeader className="gap-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <CardTitle>{lesson.topic || "Без названия"}</CardTitle>
                            <p className="mt-2 text-sm text-slate-500">
                              {lesson.studentName || "Ученик не указан"}
                              {lesson.subject ? ` • ${lesson.subject}` : ""}
                              {lesson.classInfo ? ` • ${lesson.classInfo}` : ""}
                            </p>
                          </div>
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {formatDateTime(lesson.date, lesson.time)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                        <div className="space-y-2 text-sm text-slate-600">
                          <p>
                            Дедлайн ДЗ:{" "}
                            {lesson.homeworkDeadline
                              ? formatDate(lesson.homeworkDeadline)
                              : "не задан"}
                          </p>
                          <p>
                            Материалов: {lesson.materials.length}, файлов домашнего задания:{" "}
                            {lesson.homeworkTaskFiles.length}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {lesson.meetLink ? (
                            <Button asChild variant="outline">
                              <a href={lesson.meetLink} rel="noreferrer" target="_blank">
                                Открыть созвон
                              </a>
                            </Button>
                          ) : null}
                          <Button variant="outline" onClick={() => navigate("/tutor/homework")}>
                            Проверка ДЗ
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {pastLessons.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Последние прошедшие занятия</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Недавние встречи для быстрого доступа к контексту.
                </p>
              </div>

              <div className="grid gap-4">
                {pastLessons.map((lesson) => (
                  <Card key={lesson.id} className="rounded-3xl border-slate-200 shadow-sm">
                    <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {lesson.topic || "Без названия"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {lesson.studentName || "Ученик не указан"} •{" "}
                          {formatDateTime(lesson.date, lesson.time)}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        Прошло
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}
