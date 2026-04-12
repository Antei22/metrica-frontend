import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import { cn } from "../components/ui/utils";
import { getErrorMessage } from "../lib/errors";
import { validateLessonForm } from "../lib/formValidation";
import { formatDateTime } from "../lib/format";
import {
  getLatestPastLesson,
  getNearestUpcomingLesson,
  sortLessonsChronologically,
} from "../lib/tutorLessonTimeline";
import {
  appendFiles,
  buildLessonPayload,
  collectPersistedFileIds,
  getDefaultCreateLessonFormValues,
  getLessonFormValues,
  mergeFileIds,
  removeFileAtIndex,
  storeMeetLink,
} from "../lib/tutorLessonForm";
import type { Lesson, LessonCollection, TutorStudent } from "../types/domain";

function getTimelineNodeClass(isNearest: boolean) {
  return isNearest
    ? "size-6 border-slate-900 bg-slate-900 shadow-[0_0_0_6px_rgba(15,23,42,0.08)]"
    : "size-4 border-slate-300 bg-white";
}

export function TutorStudentProgress() {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [createForm, setCreateForm] = useState<LessonFormValues>(() =>
    getDefaultCreateLessonFormValues(),
  );
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [createMaterialFiles, setCreateMaterialFiles] = useState<File[]>([]);
  const [createHomeworkFiles, setCreateHomeworkFiles] = useState<File[]>([]);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<LessonFormValues>(initialLessonFormValues);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editMaterialFiles, setEditMaterialFiles] = useState<File[]>([]);
  const [editHomeworkFiles, setEditHomeworkFiles] = useState<File[]>([]);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

  const currentStudent = useMemo(
    () => students.find((student) => String(student.id) === id) || null,
    [id, students],
  );

  const allLessons = useMemo(
    () => sortLessonsChronologically([...lessonGroups.upcoming, ...lessonGroups.past]),
    [lessonGroups],
  );

  const studentLessons = useMemo(() => {
    if (!currentStudent) {
      return [];
    }

    return allLessons.filter((lesson) => lesson.tutorStudentId === currentStudent.id);
  }, [allLessons, currentStudent]);

  const nearestLesson = useMemo(
    () => getNearestUpcomingLesson(studentLessons),
    [studentLessons],
  );

  const lastPastLesson = useMemo(
    () => getLatestPastLesson(studentLessons),
    [studentLessons],
  );

  useEffect(() => {
    if (!currentStudent) {
      return;
    }

    setCreateForm((currentForm) => ({
      ...currentForm,
      tutorStudentId: currentForm.tutorStudentId || String(currentStudent.id),
    }));
  }, [currentStudent]);

  async function loadStudentProgressData() {
    if (!id) {
      setError("Не найден идентификатор ученика.");
      setLoading(false);
      return;
    }

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
        setLessonsWarning(getErrorMessage(lessonError, "Не удалось загрузить занятия ученика."));
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить прогресс ученика."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudentProgressData();
  }, [id]);

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
    setCreateForm(
      getDefaultCreateLessonFormValues(currentStudent ? String(currentStudent.id) : ""),
    );
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

  function openCreateDialog() {
    resetCreateState();
    setIsCreateDialogOpen(true);
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

      storeMeetLink(createForm.meetLink);
      closeCreateDialog(false);
      await loadStudentProgressData();
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
    setEditForm(getLessonFormValues(lesson));
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
      await loadStudentProgressData();
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
      await loadStudentProgressData();
      toast.success("Занятие удалено");
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Не удалось удалить занятие."));
    } finally {
      setIsDeletingLesson(false);
    }
  }

  const pageTitle = currentStudent?.fullName || "Прогресс ученика";
  const pageDescription = currentStudent
    ? `${currentStudent.subject || "Предмет не указан"}${currentStudent.classInfo ? ` • ${currentStudent.classInfo}` : ""}`
    : "История и ближайшие занятия ученика.";

  return (
    <AppLayout
      title={pageTitle}
      description={pageDescription}
      actions={
        <>
          <Button variant="outline" onClick={() => navigate("/tutor/students")}>
            <ArrowLeft className="size-4" />
            К ученикам
          </Button>
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800"
            onClick={openCreateDialog}
          >
            Создать занятие
          </Button>
        </>
      }
    >
      <TutorLessonFormDialog
        description="Укажите дату, время и тему занятия для этого ученика."
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
        description="Измените дату, тему, ссылку на созвон и при необходимости прикрепите новые материалы."
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
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLesson(null);
          }
        }}
        open={Boolean(selectedLesson)}
      />

      {loading ? <LoadingState title="Загружаем прогресс ученика..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось открыть прогресс ученика"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadStudentProgressData()}
        />
      ) : null}

      {!loading && !error && !currentStudent ? (
        <EmptyState
          title="Ученик не найден"
          description="Возможно, ссылка устарела или ученик больше не привязан к вашему аккаунту."
          actionLabel="Вернуться к ученикам"
          onAction={() => navigate("/tutor/students")}
        />
      ) : null}

      {!loading && !error && currentStudent ? (
        <>
          {lessonsWarning ? (
            <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="p-6 text-sm text-amber-800">{lessonsWarning}</CardContent>
            </Card>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="space-y-3 p-6">
                <p className="text-sm text-slate-500">Всего занятий</p>
                <p className="text-3xl font-semibold text-slate-900">{studentLessons.length}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="space-y-3 p-6">
                <p className="text-sm text-slate-500">
                  {nearestLesson ? "Ближайшее занятие" : "Последнее занятие"}
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {nearestLesson
                    ? formatDateTime(nearestLesson.date, nearestLesson.time)
                    : lastPastLesson
                      ? formatDateTime(lastPastLesson.date, lastPastLesson.time)
                      : "Пока нет занятий"}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-lg font-semibold text-slate-900">Прогресс по занятиям</p>
              <p className="mt-1 text-sm text-slate-500">
                Прошедшие занятия идут выше, будущие ниже.
              </p>
            </div>

            <div className="p-6">
              {studentLessons.length === 0 ? (
                <div className="flex gap-4">
                  <div className="relative flex w-10 shrink-0 justify-center">
                    <button
                      className="relative z-10 mt-1 flex size-8 items-center justify-center rounded-full border border-dashed border-slate-400 bg-white text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                      onClick={openCreateDialog}
                      type="button"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <button
                    className="flex-1 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-left transition hover:border-slate-900 hover:shadow-sm"
                    onClick={openCreateDialog}
                    type="button"
                  >
                    <p className="text-sm font-semibold text-slate-900">Создать занятие</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Добавьте дату, тему урока и материалы для этого ученика.
                    </p>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute top-4 bottom-0 left-5 w-px -translate-x-1/2 bg-slate-200" />

                  {studentLessons.map((lesson) => {
                    const isNearest = nearestLesson?.id === lesson.id;

                    return (
                      <div key={lesson.id} className="flex gap-4 pb-4 last:pb-0">
                        <div className="relative flex w-10 shrink-0 justify-center">
                          <span className="relative z-10 mt-1 flex size-6 items-center justify-center">
                            <span
                              className={cn(
                                "rounded-full border-2",
                                getTimelineNodeClass(isNearest),
                              )}
                            />
                          </span>
                        </div>

                        <button
                          className={cn(
                            "flex-1 rounded-2xl border bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                            isNearest
                              ? "border-slate-900 shadow-sm"
                              : "border-slate-200 hover:border-slate-300",
                          )}
                          onClick={() => handleOpenLessonDetails(lesson)}
                          type="button"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm text-slate-500">
                                {formatDateTime(lesson.date, lesson.time)}
                              </p>
                              <p className="mt-1 text-base font-semibold text-slate-900">
                                {lesson.topic || "Тема не указана"}
                              </p>
                            </div>
                            {isNearest ? (
                              <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                                Ближайшее занятие
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-3 text-sm text-slate-500">
                            Материалов: {lesson.materials.length} • Файлов ДЗ:{" "}
                            {lesson.homeworkTaskFiles.length}
                          </p>
                        </button>
                      </div>
                    );
                  })}

                  <div className="flex gap-4 pt-2">
                    <div className="relative flex w-10 shrink-0 justify-center">
                      <button
                        className="relative z-10 mt-1 flex size-8 items-center justify-center rounded-full border border-dashed border-slate-400 bg-white text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        onClick={openCreateDialog}
                        type="button"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>

                    <button
                      className="flex-1 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-left transition hover:border-slate-900 hover:shadow-sm"
                      onClick={openCreateDialog}
                      type="button"
                    >
                      <p className="text-sm font-semibold text-slate-900">Создать занятие</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Добавьте следующее занятие в цепочку этого ученика.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </AppLayout>
  );
}
