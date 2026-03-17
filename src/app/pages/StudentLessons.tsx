import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { resolveApiUrl } from "../api/client";
import { listStudentLessons } from "../api/lessons";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatDate, formatDateTime } from "../lib/format";
import { getErrorMessage } from "../lib/errors";
import type { Lesson, LessonCollection } from "../types/domain";

function sortLessonsByDate(a: Lesson, b: Lesson) {
  const first = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`).getTime();
  const second = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`).getTime();
  return first - second;
}

function getHomeworkBadgeClasses(status: Lesson["homeworkStatus"]) {
  if (status === "checked") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "sent") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getHomeworkLabel(status: Lesson["homeworkStatus"]) {
  if (status === "checked") {
    return "Проверено";
  }

  if (status === "sent") {
    return "Отправлено";
  }

  return "Не отправлено";
}

export function StudentLessons() {
  const navigate = useNavigate();
  const [lessonGroups, setLessonGroups] = useState<LessonCollection>({
    upcoming: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLessons() {
    setLoading(true);
    setError(null);

    try {
      setLessonGroups(await listStudentLessons());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить занятия."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLessons();
  }, []);

  const upcomingLessons = [...lessonGroups.upcoming].sort(sortLessonsByDate);
  const pastLessons = [...lessonGroups.past].sort((first, second) =>
    sortLessonsByDate(second, first),
  );
  const totalLessons = upcomingLessons.length + pastLessons.length;

  function renderLessonCard(lesson: Lesson) {
    return (
      <Card key={lesson.id} className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{lesson.topic || "Без названия"}</CardTitle>
              <p className="mt-2 text-sm text-slate-500">
                {lesson.tutorName || "Репетитор не указан"}
                {lesson.subject ? ` • ${lesson.subject}` : ""}
                {lesson.classInfo ? ` • ${lesson.classInfo}` : ""}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getHomeworkBadgeClasses(lesson.homeworkStatus)}`}
            >
              {getHomeworkLabel(lesson.homeworkStatus)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2 text-sm text-slate-600">
            <p>Дата и время: {formatDateTime(lesson.date, lesson.time)}</p>
            <p>
              Дедлайн ДЗ:{" "}
              {lesson.homeworkDeadline ? formatDate(lesson.homeworkDeadline) : "не задан"}
            </p>
            <p>
              Материалы: {lesson.materials.length}, файлов для ДЗ:{" "}
              {lesson.homeworkTaskFiles.length}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {lesson.meetLink ? (
              <Button asChild variant="outline">
                <a href={lesson.meetLink} rel="noreferrer" target="_blank">
                  Открыть созвон
                </a>
              </Button>
            ) : null}

            {(lesson.materials.length > 0 || lesson.homeworkTaskFiles.length > 0) && (
              <Button asChild variant="outline">
                <a
                  href={resolveApiUrl(
                    lesson.materials[0]?.url || lesson.homeworkTaskFiles[0]?.url || "",
                  )}
                  rel="noreferrer"
                  target="_blank"
                >
                  Материалы
                </a>
              </Button>
            )}

            <Button
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => navigate(`/student/lessons/${lesson.id}`)}
            >
              {lesson.homeworkStatus === "not_sent"
                ? "Открыть и отправить ДЗ"
                : "Открыть занятие"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AppLayout
      title="Мои занятия"
      description="Здесь собраны все запланированные и прошедшие занятия, материалы и статус вашего домашнего задания."
      actions={
        <Button variant="outline" onClick={() => void loadLessons()}>
          Обновить
        </Button>
      }
    >
      {loading ? <LoadingState title="Загружаем занятия..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось загрузить занятия"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadLessons()}
        />
      ) : null}

      {!loading && !error ? (
        <>
          {totalLessons === 0 ? (
            <EmptyState
              title="Пока нет занятий"
              description="Как только репетитор создаст первое занятие, оно появится здесь."
            />
          ) : null}

          {totalLessons > 0 ? (
            <Tabs className="w-full" defaultValue="upcoming">
              <TabsList className="w-full justify-start rounded-full bg-slate-100 p-1 sm:w-auto">
                <TabsTrigger className="rounded-full" value="upcoming">
                  Запланированные ({upcomingLessons.length})
                </TabsTrigger>
                <TabsTrigger className="rounded-full" value="past">
                  Прошедшие ({pastLessons.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-6 space-y-4" value="upcoming">
                {upcomingLessons.length === 0 ? (
                  <EmptyState
                    title="Нет запланированных занятий"
                    description="Сейчас у вас нет будущих встреч в расписании."
                  />
                ) : (
                  upcomingLessons.map(renderLessonCard)
                )}
              </TabsContent>

              <TabsContent className="mt-6 space-y-4" value="past">
                {pastLessons.length === 0 ? (
                  <EmptyState
                    title="Нет прошедших занятий"
                    description="Когда занятия пройдут, история появится здесь."
                  />
                ) : (
                  pastLessons.map(renderLessonCard)
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}
