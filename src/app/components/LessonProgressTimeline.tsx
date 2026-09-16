import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { formatDateTime, formatLessonTitle } from "../lib/format";
import { isHomeworkDeadlineMissed } from "../lib/homework";
import type { Lesson } from "../types/domain";
import { StarValue } from "./StarValue";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface LessonProgressTimelineProps {
  lessons: Lesson[];
  nearestLessonId?: number | null;
  onLessonClick?: (lesson: Lesson) => void;
  onCreateLesson?: () => void;
  createDescription?: string;
  createTitle?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  renderLessonMeta?: (lesson: Lesson) => ReactNode;
  showDeadlineMissed?: boolean;
  showHomeworkGrade?: boolean | ((lesson: Lesson) => boolean);
}

function getTimelineNodeClass(isNearest: boolean) {
  return isNearest
    ? "size-6 border-primary bg-primary shadow-[0_0_0_6px_rgba(7,26,49,0.08)]"
    : "size-4 border-quiet/40 bg-white";
}

function getHomeworkSummary(lesson: Lesson) {
  if (lesson.homeworkStatus === "checked") {
    return "проверено";
  }

  if (lesson.homeworkStatus === "sent") {
    return "на проверке";
  }

  return "нет решения";
}

export function LessonProgressTimeline({
  lessons,
  nearestLessonId,
  onLessonClick,
  onCreateLesson,
  createDescription = "Добавьте следующее занятие в цепочку ученика.",
  createTitle = "Создать занятие",
  emptyDescription = "Когда занятия появятся, они выстроятся здесь по датам.",
  emptyTitle = "Пока нет занятий",
  renderLessonMeta,
  showDeadlineMissed = true,
  showHomeworkGrade = true,
}: LessonProgressTimelineProps) {
  function shouldShowHomeworkGrade(lesson: Lesson) {
    return typeof showHomeworkGrade === "function"
      ? showHomeworkGrade(lesson)
      : showHomeworkGrade;
  }

  function renderCreateAction(description: string) {
    if (!onCreateLesson) {
      return null;
    }

    return (
      <div className="flex gap-4">
        <div className="relative flex w-10 shrink-0 justify-center">
          <Button
            aria-label={createTitle}
            className="relative z-10 mt-1 size-8 rounded-full border-dashed"
            onClick={onCreateLesson}
            size="icon"
            type="button"
            variant="outline"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <button
          className="flex-1 rounded-2xl border border-dashed border-quiet/40 bg-white px-4 py-4 text-left transition hover:border-primary hover:shadow-soft"
          onClick={onCreateLesson}
          type="button"
        >
          <p className="text-sm font-semibold text-foreground">{createTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </button>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div>
        {renderCreateAction(emptyDescription) || (
          <div className="rounded-2xl border border-dashed border-quiet/40 px-4 py-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{emptyTitle}</p>
            <p className="mt-1">{emptyDescription}</p>
          </div>
        )}
      </div>
    );
  }

  const displayedLessons = [...lessons].reverse();

  return (
    <div className="relative">
      <span className="absolute top-4 bottom-0 left-5 w-px -translate-x-1/2 bg-panel" />

      {onCreateLesson ? <div className="pb-4">{renderCreateAction(createDescription)}</div> : null}

      {displayedLessons.map((lesson) => {
        const isNearest = nearestLessonId === lesson.id;
        const isDeadlineMissed = isHomeworkDeadlineMissed(lesson);
        const lessonMeta = renderLessonMeta ? (
          renderLessonMeta(lesson)
        ) : (
          <>
            Материалов: {lesson.materials.length} • Материалов ДЗ:{" "}
            {lesson.homeworkTaskFiles.length} • Домашнее задание:{" "}
            {getHomeworkSummary(lesson)}
          </>
        );
        const cardClassName = cn(
          "flex-1 rounded-2xl border bg-white px-4 py-4 text-left transition",
          onLessonClick ? "hover:-translate-y-0.5 hover:shadow-soft" : "",
          isNearest
            ? "border-primary shadow-soft"
            : "border-border hover:border-quiet/60",
        );
        const content = (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(lesson.date, lesson.time)}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {formatLessonTitle(lesson.subject, lesson.topic, "Тема не указана")}
                </p>
              </div>
              {isNearest ? (
                <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                  Ближайшее занятие
                </span>
              ) : null}
              {shouldShowHomeworkGrade(lesson) && lesson.homeworkStatus === "checked" ? (
                <StarValue value={lesson.homeworkGrade} />
              ) : null}
            </div>

            {lessonMeta ? (
              <p className="mt-3 text-sm text-muted-foreground">{lessonMeta}</p>
            ) : null}
            {showDeadlineMissed && isDeadlineMissed ? (
              <p className="mt-2 text-sm font-semibold text-danger">
                Дедлайн ДЗ был просрочен
              </p>
            ) : null}
          </>
        );

        return (
          <div key={lesson.id} className="flex gap-4 pb-4 last:pb-0">
            <div className="relative flex w-10 shrink-0 justify-center">
              <span className="relative z-10 mt-1 flex size-6 items-center justify-center">
                <span
                  className={cn("rounded-full border-2", getTimelineNodeClass(isNearest))}
                />
              </span>
            </div>

            {onLessonClick ? (
              <button
                className={cardClassName}
                onClick={() => onLessonClick(lesson)}
                type="button"
              >
                {content}
              </button>
            ) : (
              <div className={cardClassName}>{content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
