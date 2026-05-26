import { X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getStudentLesson, submitStudentHomework } from "../api/lessons";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { FileLinkButton } from "../components/FileLinkButton";
import { LessonFilesCard } from "../components/LessonFilesCard";
import { StarValue } from "../components/StarValue";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { formatDate, formatDateClock, formatDateTime, formatLessonTitle } from "../lib/format";
import { getErrorMessage } from "../lib/errors";
import {
  HOMEWORK_FILE_ACCEPT,
  isSubmittedAfterHomeworkDeadline,
} from "../lib/homework";
import type { Lesson, LessonMaterial } from "../types/domain";

function getPendingFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(file: File) {
  return `${(file.size / 1024).toFixed(1)} KB`;
}

export function LessonDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retainedSubmittedFiles, setRetainedSubmittedFiles] = useState<LessonMaterial[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [homeworkComment, setHomeworkComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadLesson() {
    if (!id) {
      setError("Не найден идентификатор занятия.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedLesson = await getStudentLesson(id);
      setLesson(loadedLesson);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить карточку занятия."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLesson();
  }, [id]);

  useEffect(() => {
    setRetainedSubmittedFiles(lesson?.submission?.files || []);
    setSelectedFiles([]);
    setHomeworkComment(lesson?.submission?.studentComment || "");
  }, [lesson]);

  function handleAddSelectedFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || []);

    if (nextFiles.length > 0) {
      setSelectedFiles((currentFiles) => [...currentFiles, ...nextFiles]);
    }

    event.target.value = "";
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  function removeRetainedSubmittedFile(fileId: string) {
    setRetainedSubmittedFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
  }

  async function handleSubmitHomework() {
    const retainedFileIds = retainedSubmittedFiles
      .map((file) => file.fileId)
      .filter((fileId): fileId is number => typeof fileId === "number");

    if (!lesson || selectedFiles.length + retainedFileIds.length === 0) {
      toast.error("Сначала выберите файлы для отправки.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitStudentHomework(lesson.id, selectedFiles, retainedFileIds, homeworkComment);
      toast.success("Домашнее задание отправлено");
      setSelectedFiles([]);
      await loadLesson();
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Не удалось отправить домашнее задание."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const pageTitle = lesson ? formatLessonTitle(lesson.subject, lesson.topic, "Карточка занятия") : "Карточка занятия";
  const pageDescription = lesson
    ? (
      <div className="flex max-w-3xl flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-900">
          {formatDateTime(lesson.date, lesson.time)}
        </span>
        {lesson.tutorName ? <span>{lesson.tutorName}</span> : null}
        {lesson.subject ? (
          <span className="rounded-full bg-slate-100 px-3 py-1">{lesson.subject}</span>
        ) : null}
        {lesson.classInfo ? (
          <span className="rounded-full bg-slate-100 px-3 py-1">{lesson.classInfo}</span>
        ) : null}
      </div>
    )
    : "Полная информация о занятии, материалах и домашнем задании.";
  const submittedFiles = lesson?.submission?.files || [];
  const checkedFiles =
    lesson?.submission?.checkedFiles || (lesson?.checkedFile ? [lesson.checkedFile] : []);
  const homeworkSubmittedLate = isSubmittedAfterHomeworkDeadline(
    lesson?.homeworkDeadline,
    lesson?.submission?.submittedAt,
    lesson?.homeworkDeadlineMissed,
  );

  return (
    <AppLayout
      title={pageTitle}
      description={pageDescription}
      actions={
        <>
          {lesson?.meetLink ? (
            <Button asChild variant="outline">
              <a href={lesson.meetLink} rel="noreferrer" target="_blank">
                Подключиться к звонку
              </a>
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => navigate("/student/lessons")}>
            Назад к занятиям
          </Button>
        </>
      }
    >
      {loading ? <LoadingState title="Загружаем занятие..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось открыть занятие"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadLesson()}
        />
      ) : null}

      {!loading && !error && !lesson ? (
        <EmptyState
          title="Занятие не найдено"
          description="Возможно, ссылка устарела или занятие было удалено."
          actionLabel="Вернуться к списку"
          onAction={() => navigate("/student/lessons")}
        />
      ) : null}

      {!loading && !error && lesson ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <LessonFilesCard files={lesson.materials} title="Материалы занятия" />
            <LessonFilesCard files={lesson.homeworkTaskFiles} title="Материалы домашнего задания" />
          </div>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Домашнее задание</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lesson.homeworkStatus === "checked" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-medium text-emerald-800">Работа проверена</p>
                  <p className="mt-2 text-sm text-emerald-700">
                    {lesson.submission?.comment ||
                      "Комментарий преподавателя пока не добавлен."}
                  </p>
                  {submittedFiles.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-emerald-700">
                        Дедлайн ДЗ:{" "}
                        {lesson.homeworkDeadline ? formatDate(lesson.homeworkDeadline) : "не задан"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-emerald-700">
                        <p className="font-semibold text-emerald-800">Решение ученика:</p>
                        {lesson.submission?.submittedAt ? (
                          <p
                            className={
                              homeworkSubmittedLate ? "font-medium text-rose-600" : undefined
                            }
                          >
                            Отправлено в {formatDateClock(lesson.submission.submittedAt)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-start gap-2">
                        {submittedFiles.map((file) => (
                          <FileLinkButton file={file} fallback="Открыть мое решение" key={file.id} />
                        ))}
                      </div>
                      {lesson.submission?.studentComment ? (
                        <p className="rounded-2xl bg-white/80 p-3 text-sm text-emerald-700">
                          {lesson.submission.studentComment}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-emerald-800">
                      Проверенные файлы репетитором:
                    </p>
                    <div className="flex flex-col items-start gap-2">
                      {checkedFiles.map((file) => (
                        <FileLinkButton file={file} fallback="Открыть проверенный файл" key={file.id} />
                      ))}
                      <StarValue value={lesson.homeworkGrade} />
                    </div>
                  </div>
                </div>
              ) : null}

              {lesson.homeworkStatus === "sent" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-medium text-amber-800">Работа отправлена на проверку</p>
                  <p className="mt-2 text-sm text-amber-700">
                    Ожидайте комментарий от преподавателя или измените файлы до проверки.
                  </p>
                </div>
              ) : null}

              {lesson.homeworkStatus !== "checked" ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-600">
                    Прикрепите PDF, изображение или документ с выполненным домашним заданием.
                  </p>
                  <Input
                    accept={HOMEWORK_FILE_ACCEPT}
                    multiple
                    type="file"
                    onChange={handleAddSelectedFiles}
                  />
                  <p className="text-xs text-slate-500">
                    Можно добавлять файлы в несколько подходов. Лишние файлы можно убрать перед отправкой.
                  </p>

                  {retainedSubmittedFiles.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">
                        Дедлайн ДЗ:{" "}
                        {lesson.homeworkDeadline ? formatDate(lesson.homeworkDeadline) : "не задан"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                        <p className="font-medium text-slate-900">Решение ученика:</p>
                        {lesson.submission?.submittedAt ? (
                          <p
                            className={
                              homeworkSubmittedLate ? "font-medium text-rose-600" : undefined
                            }
                          >
                            Отправлено в {formatDateClock(lesson.submission.submittedAt)}
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
                      {lesson.submission?.studentComment ? (
                        <p className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                          {lesson.submission.studentComment}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {selectedFiles.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                        Новые файлы для отправки
                      </p>
                      {selectedFiles.map((file, index) => (
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
                            onClick={() => removeSelectedFile(index)}
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
                      htmlFor="lesson-homework-comment"
                    >
                      Комментарий к ДЗ
                    </label>
                    <Textarea
                      id="lesson-homework-comment"
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
                      selectedFiles.length + retainedSubmittedFiles.length === 0 ||
                      isSubmitting
                    }
                    onClick={handleSubmitHomework}
                  >
                    {isSubmitting
                      ? "Сохраняем..."
                      : lesson.homeworkStatus === "sent"
                        ? "Обновить ДЗ"
                        : "Отправить ДЗ"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </AppLayout>
  );
}
