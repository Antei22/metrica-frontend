import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listSubmissions } from "../api/homework";
import { listTutorLessons } from "../api/lessons";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { HomeworkCard } from "../components/tutor/HomeworkCard";
import { HomeworkReviewDialog } from "../components/tutor/HomeworkReviewDialog";
import { HomeworkStack } from "../components/tutor/HomeworkStack";
import { Button } from "../components/ui/button";
import { getErrorMessage } from "../lib/errors";
import { applyReviewToLesson, buildHomeworkStacks } from "../lib/homework";
import type { HomeworkReview, Lesson } from "../types/domain";

const SETTLED_PAGE_SIZE = 10;

export function TutorHomework() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviewsById, setReviewsById] = useState<Map<number, HomeworkReview>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [visibleSettled, setVisibleSettled] = useState(0);

  async function loadHomework() {
    setLoading(true);
    setError(null);

    try {
      const [lessonGroups, reviews] = await Promise.all([
        listTutorLessons(),
        listSubmissions(),
      ]);
      setLessons([...lessonGroups.upcoming, ...lessonGroups.past]);
      setReviewsById(new Map(reviews.map((review) => [review.id, review])));
      setVisibleSettled(0);
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Не удалось загрузить домашние задания."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHomework();
  }, []);

  const { active, settled } = useMemo(() => buildHomeworkStacks(lessons), [lessons]);
  const hiddenSettledCount = settled.length - visibleSettled;

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  );
  const selectedSubmissionId = selectedLesson?.submission?.id;
  const selectedSubmission = selectedSubmissionId
    ? reviewsById.get(selectedSubmissionId) ?? null
    : null;

  function openLesson(lesson: Lesson) {
    setSelectedLessonId(lesson.id);

    const submissionId = lesson.submission?.id;
    if (submissionId && !reviewsById.has(submissionId)) {
      toast.error("Не удалось найти отправку для этого занятия.");
    }
  }

  function handleChecked(review: HomeworkReview) {
    setReviewsById((currentReviews) => {
      const nextReviews = new Map(currentReviews);
      nextReviews.set(review.id, review);
      return nextReviews;
    });
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.submission?.id === review.id ? applyReviewToLesson(lesson, review) : lesson,
      ),
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
          onAction={() => void loadHomework()}
        />
      ) : null}

      {!loading && !error ? (
        active.length === 0 && settled.length === 0 ? (
          <EmptyState
            title="Нет домашних заданий"
            description="Как только вы назначите ДЗ, стопки учеников появятся здесь."
          />
        ) : (
          <>
            {active.length === 0 ? (
              <EmptyState
                title="Актуальных ДЗ нет"
                description="Все назначенные задания проверены. Ранние работы — ниже."
              />
            ) : (
              <section className="space-y-6">
                {active.map((stack) => (
                  <HomeworkStack
                    key={stack.tutorStudentId}
                    onOpen={openLesson}
                    stack={stack}
                  />
                ))}
              </section>
            )}

            {settled.length > 0 ? (
              <section className="mt-10 space-y-4">
                <h3>Ранее</h3>
                {settled.slice(0, visibleSettled).map((lesson) => (
                  <HomeworkCard
                    key={lesson.id}
                    lesson={lesson}
                    onOpen={() => openLesson(lesson)}
                  />
                ))}
                {hiddenSettledCount > 0 ? (
                  <Button
                    className="rounded-full"
                    onClick={() =>
                      setVisibleSettled((current) => current + SETTLED_PAGE_SIZE)
                    }
                    type="button"
                    variant="outline"
                  >
                    Показать ещё ({Math.min(SETTLED_PAGE_SIZE, hiddenSettledCount)} из{" "}
                    {hiddenSettledCount})
                  </Button>
                ) : null}
              </section>
            ) : null}
          </>
        )
      ) : null}

      <HomeworkReviewDialog
        lesson={selectedLesson}
        onChecked={handleChecked}
        onClose={() => setSelectedLessonId(null)}
        submission={selectedSubmission}
      />
    </AppLayout>
  );
}
