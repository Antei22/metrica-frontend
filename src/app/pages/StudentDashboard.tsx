import { Clock3, ExternalLink, Gift, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { listStudentGamification } from "../api/gamification";
import { listStudentLessons, submitStudentHomework } from "../api/lessons";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { FileLinkButton } from "../components/FileLinkButton";
import { LessonFilesCard } from "../components/LessonFilesCard";
import { StarValue } from "../components/StarValue";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { getErrorMessage } from "../lib/errors";
import { formatDate, formatDateClock, formatDateTime, formatDayMonth, formatLessonTitle } from "../lib/format";
import {
  getHomeworkStatusLabel,
  HOMEWORK_FILE_ACCEPT,
  isHomeworkDeadlineMissed,
  isSubmittedAfterHomeworkDeadline,
} from "../lib/homework";
import type { Gamification, Lesson, LessonCollection, LessonMaterial } from "../types/domain";

function sortLessonsByDate(a: Lesson, b: Lesson) {
  const first = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`).getTime();
  const second = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`).getTime();
  return first - second;
}

function getLessonTimestamp(lesson: Lesson) {
  return new Date(`${lesson.date || "1970-01-01"}T${lesson.time || "00:00"}`).getTime();
}

function getActiveHomeworkLesson(lessons: Lesson[], nearestLesson: Lesson | null) {
  const candidates = lessons.filter(
    (lesson) =>
      lesson.homeworkStatus !== "checked" &&
      (lesson.homeworkDeadline || lesson.homeworkTaskFiles.length > 0),
  );

  if (candidates.length === 0) {
    return null;
  }

  const anchorTimestamp = nearestLesson ? getLessonTimestamp(nearestLesson) : Date.now();
  const previousHomework = candidates.filter(
    (lesson) => !nearestLesson || getLessonTimestamp(lesson) < anchorTimestamp,
  );

  if (previousHomework.length > 0) {
    return [...previousHomework].sort(
      (first, second) => getLessonTimestamp(second) - getLessonTimestamp(first),
    )[0];
  }

  return [...candidates].sort(sortLessonsByDate)[0];
}

function hasHomeworkTask(lesson: Lesson) {
  return Boolean(lesson.homeworkDeadline || lesson.homeworkTaskFiles.length > 0);
}

function getHomeworkStatusTextClass(lesson: Lesson) {
  if (lesson.homeworkStatus === "checked") {
    return "text-emerald-700";
  }

  if (lesson.homeworkStatus === "sent") {
    return "text-amber-700";
  }

  if (isHomeworkDeadlineMissed(lesson)) {
    return "text-rose-600";
  }

  return "text-slate-500";
}

function getHomeworkStatusText(lesson: Lesson) {
  if (lesson.homeworkStatus === "not_sent") {
    return "Еще не отправлено";
  }

  return getHomeworkStatusLabel(lesson.homeworkStatus);
}

function getPendingFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(file: File) {
  return `${(file.size / 1024).toFixed(1)} KB`;
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const [lessonGroups, setLessonGroups] = useState<LessonCollection>({
    upcoming: [],
    past: [],
  });
  const [gamification, setGamification] = useState<Gamification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [retainedSubmittedFiles, setRetainedSubmittedFiles] = useState<LessonMaterial[]>([]);
  const [selectedHomeworkFiles, setSelectedHomeworkFiles] = useState<File[]>([]);
  const [homeworkComment, setHomeworkComment] = useState("");
  const [isSubmittingHomework, setIsSubmittingHomework] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [lessons, rewards] = await Promise.all([
        listStudentLessons(),
        listStudentGamification(),
      ]);
      setLessonGroups(lessons);
      setGamification(rewards);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить кабинет ученика."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  function handleAddHomeworkFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || []);

    if (nextFiles.length > 0) {
      setSelectedHomeworkFiles((currentFiles) => [...currentFiles, ...nextFiles]);
    }

    event.target.value = "";
  }

  function removeSelectedHomeworkFile(index: number) {
    setSelectedHomeworkFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  function removeRetainedSubmittedFile(fileId: string) {
    setRetainedSubmittedFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
  }

  async function handleSubmitHomework() {
    if (!activeHomeworkLesson) {
      return;
    }

    const retainedFileIds = retainedSubmittedFiles
      .map((file) => file.fileId)
      .filter((fileId): fileId is number => typeof fileId === "number");

    if (retainedFileIds.length + selectedHomeworkFiles.length === 0) {
      toast.error("Сначала выберите файлы для отправки.");
      return;
    }

    setIsSubmittingHomework(true);

    try {
      await submitStudentHomework(
        activeHomeworkLesson.id,
        selectedHomeworkFiles,
        retainedFileIds,
        homeworkComment,
      );
      toast.success("Домашнее задание отправлено");
      setSelectedHomeworkFiles([]);
      await loadDashboard();
    } catch (submitError) {
      toast.error(
        getErrorMessage(submitError, "Не удалось отправить домашнее задание."),
      );
    } finally {
      setIsSubmittingHomework(false);
    }
  }

  const upcomingLessons = useMemo(
    () => [...lessonGroups.upcoming].sort(sortLessonsByDate),
    [lessonGroups.upcoming],
  );
  const pastLessons = useMemo(
    () => [...lessonGroups.past].sort((first, second) => sortLessonsByDate(second, first)),
    [lessonGroups.past],
  );
  const allLessons = useMemo(
    () => [...lessonGroups.past, ...lessonGroups.upcoming].sort(sortLessonsByDate),
    [lessonGroups.past, lessonGroups.upcoming],
  );
  const nearestLesson = upcomingLessons[0] || null;
  const recentLessons = pastLessons.slice(0, 3);
  const dashboardLesson = nearestLesson;
  const activeHomeworkLesson = getActiveHomeworkLesson(allLessons, nearestLesson);
  const homeworkOverdue = isHomeworkDeadlineMissed(activeHomeworkLesson);
  const homeworkSubmittedLate = isSubmittedAfterHomeworkDeadline(
    activeHomeworkLesson?.homeworkDeadline,
    activeHomeworkLesson?.submission?.submittedAt,
    activeHomeworkLesson?.homeworkDeadlineMissed,
  );
  const activeBonusTasks = gamification.flatMap((item) =>
    item.bonusTasks
      .filter((task) => !task.isCompleted)
      .map((task) => ({
        ...task,
        starRewardsEnabled: item.starRewardsEnabled,
        tutorName: item.tutorName,
      })),
  );

  useEffect(() => {
    setRetainedSubmittedFiles(activeHomeworkLesson?.submission?.files || []);
    setSelectedHomeworkFiles([]);
    setHomeworkComment(activeHomeworkLesson?.submission?.studentComment || "");
  }, [activeHomeworkLesson?.id, activeHomeworkLesson?.submission?.submittedAt]);

  return (
    <AppLayout
      title="Кабинет ученика"
      description="Ближайшее занятие, дедлайны ДЗ, оценки, награды и бонусные задания."
    >
      {loading ? <LoadingState title="Загружаем кабинет..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось загрузить кабинет"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadDashboard()}
        />
      ) : null}

      {!loading && !error ? (
        <>
          {activeBonusTasks.length > 0 ? (
            <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-rose-100 via-sky-100 to-indigo-100 p-2.5 shadow-[0_0_36px_rgba(251,113,133,0.22)]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rose-200/50 via-transparent to-indigo-200/50 blur-2xl" />
              <div className="relative rounded-[24px] bg-white px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                      <Gift className="size-5" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        Бонусные задания
                      </p>
                      <p className="text-sm text-slate-500">
                        Активно: {activeBonusTasks.length}
                      </p>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-3 lg:grid-cols-2">
                    {activeBonusTasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{task.title}</p>
                            {task.description ? (
                              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                {task.description}
                              </p>
                            ) : null}
                            {task.dueDate ? (
                              <p className="mt-2 text-xs text-slate-500">
                                До {formatDate(task.dueDate)}
                              </p>
                            ) : null}
                          </div>
                          {task.starRewardsEnabled ? (
                            <StarValue value={task.stars} />
                          ) : task.rewardTitle ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {task.rewardTitle}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <div className="grid gap-4">
              <Card className="h-full rounded-3xl border-slate-200 shadow-sm">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <p className="text-lg font-semibold text-slate-400">Домашнее задание</p>
                  {activeHomeworkLesson ? (
                    <div className="flex flex-1 flex-col gap-7">
                      <p
                        className={`max-w-full whitespace-nowrap text-2xl font-semibold leading-tight ${
                          homeworkOverdue ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        Дедлайн ДЗ:{" "}
                        {activeHomeworkLesson.homeworkDeadline
                          ? formatDayMonth(activeHomeworkLesson.homeworkDeadline)
                          : "не задан"}
                      </p>

                      <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0 space-y-1 text-sm text-slate-500">
                          <p className="font-medium text-slate-700">
                            {formatLessonTitle(
                              activeHomeworkLesson.subject,
                              activeHomeworkLesson.topic,
                              "Занятие",
                            )}
                          </p>
                          <p>Репетитор: {activeHomeworkLesson.tutorName || "не указан"}</p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            className="h-10 rounded-xl px-4 text-sm"
                            onClick={() => setIsMaterialsDialogOpen(true)}
                            variant="outline"
                          >
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Актуального ДЗ пока нет.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="h-full rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <p className="text-lg font-semibold text-slate-400">
                  Ближайшее занятие
                </p>
                {dashboardLesson ? (
                  <div className="flex flex-1 flex-col gap-7">
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatLessonTitle(dashboardLesson.subject, dashboardLesson.topic)}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                          <Clock3 className="size-4 text-slate-500" />
                          {formatDateTime(dashboardLesson.date, dashboardLesson.time)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Репетитор: {dashboardLesson.tutorName || "не указан"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 lg:justify-end">
                        {dashboardLesson.meetLink ? (
                          <Button asChild variant="outline">
                            <a href={dashboardLesson.meetLink} rel="noreferrer" target="_blank">
                              <ExternalLink className="size-4" />
                              Ссылка на звонок
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => navigate(`/student/lessons/${dashboardLesson.id}`)}
                          variant="outline"
                        >
                          Подробнее
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="Ближайшее занятие не запланировано"
                    description="Когда репетитор создаст следующее занятие, оно появится здесь."
                  />
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Последние занятия</CardTitle>
                <Button onClick={() => navigate("/student/lessons")} size="sm" variant="outline">
                  Вся история
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentLessons.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                    Последних занятий пока нет.
                  </p>
                ) : (
                  recentLessons.map((lesson) => {
                    const homeworkStatusVisible = hasHomeworkTask(lesson);

                    return (
                    <button
                      key={lesson.id}
                      className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                      type="button"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatLessonTitle(lesson.subject, lesson.topic)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDateTime(lesson.date, lesson.time)}
                        </p>
                        {homeworkStatusVisible ? (
                          <p
                            className={`mt-2 text-sm font-semibold ${getHomeworkStatusTextClass(
                              lesson,
                            )}`}
                          >
                            {getHomeworkStatusText(lesson)}
                          </p>
                        ) : null}
                      </div>
                    </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      <Dialog open={isMaterialsDialogOpen} onOpenChange={setIsMaterialsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Материалы домашнего задания</DialogTitle>
          </DialogHeader>
          {activeHomeworkLesson ? (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <LessonFilesCard
                  files={activeHomeworkLesson.materials}
                  title="Материалы занятия"
                />
                <LessonFilesCard
                  files={activeHomeworkLesson.homeworkTaskFiles}
                  title="Материалы домашнего задания"
                />
              </div>

              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Домашнее задание</CardTitle>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      homeworkOverdue
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Дедлайн:{" "}
                    {activeHomeworkLesson.homeworkDeadline
                      ? formatDate(activeHomeworkLesson.homeworkDeadline)
                      : "не задан"}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-600">
                      Прикрепите PDF, изображение или документ с выполненным домашним заданием.
                    </p>
                    <Input
                      accept={HOMEWORK_FILE_ACCEPT}
                      multiple
                      onChange={handleAddHomeworkFiles}
                      type="file"
                    />
                    <p className="text-xs text-slate-500">
                      Можно добавлять файлы в несколько подходов. Лишние файлы можно убрать перед отправкой.
                    </p>

                    {retainedSubmittedFiles.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">
                          Дедлайн ДЗ:{" "}
                          {activeHomeworkLesson.homeworkDeadline
                            ? formatDate(activeHomeworkLesson.homeworkDeadline)
                            : "не задан"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <p className="font-medium text-slate-900">Решение ученика:</p>
                          {activeHomeworkLesson.submission?.submittedAt ? (
                            <p
                              className={
                                homeworkSubmittedLate ? "font-medium text-rose-600" : undefined
                              }
                            >
                              Отправлено в{" "}
                              {formatDateClock(activeHomeworkLesson.submission.submittedAt)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-start gap-2">
                          {retainedSubmittedFiles.map((file) => (
                            <div className="flex max-w-full items-center gap-2" key={file.id}>
                              <FileLinkButton file={file} fallback="Открыть файл" />
                              <Button
                                onClick={() => removeRetainedSubmittedFile(file.id)}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        {activeHomeworkLesson.submission?.studentComment ? (
                          <p className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                            {activeHomeworkLesson.submission.studentComment}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {selectedHomeworkFiles.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                          Новые файлы для отправки
                        </p>
                        {selectedHomeworkFiles.map((file, index) => (
                          <div
                            key={getPendingFileKey(file)}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-500">{formatFileSize(file)}</p>
                            </div>
                            <Button
                              onClick={() => removeSelectedHomeworkFile(index)}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium text-slate-900"
                        htmlFor="homework-comment"
                      >
                        Комментарий к ДЗ
                      </label>
                      <Textarea
                        id="homework-comment"
                        maxLength={1000}
                        onChange={(event) => setHomeworkComment(event.target.value)}
                        placeholder="Напишите комментарий для репетитора."
                        rows={4}
                        value={homeworkComment}
                      />
                    </div>

                    <Button
                      className="bg-slate-900 text-white hover:bg-slate-800"
                      disabled={
                        retainedSubmittedFiles.length + selectedHomeworkFiles.length === 0 ||
                        isSubmittingHomework
                      }
                      onClick={handleSubmitHomework}
                    >
                      {isSubmittingHomework
                        ? "Сохраняем..."
                        : activeHomeworkLesson.homeworkStatus === "sent"
                          ? "Обновить ДЗ"
                          : "Отправить ДЗ"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
