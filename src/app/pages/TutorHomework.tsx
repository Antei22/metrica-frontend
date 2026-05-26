import { CheckCircle2, FileUp, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resolveApiUrl } from "../api/client";
import { uploadTutorFile } from "../api/files";
import { checkSubmission, listSubmissions } from "../api/homework";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { FileLinkButton } from "../components/FileLinkButton";
import { StarRatingInput } from "../components/StarRatingInput";
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
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { getErrorMessage } from "../lib/errors";
import { formatDate, formatDateClock } from "../lib/format";
import { HOMEWORK_FILE_ACCEPT, isSubmittedAfterHomeworkDeadline } from "../lib/homework";
import type { HomeworkReview, LessonMaterial } from "../types/domain";

function getPendingFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(file: File) {
  return `${(file.size / 1024).toFixed(1)} KB`;
}

function SubmissionFilesBlock({
  homeworkDeadline,
  homeworkDeadlineMissed,
  files,
  submittedAt,
  title,
}: {
  homeworkDeadline?: string | null;
  homeworkDeadlineMissed?: boolean;
  files: LessonMaterial[];
  submittedAt?: string | null;
  title: string;
}) {
  if (files.length === 0) {
    return null;
  }

  const submittedTime = formatDateClock(submittedAt);
  const submittedLate = isSubmittedAfterHomeworkDeadline(
    homeworkDeadline,
    submittedAt,
    homeworkDeadlineMissed,
  );

  return (
    <div className="space-y-2">
      {homeworkDeadline !== undefined ? (
        <p className="text-sm text-slate-500">
          Дедлайн ДЗ: {homeworkDeadline ? formatDate(homeworkDeadline) : "не задан"}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
        <p className="font-medium text-slate-900">{title}:</p>
        {submittedTime ? (
          <p className={submittedLate ? "font-medium text-rose-600" : undefined}>
            Отправлено в {submittedTime}
          </p>
        ) : null}
      </div>
      <div className="flex max-w-full flex-col items-start gap-2">
        {files.map((file) => (
          <FileLinkButton file={file} fallback="Открыть файл" key={file.id} />
        ))}
      </div>
    </div>
  );
}

export function TutorHomework() {
  const [pendingSubmissions, setPendingSubmissions] = useState<HomeworkReview[]>([]);
  const [checkedSubmissions, setCheckedSubmissions] = useState<HomeworkReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkReview | null>(
    null,
  );
  const [comment, setComment] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [retainedReviewFiles, setRetainedReviewFiles] = useState<LessonMaterial[]>([]);
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadSubmissions() {
    setLoading(true);
    setError(null);

    try {
      const [pending, checked] = await Promise.all([
        listSubmissions("submitted"),
        listSubmissions("checked"),
      ]);
      setPendingSubmissions(pending);
      setCheckedSubmissions(checked);
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Не удалось загрузить домашние задания."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSubmissions();
  }, []);

  function openReviewDialog(submission: HomeworkReview) {
    setSelectedSubmission(submission);
    setComment(submission.comment || "");
    setGrade(submission.grade);
    setRetainedReviewFiles(submission.checkedFiles);
    setReviewFiles([]);
  }

  function closeReviewDialog() {
    setSelectedSubmission(null);
    setComment("");
    setGrade(null);
    setRetainedReviewFiles([]);
    setReviewFiles([]);
  }

  function handleAddReviewFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || []);

    if (nextFiles.length > 0) {
      setReviewFiles((currentFiles) => [...currentFiles, ...nextFiles]);
    }

    event.target.value = "";
  }

  function removeRetainedReviewFile(fileId: string) {
    setRetainedReviewFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
  }

  function removeReviewFile(index: number) {
    setReviewFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  async function handleCheckSubmission() {
    if (!selectedSubmission) {
      return;
    }

    if (!grade) {
      toast.error("Выберите оценку за ДЗ.");
      return;
    }

    setIsSubmitting(true);

    try {
      const checkedFileRefs = await Promise.all(
        reviewFiles.map((file) => uploadTutorFile(file)),
      );
      const retainedReviewFileIds = retainedReviewFiles
        .map((file) => file.fileId)
        .filter((fileId): fileId is number => typeof fileId === "number");
      const reviewedSubmission = await checkSubmission(selectedSubmission.id, {
        comment,
        grade,
        checkedFileIds: [
          ...retainedReviewFileIds,
          ...checkedFileRefs.map((file) => file.fileId),
        ],
      });

      setPendingSubmissions((currentItems) =>
        currentItems.filter((item) => item.id !== reviewedSubmission.id),
      );
      setCheckedSubmissions((currentItems) => [
        reviewedSubmission,
        ...currentItems.filter((item) => item.id !== reviewedSubmission.id),
      ]);
      closeReviewDialog();
      toast.success("Домашнее задание проверено");
    } catch (submitError) {
      toast.error(
        getErrorMessage(submitError, "Не удалось сохранить проверку."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderSubmissionCard(submission: HomeworkReview, checked: boolean) {
    return (
      <Card
        key={submission.id}
        className={`rounded-3xl shadow-sm ${
          checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
        }`}
      >
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{submission.student}</CardTitle>
              <p className="mt-2 text-sm text-slate-500">
                {submission.lessonTopic || "Тема занятия не указана"}
              </p>
            </div>
            {checked ? (
              <StarValue value={submission.grade} />
            ) : (
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                На проверке
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-2 text-sm text-slate-600">
            <p>Дата занятия: {formatDate(submission.lessonDate)}</p>
            {submission.files.length > 0 ? (
              <SubmissionFilesBlock
                files={submission.files}
                homeworkDeadline={submission.homeworkDeadline}
                homeworkDeadlineMissed={submission.homeworkDeadlineMissed}
                submittedAt={submission.submittedAt}
                title="Решение ученика"
              />
            ) : (
              <p>Файл решения не прикреплен.</p>
            )}
            {submission.checkedFiles.length > 0 ? (
              <SubmissionFilesBlock
                files={submission.checkedFiles}
                title="Проверенные файлы репетитором"
              />
            ) : null}
            {submission.studentComment ? (
              <p className="rounded-2xl bg-white/80 p-3 text-slate-600">
                {submission.studentComment}
              </p>
            ) : null}
            {submission.comment ? (
              <p className="rounded-2xl bg-white/80 p-3 text-slate-600">
                {submission.comment}
              </p>
            ) : null}
          </div>

          <Button
            className={
              checked
                ? "rounded-full"
                : "rounded-full bg-slate-900 text-white hover:bg-slate-800"
            }
            onClick={() => openReviewDialog(submission)}
            variant={checked ? "outline" : "default"}
          >
            {checked ? (
              <>
                <CheckCircle2 className="size-4" />
                Изменить проверку
              </>
            ) : (
              "Проверить"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <AppLayout
      title="Проверка домашних заданий"
      description="Работы учеников, комментарии, проверенные файлы и оценки за ДЗ."
    >
      {loading ? <LoadingState title="Загружаем домашние задания..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось загрузить работы"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadSubmissions()}
        />
      ) : null}

      {!loading && !error ? (
        pendingSubmissions.length === 0 && checkedSubmissions.length === 0 ? (
          <EmptyState
            title="Нет работ на проверке"
            description="Как только ученики отправят решения, они появятся в этом разделе."
          />
        ) : (
          <Tabs className="w-full" defaultValue="pending">
            <TabsList className="w-full justify-start rounded-full bg-slate-100 p-1 sm:w-auto">
              <TabsTrigger className="rounded-full" value="pending">
                На проверке ({pendingSubmissions.length})
              </TabsTrigger>
              <TabsTrigger className="rounded-full" value="checked">
                Проверено ({checkedSubmissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent className="mt-6 space-y-4" value="pending">
              {pendingSubmissions.length === 0 ? (
                <EmptyState
                  title="Все работы проверены"
                  description="Сейчас нет новых отправок, ожидающих комментария."
                />
              ) : (
                pendingSubmissions.map((submission) =>
                  renderSubmissionCard(submission, false),
                )
              )}
            </TabsContent>

            <TabsContent className="mt-6 space-y-4" value="checked">
              {checkedSubmissions.length === 0 ? (
                <EmptyState
                  title="Проверенных работ пока нет"
                  description="После проверки работы будут сохраняться здесь."
                />
              ) : (
                checkedSubmissions.map((submission) =>
                  renderSubmissionCard(submission, true),
                )
              )}
            </TabsContent>
          </Tabs>
        )
      ) : null}

      <Dialog
        open={Boolean(selectedSubmission)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeReviewDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Проверка домашнего задания</DialogTitle>
          </DialogHeader>

          {selectedSubmission ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {selectedSubmission.student}
                </p>
                <p className="mt-1">
                  {selectedSubmission.lessonTopic || "Тема занятия не указана"}
                </p>
                <p className="mt-1">
                  Дата занятия: {formatDate(selectedSubmission.lessonDate)}
                </p>
                {selectedSubmission.files.length > 0 ? (
                  <div className="mt-3">
                    <SubmissionFilesBlock
                      files={selectedSubmission.files}
                      homeworkDeadline={selectedSubmission.homeworkDeadline}
                      homeworkDeadlineMissed={selectedSubmission.homeworkDeadlineMissed}
                      submittedAt={selectedSubmission.submittedAt}
                      title="Решение ученика"
                    />
                  </div>
                ) : null}
                {selectedSubmission.studentComment ? (
                  <p className="mt-3 rounded-2xl bg-white p-3 text-sm text-slate-600">
                    {selectedSubmission.studentComment}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission-grade">Оценка за ДЗ</Label>
                <StarRatingInput id="submission-grade" value={grade} onChange={setGrade} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission-review-file">
                  Проверенный файл с правками
                </Label>
                <Input
                  accept={HOMEWORK_FILE_ACCEPT}
                  id="submission-review-file"
                  multiple
                  type="file"
                  onChange={handleAddReviewFiles}
                />
                <p className="text-xs text-slate-500">
                  Можно добавлять файлы в несколько подходов. Лишние файлы можно убрать перед сохранением проверки.
                </p>

                {retainedReviewFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                      Уже прикрепленные проверенные файлы
                    </p>
                    {retainedReviewFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">Будет сохранен в проверке</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {file.url ? (
                            <Button asChild size="sm" type="button" variant="outline">
                              <a href={resolveApiUrl(file.url)} rel="noreferrer" target="_blank">
                                Открыть
                              </a>
                            </Button>
                          ) : null}
                          <Button
                            onClick={() => removeRetainedReviewFile(file.id)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {reviewFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                      Новые проверенные файлы
                    </p>
                    {reviewFiles.map((file, index) => (
                      <div
                        key={getPendingFileKey(file)}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">{formatFileSize(file)}</p>
                        </div>
                        <Button
                          onClick={() => removeReviewFile(index)}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission-comment">Комментарий ученику</Label>
                <Textarea
                  id="submission-comment"
                  placeholder="Напишите, что выполнено хорошо и что стоит исправить."
                  rows={5}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeReviewDialog}>
                  Отмена
                </Button>
                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800"
                  disabled={isSubmitting}
                  onClick={handleCheckSubmission}
                >
                  <FileUp className="size-4" />
                  {isSubmitting ? "Сохраняем..." : "Сохранить проверку"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
