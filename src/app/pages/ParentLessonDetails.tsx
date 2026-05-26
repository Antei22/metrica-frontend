import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getParentLesson } from "../api/parent";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { FileLinkButton } from "../components/FileLinkButton";
import { StarValue } from "../components/StarValue";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { getErrorMessage } from "../lib/errors";
import { formatDateTime, formatLessonTitle } from "../lib/format";
import type { Lesson } from "../types/domain";

export function ParentLessonDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLesson() {
    if (!id) {
      setError("Не найден идентификатор занятия.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setLesson(await getParentLesson(id));
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Не удалось загрузить карточку занятия."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLesson();
  }, [id]);

  const pageTitle = lesson ? formatLessonTitle(lesson.subject, lesson.topic, "Карточка занятия") : "Карточка занятия";
  const pageDescription = lesson
    ? `${lesson.studentName || "Ученик"} • ${formatDateTime(lesson.date, lesson.time)}`
    : "Оценка и комментарий репетитора.";
  const tutorComment = lesson?.parentComment || lesson?.submission?.comment || "";

  return (
    <AppLayout
      title={pageTitle}
      description={pageDescription}
      actions={
        <Button variant="outline" onClick={() => navigate("/parent/dashboard")}>
          <ArrowLeft className="size-4" />
          Назад
        </Button>
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
          description="Возможно, доступ к нему был закрыт."
          actionLabel="Вернуться в кабинет"
          onAction={() => navigate("/parent/dashboard")}
        />
      ) : null}

      {!loading && !error && lesson ? (
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Оценка за занятие</p>
                <div className="mt-2">
                  <StarValue value={lesson.homeworkGrade} />
                </div>
              </div>
              <p className="text-sm text-slate-500">
                {lesson.tutorName ? `Репетитор: ${lesson.tutorName}` : null}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Комментарий репетитора</p>
              <p className="mt-2 whitespace-pre-wrap">
                {tutorComment || "Комментарий пока не добавлен."}
              </p>
            </div>

            {lesson.parentMessageFiles.length ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-900">Файлы от репетитора</p>
                <div className="flex flex-col items-start gap-2">
                  {lesson.parentMessageFiles.map((file) => (
                    <FileLinkButton file={file} fallback="Открыть файл" key={file.id} />
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </AppLayout>
  );
}
