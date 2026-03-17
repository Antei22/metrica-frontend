import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { resolveApiUrl } from "../api/client";
import { getStudentLesson, submitStudentHomework } from "../api/lessons";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { LessonFilesCard } from "../components/LessonFilesCard";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { formatDate, formatDateTime } from "../lib/format";
import { getErrorMessage } from "../lib/errors";
import type { Lesson } from "../types/domain";

export function LessonDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      setLesson(await getStudentLesson(id));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить карточку занятия."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLesson();
  }, [id]);

  async function handleSubmitHomework() {
    if (!lesson || !selectedFile) {
      toast.error("Сначала выберите файл для отправки.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitStudentHomework(lesson.id, selectedFile);
      toast.success("Домашнее задание отправлено");
      setSelectedFile(null);
      await loadLesson();
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Не удалось отправить домашнее задание."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const pageTitle = lesson?.topic || "Карточка занятия";
  const pageDescription = lesson
    ? `${formatDateTime(lesson.date, lesson.time)}${lesson.tutorName ? ` • ${lesson.tutorName}` : ""}`
    : "Полная информация о занятии, материалах и домашнем задании.";

  return (
    <AppLayout
      title={pageTitle}
      description={pageDescription}
      actions={
        <>
          {lesson?.meetLink ? (
            <Button asChild variant="outline">
              <a href={lesson.meetLink} rel="noreferrer" target="_blank">
                Подключиться к созвону
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
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Основная информация</p>
                <p>Дата и время: {formatDateTime(lesson.date, lesson.time)}</p>
                <p>
                  Дедлайн ДЗ:{" "}
                  {lesson.homeworkDeadline ? formatDate(lesson.homeworkDeadline) : "не задан"}
                </p>
                <p>
                  Статус ДЗ:{" "}
                  {lesson.homeworkStatus === "checked"
                    ? "Проверено"
                    : lesson.homeworkStatus === "sent"
                      ? "Отправлено"
                      : "Не отправлено"}
                </p>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Контекст занятия</p>
                <p>Репетитор: {lesson.tutorName || "Не указан"}</p>
                <p>Предмет: {lesson.subject || "Не указан"}</p>
                <p>Класс/группа: {lesson.classInfo || "Не указано"}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <LessonFilesCard files={lesson.materials} title="Материалы занятия" />
            <LessonFilesCard files={lesson.homeworkTaskFiles} title="Файлы для домашнего задания" />
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
                  {lesson.submission?.fileUrl ? (
                    <Button asChild className="mt-4" variant="outline">
                      <a
                        href={resolveApiUrl(lesson.submission.fileUrl)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Открыть отправленный файл
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {lesson.homeworkStatus === "sent" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-medium text-amber-800">Работа отправлена на проверку</p>
                  <p className="mt-2 text-sm text-amber-700">
                    Ожидайте комментарий от преподавателя.
                  </p>
                  {lesson.submission?.fileUrl ? (
                    <Button asChild className="mt-4" variant="outline">
                      <a
                        href={resolveApiUrl(lesson.submission.fileUrl)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Открыть отправленный файл
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {lesson.homeworkStatus === "not_sent" ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-600">
                    Прикрепите PDF или JPEG с выполненным домашним заданием.
                  </p>
                  <Input
                    accept=".pdf,.jpg,.jpeg"
                    type="file"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] || null)
                    }
                  />
                  {selectedFile ? (
                    <p className="text-sm text-slate-600">Выбран файл: {selectedFile.name}</p>
                  ) : null}
                  <Button
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    disabled={!selectedFile || isSubmitting}
                    onClick={handleSubmitHomework}
                  >
                    {isSubmitting ? "Отправляем..." : "Отправить ДЗ"}
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
