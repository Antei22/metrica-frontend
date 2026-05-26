import { Clock3, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  addParentChild,
  listParentChildren,
  listParentLessons,
} from "../api/parent";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { LessonProgressTimeline } from "../components/LessonProgressTimeline";
import { StarValue } from "../components/StarValue";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getErrorMessage } from "../lib/errors";
import { validateEmail } from "../lib/formValidation";
import { formatDateTime, formatLessonTitle } from "../lib/format";
import {
  getHomeworkStatusClasses,
  getHomeworkStatusLabel,
  isHomeworkDeadlineMissed,
} from "../lib/homework";
import type { Lesson, LessonCollection, ParentChild } from "../types/domain";

function sortLessonsByDate(a: Lesson, b: Lesson) {
  const first = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`).getTime();
  const second = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`).getTime();
  return first - second;
}

function hasTutorCommentForParent(lesson: Lesson) {
  return Boolean(
    lesson.parentComment?.trim() ||
      lesson.parentMessageFiles.length > 0 ||
      lesson.submission?.comment?.trim(),
  );
}

export function ParentDashboard() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [lessonGroups, setLessonGroups] = useState<LessonCollection>({
    upcoming: [],
    past: [],
  });
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [childEmail, setChildEmail] = useState("");
  const [childEmailError, setChildEmailError] = useState<string | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);

  async function loadDashboard(studentId = selectedStudentId) {
    setLoading(true);
    setError(null);

    try {
      const [loadedChildren, loadedLessons] = await Promise.all([
        listParentChildren(),
        listParentLessons(studentId),
      ]);
      setChildren(loadedChildren);
      setLessonGroups(loadedLessons);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить кабинет родителя."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard(null);
  }, []);

  const upcomingLessons = useMemo(
    () => [...lessonGroups.upcoming].sort(sortLessonsByDate),
    [lessonGroups.upcoming],
  );
  const pastLessons = useMemo(
    () =>
      [...lessonGroups.past].sort((first, second) => sortLessonsByDate(second, first)),
    [lessonGroups.past],
  );
  const allLessons = useMemo(
    () => [...lessonGroups.past, ...lessonGroups.upcoming].sort(sortLessonsByDate),
    [lessonGroups.past, lessonGroups.upcoming],
  );
  const nearestLesson = upcomingLessons[0] || null;
  const lastLesson = pastLessons[0] || null;
  const lastLessonDeadlineMissed = isHomeworkDeadlineMissed(lastLesson);

  async function handleStudentFilterChange(value: string) {
    const nextStudentId = value ? Number(value) : null;
    setSelectedStudentId(nextStudentId);
    await loadDashboard(nextStudentId);
  }

  async function handleAddChild(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateEmail(childEmail);
    if (validationError) {
      setChildEmailError(validationError);
      return;
    }

    setIsAddingChild(true);
    setChildEmailError(null);

    try {
      await addParentChild(childEmail.trim());
      setChildEmail("");
      setIsDialogOpen(false);
      await loadDashboard(selectedStudentId);
      toast.success("Ребенок добавлен");
    } catch (submitError) {
      const errorMessage = getErrorMessage(submitError, "Не удалось добавить ребенка.");
      setChildEmailError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAddingChild(false);
    }
  }

  return (
    <AppLayout
      title="Кабинет родителя"
      description="Последнее занятие, оценки, дедлайны и история занятий ребенка."
    >
      {loading ? <LoadingState title="Загружаем кабинет родителя..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось загрузить кабинет"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadDashboard(selectedStudentId)}
        />
      ) : null}

      {!loading && !error ? (
        <>
          {children.length === 0 ? (
            <EmptyState
              title="Добавьте ребенка"
              description="Укажите email аккаунта ученика, чтобы видеть его занятия и оценки."
              actionLabel="Добавить ребенка"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : null}

          {children.length > 0 ? (
            <>
              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Дети в кабинете</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      {children.length}
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-center sm:justify-end">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-slate-900 text-white hover:bg-slate-800">
                          <Plus className="size-4" />
                          Добавить ребенка
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить ребенка</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4" onSubmit={handleAddChild}>
                          <div className="space-y-2">
                            <Label htmlFor="child-email">Email ученика</Label>
                            <Input
                              id="child-email"
                              placeholder="student@example.com"
                              type="email"
                              value={childEmail}
                              onChange={(event) => {
                                setChildEmail(event.target.value);
                                setChildEmailError(null);
                              }}
                              required
                            />
                          </div>
                          {childEmailError ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                              {childEmailError}
                            </div>
                          ) : null}
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
                              disabled={isAddingChild}
                              type="submit"
                            >
                              {isAddingChild ? "Добавляем..." : "Добавить"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <div className="w-full sm:max-w-xs">
                      <Label htmlFor="child-filter" className="sr-only">
                        Ребенок
                      </Label>
                      <select
                        id="child-filter"
                        className="border-input bg-input-background flex h-10 w-full rounded-md border px-3 text-sm outline-none"
                        value={selectedStudentId ?? ""}
                        onChange={(event) => void handleStudentFilterChange(event.target.value)}
                      >
                        <option value="">Все дети</option>
                        {children.map((child) => (
                          <option key={child.id} value={child.studentId}>
                            {child.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="space-y-3 p-5">
                    <p className="text-lg font-semibold text-slate-400">
                      Последнее занятие
                    </p>
                    {lastLesson ? (
                      <>
                        <div>
                          <p className="text-2xl font-semibold text-slate-900">
                            {formatLessonTitle(lastLesson.subject, lastLesson.topic)}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {lastLesson.studentName || "Ученик не указан"} •{" "}
                            {formatDateTime(lastLesson.date, lastLesson.time)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Репетитор: {lastLesson.tutorName || "не указан"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-3">
                            <StarValue value={lastLesson.homeworkGrade} />
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                lastLessonDeadlineMissed
                                  ? "bg-rose-100 text-rose-700"
                                  : getHomeworkStatusClasses(lastLesson.homeworkStatus)
                              }`}
                            >
                              {lastLessonDeadlineMissed
                                ? "Дедлайн ДЗ просрочен"
                                : getHomeworkStatusLabel(lastLesson.homeworkStatus)}
                            </span>
                          </div>
                          <Button
                            className="bg-slate-900 text-white hover:bg-slate-800"
                            onClick={() => navigate(`/parent/lessons/${lastLesson.id}`)}
                          >
                            Открыть занятие
                          </Button>
                        </div>
                        {lastLesson.submission?.comment ? (
                          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            {lastLesson.submission.comment}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                        Прошедших занятий пока нет.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="flex h-full flex-col gap-5 p-5">
                    <p className="text-lg font-semibold text-slate-400">
                      Ближайшее занятие
                    </p>
                    {nearestLesson ? (
                      <button
                        className="flex flex-1 flex-col gap-5 text-left transition hover:-translate-y-0.5"
                        onClick={() => navigate(`/parent/lessons/${nearestLesson.id}`)}
                        type="button"
                      >
                        <p className="text-2xl font-semibold text-slate-900">
                          {formatLessonTitle(nearestLesson.subject, nearestLesson.topic)}
                        </p>

                        <div className="mt-auto">
                          <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Clock3 className="size-4 text-slate-500" />
                            {formatDateTime(nearestLesson.date, nearestLesson.time)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Репетитор: {nearestLesson.tutorName || "не указан"}
                          </p>
                        </div>
                      </button>
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                        Запланированных занятий пока нет.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>

              <section
                className="rounded-[32px] border border-slate-200 bg-white shadow-sm"
                id="parent-history"
              >
                <div className="border-b border-slate-200 px-6 py-5">
                  <p className="text-lg font-semibold text-slate-900">История занятий</p>
                </div>
                <div className="p-6">
                  <LessonProgressTimeline
                    emptyDescription="Когда занятия ребенка появятся в расписании, они выстроятся здесь по датам."
                    lessons={allLessons}
                    nearestLessonId={nearestLesson?.id}
                    onLessonClick={(lesson) => navigate(`/parent/lessons/${lesson.id}`)}
                    renderLessonMeta={(lesson) =>
                      hasTutorCommentForParent(lesson)
                        ? "Посмотреть комментарий от репетитора"
                        : null
                    }
                    showDeadlineMissed={false}
                  />
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}
