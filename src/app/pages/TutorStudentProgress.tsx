import { ArrowLeft, ChevronDown, Gift, Plus, Save, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { uploadTutorFile } from "../api/files";
import {
  createBonusTask,
  getTutorStudentGamification,
  updateBonusTask,
  updateTutorStudentGamification,
} from "../api/gamification";
import {
  createTutorLesson,
  deleteTutorLesson,
  listTutorLessons,
  updateTutorLesson,
  updateTutorLessonParentMessage,
} from "../api/lessons";
import { listTutorStudents, updateTutorStudent } from "../api/students";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { LessonProgressTimeline } from "../components/LessonProgressTimeline";
import { StarValue } from "../components/StarValue";
import { TutorLessonDetailsDialog } from "../components/tutor/TutorLessonDetailsDialog";
import {
  initialLessonFormValues,
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
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { getErrorMessage } from "../lib/errors";
import { validateLessonForm } from "../lib/formValidation";
import { formatDateTime } from "../lib/format";
import { normalizeHalfStepValue, parseHalfStepValue } from "../lib/homework";
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
import type {
  Gamification,
  Lesson,
  LessonCollection,
  TutorStudent,
} from "../types/domain";

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
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [gamificationWarning, setGamificationWarning] = useState<string | null>(null);
  const [isSavingGamification, setIsSavingGamification] = useState(false);
  const [isCreatingBonusTask, setIsCreatingBonusTask] = useState(false);
  const [starsEnabled, setStarsEnabled] = useState(false);
  const [parentContactEnabled, setParentContactEnabled] = useState(false);
  const [starGoal, setStarGoal] = useState("");
  const [starRewardTitle, setStarRewardTitle] = useState("");
  const [bonusTitle, setBonusTitle] = useState("");
  const [bonusDescription, setBonusDescription] = useState("");
  const [bonusStars, setBonusStars] = useState("1");
  const [bonusRewardTitle, setBonusRewardTitle] = useState("");
  const [bonusDueDate, setBonusDueDate] = useState("");
  const [isBonusExpanded, setIsBonusExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isParentLessonSelectMode, setIsParentLessonSelectMode] = useState(false);
  const [parentMessageLesson, setParentMessageLesson] = useState<Lesson | null>(null);
  const [parentMessage, setParentMessage] = useState("");
  const [parentMessageFiles, setParentMessageFiles] = useState<File[]>([]);
  const [isSendingParentMessage, setIsSendingParentMessage] = useState(false);

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

  useEffect(() => {
    if (!gamification) {
      return;
    }

    setStarsEnabled(gamification.starRewardsEnabled);
    setStarGoal(gamification.starGoal ? String(gamification.starGoal) : "");
    setStarRewardTitle(gamification.starRewardTitle || "");
  }, [gamification]);

  useEffect(() => {
    setParentContactEnabled(Boolean(currentStudent?.parentContactEnabled));
  }, [currentStudent?.parentContactEnabled]);

  async function loadStudentProgressData() {
    if (!id) {
      setError("Не найден идентификатор ученика.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLessonsWarning(null);
    setGamificationWarning(null);

    try {
      const tutorStudents = await listTutorStudents();
      setStudents(tutorStudents);
      const loadedStudent = tutorStudents.find((student) => String(student.id) === id);

      if (loadedStudent) {
        try {
          setGamification(await getTutorStudentGamification(loadedStudent.id));
        } catch (gamificationError) {
          setGamification(null);
          setGamificationWarning(
            getErrorMessage(
              gamificationError,
              "Не удалось загрузить настройки наград и бонусные задания.",
            ),
          );
        }
      } else {
        setGamification(null);
      }

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

  async function handleSaveGamification() {
    if (!currentStudent) {
      return;
    }

    setIsSavingGamification(true);

    try {
      const normalizedGoal = starsEnabled ? parseHalfStepValue(starGoal) : null;
      const updated = await updateTutorStudentGamification(currentStudent.id, {
        starRewardsEnabled: starsEnabled,
        starGoal: normalizedGoal,
        starRewardTitle: starRewardTitle.trim() || null,
      });
      const updatedStudent = await updateTutorStudent(currentStudent.id, {
        classInfo: currentStudent.classInfo,
        email: currentStudent.email,
        firstName: currentStudent.firstName,
        lastName: currentStudent.lastName,
        parentContactEnabled,
        subject: currentStudent.subject,
      });
      setGamification(updated);
      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === updatedStudent.id ? updatedStudent : student,
        ),
      );
      setStarGoal(normalizedGoal ? String(normalizedGoal) : "");
      setIsSettingsExpanded(false);
      toast.success("Настройки сохранены");
    } catch (saveError) {
      toast.error(
        getErrorMessage(saveError, "Не удалось сохранить настройки."),
      );
    } finally {
      setIsSavingGamification(false);
    }
  }

  async function handleCreateBonusTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentStudent || !bonusTitle.trim()) {
      return;
    }

    if (gamification?.starRewardsEnabled && !gamification.starGoal) {
      toast.error("Сначала укажите и сохраните глобальную цель.");
      return;
    }

    if (!gamification?.starRewardsEnabled && !bonusRewardTitle.trim()) {
      toast.error("Укажите награду за бонусное задание.");
      return;
    }

    setIsCreatingBonusTask(true);

    try {
      const normalizedBonusStars = gamification?.starRewardsEnabled
        ? parseHalfStepValue(bonusStars, { max: 100 })
        : null;

      await createBonusTask(currentStudent.id, {
        title: bonusTitle.trim(),
        description: bonusDescription.trim() || null,
        stars: normalizedBonusStars,
        rewardTitle: bonusRewardTitle.trim() || null,
        dueDate: bonusDueDate || null,
      });
      setBonusTitle("");
      setBonusDescription("");
      setBonusStars("1");
      setBonusRewardTitle("");
      setBonusDueDate("");
      setGamification(await getTutorStudentGamification(currentStudent.id));
      toast.success("Бонусное задание создано");
    } catch (createError) {
      toast.error(
        getErrorMessage(createError, "Не удалось создать бонусное задание."),
      );
    } finally {
      setIsCreatingBonusTask(false);
    }
  }

  async function handleToggleBonusTask(taskId: number, isCompleted: boolean) {
    if (!currentStudent) {
      return;
    }

    try {
      await updateBonusTask(taskId, { isCompleted });
      setGamification(await getTutorStudentGamification(currentStudent.id));
    } catch (updateError) {
      toast.error(
        getErrorMessage(updateError, "Не удалось обновить бонусное задание."),
      );
    }
  }

  function openParentMessageDialog(lesson: Lesson) {
    setParentMessageLesson(lesson);
    setParentMessage(lesson.parentComment || "");
    setParentMessageFiles([]);
  }

  async function handleSendParentMessage() {
    if (!parentMessageLesson) {
      return;
    }

    setIsSendingParentMessage(true);

    try {
      const fileRefs = await Promise.all(
        parentMessageFiles.map((file) => uploadTutorFile(file)),
      );
      await updateTutorLessonParentMessage(parentMessageLesson.id, {
        comment: parentMessage.trim(),
        fileIds: fileRefs.map((file) => file.fileId),
      });
      setParentMessageLesson(null);
      setParentMessage("");
      setParentMessageFiles([]);
      setIsParentLessonSelectMode(false);
      await loadStudentProgressData();
      toast.success("Сообщение родителю сохранено");
    } catch (sendError) {
      toast.error(
        getErrorMessage(sendError, "Не удалось сохранить сообщение родителю."),
      );
    } finally {
      setIsSendingParentMessage(false);
    }
  }

  const pageTitle = currentStudent?.fullName || "История занятий";
  const studentMeta = currentStudent ? currentStudent.classInfo || "" : "";
  const pageDescription = currentStudent
    ? studentMeta || "История занятий, файлы ДЗ, оценки и бонусные задания ученика."
    : "История занятий, файлы ДЗ, оценки и бонусные задания ученика.";
  const isStarRewardsEnabled = Boolean(gamification?.starRewardsEnabled);
  const canAssignBonusTasks = isStarRewardsEnabled ? Boolean(gamification?.starGoal) : true;
  const starsGoal = gamification?.starGoal || null;
  const earnedStars = gamification?.earnedStars || 0;
  const starProgress = starsGoal ? Math.min(100, (earnedStars / starsGoal) * 100) : 0;
  const isGoalReached = Boolean(starsGoal && earnedStars >= starsGoal);

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
            aria-label="Создать занятие"
            className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
            onClick={openCreateDialog}
            size="icon"
            title="Создать занятие"
            type="button"
          >
            <Plus className="size-5" />
          </Button>
          <Button
            aria-label="Настройки ученика"
            aria-pressed={isSettingsExpanded}
            className="rounded-full"
            disabled={!gamification}
            onClick={() => setIsSettingsExpanded((current) => !current)}
            size="icon"
            title="Настройки ученика"
            type="button"
            variant="outline"
          >
            <Settings className="size-5" />
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
        description="Измените дату, тему, ссылку на звонок и при необходимости прикрепите новые материалы."
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

      <Dialog open={isSettingsExpanded} onOpenChange={setIsSettingsExpanded}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки ученика</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Связь с родителем</p>
                <p className="text-sm text-slate-500">
                  Родитель увидит выбранные занятия, оценку и комментарий репетитора.
                </p>
              </div>
              <Switch
                checked={parentContactEnabled}
                onCheckedChange={setParentContactEnabled}
              />
            </div>

            <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Накопление наград</p>
                  <p className="text-sm text-slate-500">
                    Оценки за проверенные ДЗ идут в общий прогресс.
                  </p>
                </div>
                <Switch checked={starsEnabled} onCheckedChange={setStarsEnabled} />
              </div>

              {starsEnabled ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="star-goal-dialog">Глобальная цель</Label>
                    <Input
                      id="star-goal-dialog"
                      max="1000"
                      min="0.5"
                      step="0.5"
                      type="number"
                      value={starGoal}
                      onBlur={() => setStarGoal(normalizeHalfStepValue(starGoal))}
                      onChange={(event) => setStarGoal(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="star-reward-dialog">Награда за цель</Label>
                    <Input
                      id="star-reward-dialog"
                      maxLength={100}
                      value={starRewardTitle}
                      onChange={(event) => setStarRewardTitle(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-slate-900 text-white hover:bg-slate-800"
                disabled={isSavingGamification}
                onClick={handleSaveGamification}
              >
                <Save className="size-4" />
                {isSavingGamification ? "Сохраняем..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(parentMessageLesson)} onOpenChange={(open) => {
        if (!open) {
          setParentMessageLesson(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сообщение родителю</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              {parentMessageLesson
                ? formatDateTime(parentMessageLesson.date, parentMessageLesson.time)
                : ""}
            </p>
            <div className="space-y-2">
              <Label htmlFor="parent-message">Комментарий репетитора</Label>
              <Textarea
                id="parent-message"
                value={parentMessage}
                onChange={(event) => setParentMessage(event.target.value)}
                placeholder="Напишите, что важно передать родителю"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-message-files">Файлы для родителя</Label>
              <Input
                id="parent-message-files"
                multiple
                type="file"
                onChange={(event) => {
                  setParentMessageFiles((currentFiles) => [
                    ...currentFiles,
                    ...Array.from(event.target.files || []),
                  ]);
                  event.target.value = "";
                }}
              />
              {parentMessageFiles.length > 0 ? (
                <div className="space-y-2">
                  {parentMessageFiles.map((file, index) => (
                    <div
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm"
                      key={`${file.name}-${file.lastModified}`}
                    >
                      <span className="truncate">{file.name}</span>
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setParentMessageFiles((files) =>
                            files.filter((_, fileIndex) => fileIndex !== index),
                          )
                        }
                      >
                        Убрать
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setParentMessageLesson(null)}
              >
                Назад к выбору занятия
              </Button>
              <Button
                className="bg-slate-900 text-white hover:bg-slate-800"
                disabled={isSendingParentMessage}
                onClick={() => void handleSendParentMessage()}
              >
                {isSendingParentMessage ? "Сохраняем..." : "Отправить родителю"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

          {gamificationWarning ? (
            <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="p-6 text-sm text-amber-800">
                {gamificationWarning}
              </CardContent>
            </Card>
          ) : null}

          {gamification ? (
            <>

              <section className="grid gap-4 sm:grid-cols-2">
                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">Всего занятий</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">
                        {studentLessons.length}
                      </p>
                    </div>
                    {currentStudent.parentContactEnabled ? (
                      <div>
                        <p className="text-sm text-slate-500">
                          {nearestLesson ? "Ближайшее занятие" : "Последнее занятие"}
                        </p>
                        <p className="mt-3 text-lg font-semibold text-slate-900">
                          {nearestLesson
                            ? formatDateTime(nearestLesson.date, nearestLesson.time)
                            : lastPastLesson
                              ? formatDateTime(lastPastLesson.date, lastPastLesson.time)
                              : "Пока нет занятий"}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {!currentStudent.parentContactEnabled ? (
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
                ) : (
                  <button
                    className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => setIsParentLessonSelectMode(true)}
                    type="button"
                  >
                    <p className="text-sm text-slate-500">Связь с родителем</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">
                      Написать родителю
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Выберите занятие из истории, чтобы отправить комментарий.
                    </p>
                  </button>
                )}

                {isStarRewardsEnabled ? (
                  <Card
                    className={`rounded-3xl shadow-sm ${
                      isGoalReached
                        ? "border-amber-200 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100"
                        : "border-slate-200"
                    }`}
                  >
                    <CardContent className="space-y-3 p-6">
                      <p className="text-sm text-slate-500">Накоплено</p>
                      <p className="text-2xl font-semibold text-slate-900">
                        {earnedStars.toLocaleString("ru-RU")} /{" "}
                        {starsGoal ? starsGoal.toLocaleString("ru-RU") : "цель не задана"}
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${starProgress}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card
                  className={`rounded-3xl border-slate-200 shadow-sm ${
                    isStarRewardsEnabled ? "" : "sm:col-span-2"
                  }`}
                >
                  <CardContent className="flex h-full flex-col justify-between gap-4 p-6">
                    <div>
                      <p className="flex items-center gap-2 text-sm text-slate-500">
                        <Gift className="size-4 text-emerald-600" />
                        Бонусные задания
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">
                        {gamification.bonusTasks.filter((task) => !task.isCompleted).length}
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsBonusExpanded((current) => !current)}
                      variant="outline"
                    >
                      {isBonusExpanded ? "Свернуть" : "Развернуть"}
                      <ChevronDown
                        className={`size-4 transition-transform ${
                          isBonusExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CardContent>
                </Card>
              </section>

              {isBonusExpanded ? (
                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="size-5 text-emerald-600" />
                      Бонусные задания
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!canAssignBonusTasks ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Сначала укажите и сохраните глобальную цель.
                      </div>
                    ) : null}

                    <form className="grid gap-3" onSubmit={handleCreateBonusTask}>
                      <div
                        className={`grid gap-3 ${
                          isStarRewardsEnabled
                            ? "sm:grid-cols-[1fr_160px]"
                            : "sm:grid-cols-[1fr_220px]"
                        }`}
                      >
                        <Input
                          disabled={!canAssignBonusTasks}
                          maxLength={100}
                          placeholder="Например, сдать ДЗ до четверга"
                          value={bonusTitle}
                          onChange={(event) => setBonusTitle(event.target.value)}
                          required
                        />
                        {isStarRewardsEnabled ? (
                          <Input
                            disabled={!canAssignBonusTasks}
                            max="100"
                            min="0.5"
                            step="0.5"
                            type="number"
                            value={bonusStars}
                            onBlur={() =>
                              setBonusStars(normalizeHalfStepValue(bonusStars, { max: 100 }))
                            }
                            onChange={(event) => setBonusStars(event.target.value)}
                          />
                        ) : (
                          <Input
                            maxLength={100}
                            placeholder="Награда"
                            value={bonusRewardTitle}
                            onChange={(event) => setBonusRewardTitle(event.target.value)}
                            required
                          />
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                        <Input
                          disabled={!canAssignBonusTasks}
                          maxLength={1000}
                          placeholder="Комментарий к заданию"
                          value={bonusDescription}
                          onChange={(event) => setBonusDescription(event.target.value)}
                        />
                        <Input
                          disabled={!canAssignBonusTasks}
                          type="date"
                          value={bonusDueDate}
                          onChange={(event) => setBonusDueDate(event.target.value)}
                        />
                        <Button
                          className="bg-slate-900 text-white hover:bg-slate-800"
                          disabled={!canAssignBonusTasks || isCreatingBonusTask}
                          type="submit"
                        >
                          {isCreatingBonusTask ? "Создаем..." : "Добавить"}
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-2">
                      {gamification.bonusTasks.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                          Бонусных заданий пока нет.
                        </p>
                      ) : (
                        gamification.bonusTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{task.title}</p>
                              {task.description ? (
                                <p className="mt-1 text-sm text-slate-500">
                                  {task.description}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                {isStarRewardsEnabled ? (
                                  <StarValue value={task.stars} />
                                ) : task.rewardTitle ? (
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                                    {task.rewardTitle}
                                  </span>
                                ) : null}
                                {task.dueDate
                                  ? ` • до ${formatDateTime(task.dueDate, null)}`
                                  : ""}
                              </div>
                            </div>
                            <Button
                              onClick={() =>
                                void handleToggleBonusTask(task.id, !task.isCompleted)
                              }
                              variant={task.isCompleted ? "outline" : "default"}
                              className={
                                task.isCompleted
                                  ? ""
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }
                            >
                              {task.isCompleted ? "Вернуть в работу" : "Начислить"}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : null}

          {isParentLessonSelectMode ? (
            <div className="fixed inset-0 z-20 bg-slate-950/45" />
          ) : null}

          <section className="relative z-30 rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900">История занятий</p>
                {isParentLessonSelectMode ? (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-slate-900">Выберите занятие</span>
                    <button
                      className="font-medium text-slate-500 transition hover:text-slate-900"
                      onClick={() => setIsParentLessonSelectMode(false)}
                      type="button"
                    >
                      Отмена
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="p-6">
              <LessonProgressTimeline
                createDescription="Добавьте следующее занятие в цепочку этого ученика."
                emptyDescription="Добавьте дату, тему урока и материалы для этого ученика."
                nearestLessonId={nearestLesson?.id}
                lessons={studentLessons}
                onCreateLesson={openCreateDialog}
                onLessonClick={(lesson) =>
                  isParentLessonSelectMode
                    ? openParentMessageDialog(lesson)
                    : handleOpenLessonDetails(lesson)
                }
              />
            </div>
          </section>
        </>
      ) : null}
    </AppLayout>
  );
}
