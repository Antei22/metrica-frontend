import { addWeeks, format, isToday, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { uploadTutorFile } from "../api/files";
import {
  createTutorLesson,
  deleteTutorLesson,
  listTutorLessons,
  updateTutorLesson,
} from "../api/lessons";
import { listTutorStudents } from "../api/students";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { TutorLessonDetailsDialog } from "../components/tutor/TutorLessonDetailsDialog";
import {
  initialLessonFormValues,
  type LessonFormValues,
  TutorLessonFormDialog,
} from "../components/tutor/TutorLessonFormDialog";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { getErrorMessage } from "../lib/errors";
import { formatDate, formatDateTime, formatTime } from "../lib/format";
import {
  compareLessonsByDate,
  formatWeekLabel,
  getCurrentWeekStart,
  getLessonsForDay,
  getLessonsForWeek,
  getNearestUpcomingLesson,
  getWeekDays,
} from "../lib/lesson-schedule";
import { validateLessonForm } from "../lib/formValidation";
import type { Lesson, LessonCollection, LessonMaterial, TutorStudent } from "../types/domain";

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function appendFiles(currentFiles: File[], nextFiles: File[]) {
  const knownFiles = new Set(currentFiles.map(getFileKey));
  const appendedFiles = [...currentFiles];

  for (const file of nextFiles) {
    const fileKey = getFileKey(file);

    if (!knownFiles.has(fileKey)) {
      knownFiles.add(fileKey);
      appendedFiles.push(file);
    }
  }

  return appendedFiles;
}

function removeFileAtIndex(files: File[], index: number) {
  return files.filter((_, fileIndex) => fileIndex !== index);
}

function collectPersistedFileIds(files: LessonMaterial[]) {
  const ids = files
    .map((file) => file.fileId)
    .filter((fileId): fileId is number => fileId !== null && fileId > 0);

  return ids.length > 0 ? Array.from(new Set(ids)) : undefined;
}

function mergeFileIds(existingIds: number[] | undefined, uploadedIds: number[]) {
  const mergedIds = [...(existingIds || []), ...uploadedIds].filter((id) => id > 0);
  return mergedIds.length > 0 ? Array.from(new Set(mergedIds)) : undefined;
}

function buildLessonPayload(
  form: LessonFormValues,
  materialFileIds: number[] | undefined,
  homeworkTaskFileIds: number[] | undefined,
) {
  return {
    tutorStudentId: Number(form.tutorStudentId),
    date: form.date,
    time: form.time,
    topic: form.topic.trim(),
    meetLink: form.meetLink.trim(),
    homeworkDeadline: form.homeworkDeadline,
    materialFileIds,
    homeworkTaskFileIds,
  };
}

function formatMonthLabel(value: Date) {
  const formattedValue = format(value, "LLLL yyyy", { locale: ru });
  return formattedValue.slice(0, 1).toUpperCase() + formattedValue.slice(1);
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

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<LessonFormValues>(initialLessonFormValues);
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [createMaterialFiles, setCreateMaterialFiles] = useState<File[]>([]);
  const [createHomeworkFiles, setCreateHomeworkFiles] = useState<File[]>([]);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [listWeekOffset, setListWeekOffset] = useState(0);

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<LessonFormValues>(initialLessonFormValues);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editMaterialFiles, setEditMaterialFiles] = useState<File[]>([]);
  const [editHomeworkFiles, setEditHomeworkFiles] = useState<File[]>([]);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

  const currentWeekStart = getCurrentWeekStart();
  const calendarWeekStart = addWeeks(currentWeekStart, calendarWeekOffset);
  const listWeekStart = addWeeks(currentWeekStart, listWeekOffset);

  const allLessons = [...lessonGroups.upcoming, ...lessonGroups.past].sort(compareLessonsByDate);
  const upcomingLessons = [...lessonGroups.upcoming].sort(compareLessonsByDate);
  const nearestLesson = getNearestUpcomingLesson(upcomingLessons);
  const todayLessonsCount = allLessons.filter(
    (lesson) => lesson.date && isToday(parseISO(lesson.date)),
  ).length;
  const calendarDays = getWeekDays(calendarWeekStart);
  const calendarWeekLessons = getLessonsForWeek(allLessons, calendarWeekStart);
  const listWeekLessons = getLessonsForWeek(allLessons, listWeekStart);

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
        setLessonsWarning(
          getErrorMessage(lessonError, "Не удалось загрузить расписание занятий."),
        );
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

  function updateCreateForm<K extends keyof LessonFormValues>(
    key: K,
    value: LessonFormValues[K],
  ) {
    setCreateForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
    setCreateFormError(null);
  }

  function updateEditForm<K extends keyof LessonFormValues>(
    key: K,
    value: LessonFormValues[K],
  ) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
    setEditFormError(null);
  }

  function resetCreateState() {
    setCreateForm(initialLessonFormValues);
    setCreateFormError(null);
    setCreateMaterialFiles([]);
    setCreateHomeworkFiles([]);
  }

  function closeCreateDialog(open: boolean) {
    setIsCreateDialogOpen(open);

    if (!open) {
      resetCreateState();
    }
  }

  function closeEditDialog(open: boolean) {
    setIsEditDialogOpen(open);

    if (!open) {
      setEditingLesson(null);
      setEditForm(initialLessonFormValues);
      setEditFormError(null);
      setEditMaterialFiles([]);
      setEditHomeworkFiles([]);
    }
  }

  async function handleCreateLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateLessonForm(createForm);

    if (validationError) {
      setCreateFormError(validationError);
      return;
    }

    setIsCreateSubmitting(true);
    setCreateFormError(null);

    try {
      const [materialRefs, homeworkRefs] = await Promise.all([
        Promise.all(createMaterialFiles.map((file) => uploadTutorFile(file))),
        Promise.all(createHomeworkFiles.map((file) => uploadTutorFile(file))),
      ]);

      await createTutorLesson(
        buildLessonPayload(
          createForm,
          materialRefs.map((file) => file.fileId),
          homeworkRefs.map((file) => file.fileId),
        ),
      );

      closeCreateDialog(false);
      await loadDashboardData();
      toast.success("Занятие создано");
    } catch (submitError) {
      const errorMessage = getErrorMessage(submitError, "Не удалось создать занятие.");
      setCreateFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreateSubmitting(false);
    }
  }

  function handleOpenLessonDetails(lesson: Lesson) {
    setSelectedLesson(lesson);
  }

  function handleOpenEditDialog(lesson: Lesson) {
    setSelectedLesson(null);
    setEditingLesson(lesson);
    setEditForm({
      tutorStudentId: String(lesson.tutorStudentId || ""),
      date: lesson.date || "",
      time: lesson.time || "",
      topic: lesson.topic || "",
      meetLink: lesson.meetLink || "",
      homeworkDeadline: lesson.homeworkDeadline || "",
    });
    setEditFormError(null);
    setEditMaterialFiles([]);
    setEditHomeworkFiles([]);
    setIsEditDialogOpen(true);
  }

  async function handleUpdateLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingLesson) {
      return;
    }

    const validationError = validateLessonForm(editForm);

    if (validationError) {
      setEditFormError(validationError);
      return;
    }

    setIsEditSubmitting(true);
    setEditFormError(null);

    try {
      const [materialRefs, homeworkRefs] = await Promise.all([
        Promise.all(editMaterialFiles.map((file) => uploadTutorFile(file))),
        Promise.all(editHomeworkFiles.map((file) => uploadTutorFile(file))),
      ]);

      const existingMaterialIds = collectPersistedFileIds(editingLesson.materials);
      const existingHomeworkIds = collectPersistedFileIds(editingLesson.homeworkTaskFiles);

      await updateTutorLesson(
        editingLesson.id,
        buildLessonPayload(
          editForm,
          mergeFileIds(
            existingMaterialIds,
            materialRefs.map((file) => file.fileId),
          ),
          mergeFileIds(
            existingHomeworkIds,
            homeworkRefs.map((file) => file.fileId),
          ),
        ),
      );

      closeEditDialog(false);
      await loadDashboardData();
      toast.success("Занятие обновлено");
    } catch (submitError) {
      const errorMessage = getErrorMessage(submitError, "Не удалось обновить занятие.");
      setEditFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleDeleteLesson(lesson: Lesson) {
    setIsDeletingLesson(true);

    try {
      await deleteTutorLesson(lesson.id);
      setSelectedLesson(null);
      await loadDashboardData();
      toast.success("Занятие удалено");
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Не удалось удалить занятие."));
    } finally {
      setIsDeletingLesson(false);
    }
  }

  return (
    <AppLayout
      title="Кабинет репетитора"
      description="Следите за занятиями в недельном календаре, быстро открывайте материалы и управляйте расписанием из одного экрана."
      actions={
        <>
          <Button onClick={() => navigate("/tutor/students")} variant="outline">
            Ученики
          </Button>
          <Button onClick={() => navigate("/tutor/homework")} variant="outline">
            Проверка ДЗ
          </Button>
          <Button
            className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
            disabled={students.length === 0}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Создать занятие
          </Button>
        </>
      }
    >
      <TutorLessonFormDialog
        form={createForm}
        formError={createFormError}
        homeworkFiles={createHomeworkFiles}
        isSubmitting={isCreateSubmitting}
        materialFiles={createMaterialFiles}
        onAddHomeworkFiles={(files) =>
          setCreateHomeworkFiles((currentFiles) => appendFiles(currentFiles, files))
        }
        onAddMaterialFiles={(files) =>
          setCreateMaterialFiles((currentFiles) => appendFiles(currentFiles, files))
        }
        onFormChange={updateCreateForm}
        onOpenChange={closeCreateDialog}
        onRemoveHomeworkFile={(index) =>
          setCreateHomeworkFiles((currentFiles) => removeFileAtIndex(currentFiles, index))
        }
        onRemoveMaterialFile={(index) =>
          setCreateMaterialFiles((currentFiles) => removeFileAtIndex(currentFiles, index))
        }
        onSubmit={handleCreateLesson}
        open={isCreateDialogOpen}
        students={students}
        submitLabel="Создать занятие"
        submittingLabel="Создаем..."
        title="Создать занятие"
      />

      <TutorLessonFormDialog
        description="Измените ученика, дату, тему, ссылку на созвон и при необходимости прикрепите новые файлы."
        existingHomeworkFiles={editingLesson?.homeworkTaskFiles}
        existingMaterials={editingLesson?.materials}
        form={editForm}
        formError={editFormError}
        homeworkFiles={editHomeworkFiles}
        isSubmitting={isEditSubmitting}
        materialFiles={editMaterialFiles}
        onAddHomeworkFiles={(files) =>
          setEditHomeworkFiles((currentFiles) => appendFiles(currentFiles, files))
        }
        onAddMaterialFiles={(files) =>
          setEditMaterialFiles((currentFiles) => appendFiles(currentFiles, files))
        }
        onFormChange={updateEditForm}
        onOpenChange={closeEditDialog}
        onRemoveHomeworkFile={(index) =>
          setEditHomeworkFiles((currentFiles) => removeFileAtIndex(currentFiles, index))
        }
        onRemoveMaterialFile={(index) =>
          setEditMaterialFiles((currentFiles) => removeFileAtIndex(currentFiles, index))
        }
        onSubmit={handleUpdateLesson}
        open={isEditDialogOpen}
        students={students}
        submitLabel="Сохранить изменения"
        submittingLabel="Сохраняем..."
        title="Изменить занятие"
      />

      <TutorLessonDetailsDialog
        isDeleting={isDeletingLesson}
        lesson={selectedLesson}
        onDelete={handleDeleteLesson}
        onEdit={handleOpenEditDialog}
        onOpenChange={(open) => setSelectedLesson(open ? selectedLesson : null)}
        open={Boolean(selectedLesson)}
      />

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
          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Card className="rounded-[28px] border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">Всего учеников</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{students.length}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">Запланировано занятий на сегодня</p>
                  {todayLessonsCount > 0 ? (
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{todayLessonsCount}</p>
                  ) : (
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Нет запланированных занятий на сегодня
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Collapsible onOpenChange={setIsScheduleExpanded} open={isScheduleExpanded}>
              <Card className="rounded-[28px] border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Ближайшее занятие</p>
                      {nearestLesson ? (
                        <>
                          <p className="mt-3 text-2xl font-semibold text-slate-900">
                            {nearestLesson.studentName || "Ученик не указан"}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {nearestLesson.topic || "Без названия"}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                              <Clock3 className="size-4" />
                              {formatDate(nearestLesson.date)} в {formatTime(nearestLesson.time)}
                            </span>
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                              Еще занятий в расписании: {upcomingLessons.length}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="mt-3 text-2xl font-semibold text-slate-900">
                            Пока нет будущих занятий
                          </p>
                          <p className="mt-2 max-w-xl text-sm text-slate-500">
                            Разверните список ниже, чтобы просматривать прошедшие и будущие занятия по неделям.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {nearestLesson?.meetLink ? (
                        <Button asChild variant="outline">
                          <a href={nearestLesson.meetLink} rel="noreferrer" target="_blank">
                            <ExternalLink className="size-4" />
                            Ссылка на созвон
                          </a>
                        </Button>
                      ) : null}

                      {nearestLesson ? (
                        <Button onClick={() => handleOpenLessonDetails(nearestLesson)} variant="outline">
                          Открыть детали
                        </Button>
                      ) : null}

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost">
                          {isScheduleExpanded ? "Скрыть список" : "Показать список"}
                          <ChevronDown
                            className={`size-4 transition-transform ${
                              isScheduleExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <CollapsibleContent className="mt-4">
                <Card className="rounded-[28px] border-slate-200 shadow-sm">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Список занятий</p>
                        <h2 className="text-xl font-semibold text-slate-900">
                          {formatWeekLabel(listWeekStart)}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setListWeekOffset((current) => current - 1)}
                          size="icon"
                          variant="outline"
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          onClick={() => setListWeekOffset((current) => current + 1)}
                          size="icon"
                          variant="outline"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {listWeekLessons.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                        На этой неделе занятий нет.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {listWeekLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex flex-col gap-4 rounded-3xl border border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {lesson.studentName || "Ученик не указан"}
                              </p>
                              <p className="mt-1 truncate text-sm text-slate-500">
                                {lesson.topic || "Без названия"} • {formatDateTime(lesson.date, lesson.time)}
                              </p>
                              <p className="mt-2 text-xs text-slate-400">
                                Материалов: {lesson.materials.length}, файлов ДЗ: {lesson.homeworkTaskFiles.length}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {lesson.meetLink ? (
                                <Button asChild size="sm" variant="outline">
                                  <a href={lesson.meetLink} rel="noreferrer" target="_blank">
                                    Созвон
                                  </a>
                                </Button>
                              ) : null}
                              <Button
                                onClick={() => handleOpenLessonDetails(lesson)}
                                size="sm"
                                variant="outline"
                              >
                                Подробнее
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </section>

          {students.length === 0 ? (
            <EmptyState
              title="Сначала добавьте ученика"
              description="Создание занятий станет доступно сразу после того, как ученик будет привязан к вашему аккаунту."
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
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setCalendarWeekOffset((current) => current - 1)}
                    size="icon"
                    variant="outline"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  <div>
                    <p className="text-sm text-slate-500">Календарь занятий</p>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {formatMonthLabel(calendarWeekStart)}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatWeekLabel(calendarWeekStart)}
                    </p>
                  </div>

                  <Button
                    onClick={() => setCalendarWeekOffset((current) => current + 1)}
                    size="icon"
                    variant="outline"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>

                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                  <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                    За неделю
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="grid min-w-[980px] grid-cols-7">
                  {calendarDays.map((day) => {
                    const dayLessons = getLessonsForDay(calendarWeekLessons, day);

                    return (
                      <div
                        key={day.toISOString()}
                        className="min-h-[340px] border-r border-slate-200 px-4 py-5 last:border-r-0"
                      >
                        <div
                          className={`rounded-2xl px-3 py-3 ${
                            isToday(day) ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"
                          }`}
                        >
                          <p className="text-xs uppercase tracking-[0.2em] opacity-70">
                            {format(day, "EEEEEE", { locale: ru })}
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {format(day, "d MMM", { locale: ru })}
                          </p>
                        </div>

                        <div className="mt-4 space-y-3">
                          {dayLessons.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-400">
                              Свободно
                            </div>
                          ) : (
                            dayLessons.map((lesson) => (
                              <button
                                key={lesson.id}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                                onClick={() => handleOpenLessonDetails(lesson)}
                                type="button"
                              >
                                <p className="text-xs font-medium text-slate-500">
                                  {formatTime(lesson.time)}
                                </p>
                                <p className="mt-2 font-semibold text-slate-900">
                                  {lesson.studentName || "Ученик не указан"}
                                </p>
                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                  {lesson.topic || "Без названия"}
                                </p>
                                <p className="mt-3 text-xs text-slate-400">
                                  Материалов: {lesson.materials.length} • Файлов ДЗ:{" "}
                                  {lesson.homeworkTaskFiles.length}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}

