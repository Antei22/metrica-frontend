import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listStudentLessons } from "../api/lessons";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { LessonProgressTimeline } from "../components/LessonProgressTimeline";
import { getErrorMessage } from "../lib/errors";
import type { Lesson, LessonCollection } from "../types/domain";

function sortLessonsByDate(a: Lesson, b: Lesson) {
  const first = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`).getTime();
  const second = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`).getTime();
  return first - second;
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
      const lessons = await listStudentLessons();
      setLessonGroups(lessons);
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
  const allLessons = [...lessonGroups.past, ...lessonGroups.upcoming].sort(sortLessonsByDate);
  const totalLessons = allLessons.length;

  return (
    <AppLayout
      title="История занятий"
      description="Запланированные и прошедшие занятия, материалы, решения ДЗ и оценки."
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
            <section className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <p className="text-lg font-semibold text-slate-900">История занятий</p>
              </div>
              <div className="p-6">
                <LessonProgressTimeline
                  lessons={allLessons}
                  nearestLessonId={upcomingLessons[0]?.id}
                  onLessonClick={(lesson) => navigate(`/student/lessons/${lesson.id}`)}
                />
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}
