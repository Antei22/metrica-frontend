import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { uploadTutorFile } from "../api/files";
import { createTutorLesson, listTutorLessons } from "../api/lessons";
import { addTutorStudent, listTutorStudents } from "../api/students";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
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
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getErrorMessage } from "../lib/errors";
import { FIELD_LIMITS, validateEmail, validateLessonForm } from "../lib/formValidation";
import { formatDateTime } from "../lib/format";
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

function getStatusBadge(status: TutorStudent["lastSubmissionStatus"]) {
  if (status === "checked") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getStatusLabel(status: TutorStudent["lastSubmissionStatus"]) {
  if (status === "checked") {
    return "Проверено";
  }

  if (status === "pending") {
    return "На проверке";
  }

  return "Нет отправок";
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
      [student.fullName, student.subject, student.classInfo]
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
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
              Добавить ученика
            </Button>
          </DialogTrigger>
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
      }
    >
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Всего учеников</p>
                  <p className="text-3xl font-semibold text-slate-900">{students.length}</p>
                </div>
                <div className="w-full sm:max-w-xs">
                  <Input
                    placeholder="Поиск по имени, предмету или классу"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
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
                          <p className="mt-2 text-sm text-slate-500">
                            {student.subject || "Предмет не указан"}
                            {student.classInfo ? ` • ${student.classInfo}` : ""}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(student.lastSubmissionStatus)}`}
                        >
                          {getStatusLabel(student.lastSubmissionStatus)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Связь с учеником: #{student.id}</p>
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
                        {student.lastSubmissionStatus === "pending" ? (
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
