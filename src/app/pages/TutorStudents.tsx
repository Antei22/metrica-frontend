import { Plus, Search, Settings, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { uploadTutorFile } from "../api/files";
import { createTutorLesson, listTutorLessons } from "../api/lessons";
import {
  addTutorStudent,
  deleteTutorStudent,
  listTutorStudents,
  updateTutorStudent,
} from "../api/students";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  type LessonFormValues,
  TutorLessonFormDialog,
} from "../components/tutor/TutorLessonFormDialog";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getErrorMessage } from "../lib/errors";
import {
  FIELD_LIMITS,
  validateEmail,
  validateFirstName,
  validateLessonForm,
} from "../lib/formValidation";
import { formatDateTime } from "../lib/format";
import { isHomeworkDeadlineMissed } from "../lib/homework";
import {
  getLatestPastLesson,
  getNearestUpcomingLesson,
  sortLessonsChronologically,
} from "../lib/tutorLessonTimeline";
import {
  appendFiles,
  buildLessonPayload,
  getDefaultCreateLessonFormValues,
  removeFileAtIndex,
  storeMeetLink,
} from "../lib/tutorLessonForm";
import type { Lesson, LessonCollection, TutorStudent } from "../types/domain";

type HomeworkStatusView = {
  label: string;
  className: string;
  isPendingReview: boolean;
};

function hasHomeworkTask(lesson: Lesson) {
  return Boolean(lesson.homeworkDeadline || lesson.homeworkTaskFiles.length > 0);
}

function getLatestHomeworkLesson(lessons: Lesson[]) {
  for (let index = lessons.length - 1; index >= 0; index -= 1) {
    const lesson = lessons[index];

    if (hasHomeworkTask(lesson)) {
      return lesson;
    }
  }

  return null;
}

function getHomeworkStatusView(lesson: Lesson | null): HomeworkStatusView {
  if (lesson?.homeworkStatus === "checked") {
    return {
      label: "Проверено",
      className: "bg-emerald-100 text-emerald-700",
      isPendingReview: false,
    };
  }

  if (lesson?.homeworkStatus === "sent") {
    return {
      label: "На проверке",
      className: "bg-amber-100 text-amber-700",
      isPendingReview: true,
    };
  }

  if (lesson && isHomeworkDeadlineMissed(lesson)) {
    return {
      label: "Еще не отправлено",
      className: "bg-rose-50 text-rose-600",
      isPendingReview: false,
    };
  }

  return {
    label: "Еще не отправлено",
    className: "bg-slate-100 text-slate-600",
    isPendingReview: false,
  };
}

export function TutorStudents() {
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
  const [studentEmail, setStudentEmail] = useState("");
  const [studentEmailError, setStudentEmailError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editClassInfo, setEditClassInfo] = useState("");
  const [editStudentError, setEditStudentError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<LessonFormValues>(() =>
    getDefaultCreateLessonFormValues(),
  );
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [createMaterialFiles, setCreateMaterialFiles] = useState<File[]>([]);
  const [createHomeworkFiles, setCreateHomeworkFiles] = useState<File[]>([]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [student.fullName, student.classInfo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, students]);

  const allLessons = useMemo(
    () => sortLessonsChronologically([...lessonGroups.upcoming, ...lessonGroups.past]),
    [lessonGroups],
  );

  const lessonsByStudent = useMemo(() => {
    const groupedLessons = new Map<number, Lesson[]>();

    for (const lesson of allLessons) {
      const currentLessons = groupedLessons.get(lesson.tutorStudentId) || [];
      currentLessons.push(lesson);
      groupedLessons.set(lesson.tutorStudentId, currentLessons);
    }

    return groupedLessons;
  }, [allLessons]);

  const createDialogStudent = useMemo(
    () => students.find((student) => String(student.id) === createForm.tutorStudentId) || null,
    [createForm.tutorStudentId, students],
  );
  const editingStudent = useMemo(
    () => students.find((student) => student.id === editingStudentId) || null,
    [editingStudentId, students],
  );

  async function loadStudentsPageData() {
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
        setLessonsWarning(getErrorMessage(lessonError, "Не удалось загрузить занятия учеников."));
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить список учеников."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudentsPageData();
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

  function resetCreateState(studentId?: number) {
    setCreateForm(getDefaultCreateLessonFormValues(studentId ? String(studentId) : ""));
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

  function openCreateDialogForStudent(studentId: number) {
    resetCreateState(studentId);
    setIsCreateDialogOpen(true);
  }

  function openEditStudentDialog(student?: TutorStudent) {
    const studentToEdit = student || students[0];

    if (!studentToEdit) {
      return;
    }

    setEditingStudentId(studentToEdit.id);
    setEditFirstName(studentToEdit.firstName || studentToEdit.fullName.split(" ")[0] || "");
    setEditLastName(studentToEdit.lastName || "");
    setEditEmail(studentToEdit.email || "");
    setEditClassInfo(studentToEdit.classInfo || "");
    setEditStudentError(null);
    setIsEditDialogOpen(true);
  }

  function selectEditingStudent(studentId: number) {
    const student = students.find((item) => item.id === studentId);
    setEditingStudentId(studentId);
    setEditFirstName(student?.firstName || student?.fullName.split(" ")[0] || "");
    setEditLastName(student?.lastName || "");
    setEditEmail(student?.email || "");
    setEditClassInfo(student?.classInfo || "");
    setEditStudentError(null);
  }

  function handleCardKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    studentId: number,
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    navigate(`/tutor/students/${studentId}`);
  }

  async function handleAddStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateEmail(studentEmail);

    if (validationError) {
      setStudentEmailError(validationError);
      return;
    }

    setIsSubmitting(true);
    setStudentEmailError(null);

    try {
      const createdStudent = await addTutorStudent(studentEmail.trim());
      setStudents((currentStudents) => [createdStudent, ...currentStudents]);
      setStudentEmail("");
      setStudentEmailError(null);
      setIsDialogOpen(false);
      toast.success("Ученик добавлен");
    } catch (submitError) {
      const errorMessage = getErrorMessage(submitError, "Не удалось добавить ученика.");
      setStudentEmailError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingStudentId) {
      return;
    }

    const firstNameError = validateFirstName(editFirstName);

    if (firstNameError) {
      setEditStudentError(firstNameError);
      return;
    }

    const emailError = validateEmail(editEmail);

    if (emailError) {
      setEditStudentError(emailError);
      return;
    }

    if (editLastName.trim().length > FIELD_LIMITS.personName) {
      setEditStudentError("Введите более короткую фамилию.");
      return;
    }

    setIsEditSubmitting(true);
    setEditStudentError(null);

    try {
      const updatedStudent = await updateTutorStudent(editingStudentId, {
        email: editEmail.trim(),
        firstName: editFirstName.trim(),
        lastName: editLastName.trim() || null,
        subject: null,
        classInfo: editClassInfo.trim() || null,
      });
      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === updatedStudent.id ? updatedStudent : student,
        ),
      );
      setIsEditDialogOpen(false);
      toast.success("Данные ученика обновлены");
    } catch (submitError) {
      const errorMessage = getErrorMessage(submitError, "Не удалось обновить данные ученика.");
      setEditStudentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleDeleteStudent() {
    if (!editingStudentId) {
      return;
    }

    setIsDeletingStudent(true);
    setEditStudentError(null);

    try {
      await deleteTutorStudent(editingStudentId);
      setIsEditDialogOpen(false);
      await loadStudentsPageData();
      toast.success("Ученик удален из списка");
    } catch (deleteError) {
      const errorMessage = getErrorMessage(deleteError, "Не удалось удалить ученика.");
      setEditStudentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeletingStudent(false);
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

      storeMeetLink(createForm.meetLink);
      closeCreateDialog(false);
      await loadStudentsPageData();
      toast.success("Занятие создано");
    } catch (submitError) {
      const errorMessage = getErrorMessage(submitError, "Не удалось создать занятие.");
      setCreateFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreateSubmitting(false);
    }
  }

  return (
    <AppLayout
      title="Мои ученики"
      description="Нажмите на карточку ученика, чтобы открыть отдельный экран с прогрессом занятий."
    >
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить ученика</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddStudent}>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email ученика</Label>
              <Input
                id="student-email"
                maxLength={FIELD_LIMITS.email}
                placeholder="student@example.com"
                type="email"
                value={studentEmail}
                onChange={(event) => {
                  setStudentEmail(event.target.value);
                  setStudentEmailError(null);
                }}
                required
              />
            </div>

            {studentEmailError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {studentEmailError}
              </div>
            ) : null}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                className="bg-slate-900 text-white hover:bg-slate-800"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Добавляем..." : "Добавить"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки ученика</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateStudent}>
            <div className="space-y-2">
              <Label htmlFor="edit-student">Ученик</Label>
              <select
                className="border-input bg-input-background flex h-10 w-full rounded-md border px-3 text-sm outline-none"
                id="edit-student"
                value={editingStudentId ?? ""}
                onChange={(event) => selectEditingStudent(Number(event.target.value))}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">Имя</Label>
                <Input
                  id="edit-first-name"
                  maxLength={FIELD_LIMITS.personName}
                  value={editFirstName}
                  onChange={(event) => {
                    setEditFirstName(event.target.value);
                    setEditStudentError(null);
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Фамилия</Label>
                <Input
                  id="edit-last-name"
                  maxLength={FIELD_LIMITS.personName}
                  value={editLastName}
                  onChange={(event) => {
                    setEditLastName(event.target.value);
                    setEditStudentError(null);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                maxLength={FIELD_LIMITS.email}
                type="email"
                value={editEmail}
                onChange={(event) => {
                  setEditEmail(event.target.value);
                  setEditStudentError(null);
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-class-info">Класс/группа</Label>
              <Input
                id="edit-class-info"
                maxLength={500}
                placeholder="Например, 7 класс"
                value={editClassInfo}
                onChange={(event) => setEditClassInfo(event.target.value)}
              />
            </div>

            {editStudentError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {editStudentError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="text-red-600 hover:text-red-700"
                    disabled={!editingStudent || isDeletingStudent}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                    Удалить ученика
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить ученика?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ученик будет удален из вашего списка вместе с его занятиями у вас. Аккаунт ученика не удаляется.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 text-white hover:bg-red-700"
                      disabled={isDeletingStudent}
                      onClick={() => void handleDeleteStudent()}
                      type="button"
                    >
                      {isDeletingStudent ? "Удаляем..." : "Удалить"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setIsEditDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Отмена
                </Button>
                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800"
                  disabled={!editingStudent || isEditSubmitting}
                  type="submit"
                >
                  {isEditSubmitting ? "Сохраняем..." : "Сохранить"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <TutorLessonFormDialog
        description={
          createDialogStudent
            ? `Ученик уже выбран: ${createDialogStudent.fullName}. Укажите дату, время и тему занятия.`
            : "Выберите ученика, укажите дату, время и тему занятия."
        }
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

      {loading ? <LoadingState title="Загружаем учеников..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось загрузить учеников"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadStudentsPageData()}
        />
      ) : null}

      {!loading && !error ? (
        <>
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Всего учеников</p>
                  <p className="text-3xl font-semibold text-slate-900">{students.length}</p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-2xl">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-11 rounded-full border-slate-200 bg-slate-100 pl-11 pr-4 text-base shadow-none placeholder:text-slate-400 focus:bg-white"
                      placeholder="Поиск"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      aria-label="Добавить ученика"
                      className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                      onClick={() => setIsDialogOpen(true)}
                      size="icon"
                      type="button"
                    >
                      <Plus className="size-5" />
                    </Button>
                    <Button
                      aria-label="Настройки учеников"
                      className="rounded-full"
                      disabled={students.length === 0}
                      onClick={() => openEditStudentDialog()}
                      size="icon"
                      title="Настройки учеников"
                      type="button"
                      variant="outline"
                    >
                      <Settings className="size-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {lessonsWarning ? (
            <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="p-6 text-sm text-amber-800">{lessonsWarning}</CardContent>
            </Card>
          ) : null}

          {students.length === 0 ? (
            <EmptyState
              title="Пока нет учеников"
              description="Добавьте первого ученика по email, чтобы создавать для него занятия."
              actionLabel="Добавить ученика"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : null}

          {students.length > 0 && filteredStudents.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте другой запрос или очистите поиск."
            />
          ) : null}

          {filteredStudents.length > 0 ? (
            <div className="grid gap-4">
              {filteredStudents.map((student) => {
                const studentLessons = lessonsByStudent.get(student.id) || [];
                const nearestLesson = getNearestUpcomingLesson(studentLessons);
                const lastPastLesson = getLatestPastLesson(studentLessons);
                const latestHomeworkLesson = getLatestHomeworkLesson(studentLessons);
                const homeworkStatus = getHomeworkStatusView(latestHomeworkLesson);

                return (
                  <Card
                    key={student.id}
                    className="rounded-3xl border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5"
                    onClick={() => navigate(`/tutor/students/${student.id}`)}
                    onKeyDown={(event) => handleCardKeyDown(event, student.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <CardHeader className="gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle>{student.fullName}</CardTitle>
                          {student.classInfo ? (
                            <p className="mt-2 text-sm text-slate-500">
                              {student.classInfo}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${homeworkStatus.className}`}
                        >
                          {homeworkStatus.label}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {studentLessons.length > 0
                              ? `Занятий: ${studentLessons.length}`
                              : "Создать занятие"}
                          </span>
                          {nearestLesson ? (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              Ближайшее: {formatDateTime(nearestLesson.date, nearestLesson.time)}
                            </span>
                          ) : lastPastLesson ? (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              Последнее: {formatDateTime(lastPastLesson.date, lastPastLesson.time)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            openCreateDialogForStudent(student.id);
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          Создать занятие
                        </Button>
                        {homeworkStatus.isPendingReview ? (
                          <Button
                            className="bg-slate-900 text-white hover:bg-slate-800"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate("/tutor/homework");
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            Проверить ДЗ
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}
