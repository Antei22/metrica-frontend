import { AlertCircle, CheckCircle2, Clock, FileSearch2 } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { formatDate } from "../../lib/format";
import { getHomeworkCardState, type HomeworkCardState } from "../../lib/homework";
import type { Lesson } from "../../types/domain";
import { StarValue } from "../StarValue";
import { Card } from "../ui/card";
import { cn } from "../ui/utils";

/** Высота выглядывающего края задней карточки в стопке (px). */
export const HOMEWORK_CARD_EDGE_HEIGHT = 28;

function getHomeworkCardBadge(state: HomeworkCardState) {
  if (state === "checked") {
    return { label: "Проверено", className: "border-success/20 bg-success-soft text-ink", Icon: CheckCircle2 };
  }

  if (state === "sent") {
    return { label: "Ожидает проверки", className: "border-blue/20 bg-panel-blue text-ink", Icon: FileSearch2 };
  }

  if (state === "overdue") {
    return { label: "Дедлайн прошёл", className: "border-danger/20 bg-danger-soft text-ink", Icon: AlertCircle };
  }

  return { label: "Не отправлено", className: "border-border bg-panel text-muted-foreground", Icon: Clock };
}

/**
 * Обводка + компактный glow по состоянию (DESIGN_SYSTEM §4, см. typography.css hw-glow).
 * className передаётся во все вложенные слои — нужно для HomeworkCardEdge (h-full),
 * иначе внутренний белый слой не растягивается на всю высоту выглядывающего края.
 */
function HomeworkCardFrameBox({
  state,
  className,
  children,
}: {
  state: HomeworkCardState;
  className?: string;
  children: ReactNode;
}) {
  if (state === "sent" || state === "checked") {
    return (
      <div className={cn("hw-glow hw-glow-brand rounded-[20px]", className)}>
        <div className={cn("brand-gradient-border homework-gradient-border", className)}>
          <div className={cn("relative rounded-2xl bg-white text-foreground", className)}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (state === "overdue") {
    return (
      <div className={cn("hw-glow hw-glow-danger rounded-surface", className)}>
        <Card className={cn("gap-0 border-4 border-danger", className)}>{children}</Card>
      </div>
    );
  }

  return <Card className={cn("gap-0 border-border bg-white", className)}>{children}</Card>;
}

export function HomeworkBadge({ state }: { state: HomeworkCardState }) {
  const badge = getHomeworkCardBadge(state);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        badge.className,
      )}
    >
      <badge.Icon className="size-3.5" />
      {badge.label}
    </span>
  );
}

function getLessonSubtitle(lesson: Lesson) {
  return [lesson.subject, lesson.topic].filter(Boolean).join(" · ") || "Тема занятия не указана";
}

/** Выглядывающий край задней карточки: та же рамка по состоянию, одна строка текста. */
export function HomeworkCardEdge({ lesson }: { lesson: Lesson }) {
  const state = getHomeworkCardState(lesson);
  const badge = getHomeworkCardBadge(state);

  return (
    <HomeworkCardFrameBox className="h-full" state={state}>
      <span
        className="flex items-center gap-1.5 truncate px-4 text-xs text-muted-foreground"
        style={{ height: HOMEWORK_CARD_EDGE_HEIGHT - 4 }}
      >
        <badge.Icon className="size-3.5 shrink-0" />
        <span className="truncate">
          {formatDate(lesson.date)} · {lesson.topic || lesson.subject || "Без темы"} · {badge.label}
        </span>
      </span>
    </HomeworkCardFrameBox>
  );
}

interface HomeworkCardProps {
  lesson: Lesson;
  onOpen: () => void;
  className?: string;
}

/**
 * Карточка-превью ДЗ: только сводка (ученик, предмет/тема, дедлайн, статус, дата
 * занятия) — по аналогии с «Ближайшее занятие» на главной. Файлы, решение и элементы
 * проверки — в HomeworkReviewDialog по клику. Кликабельна во всех состояниях.
 */
export function HomeworkCard({ lesson, onOpen, className }: HomeworkCardProps) {
  const state = getHomeworkCardState(lesson);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Только собственный keydown карточки — защита на случай вложенных интерактивов.
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onOpen();
  }

  return (
    <div
      className={cn("cursor-pointer transition-transform hover:-translate-y-0.5", className)}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <HomeworkCardFrameBox state={state}>
        <div className="space-y-3 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="leading-none">{lesson.studentName || "Ученик"}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{getLessonSubtitle(lesson)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <HomeworkBadge state={state} />
              {state === "checked" ? <StarValue value={lesson.homeworkGrade} /> : null}
            </div>
          </div>

          <div className="inline-flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            <span>Занятие: {formatDate(lesson.date)}</span>
            <span>
              Дедлайн: {lesson.homeworkDeadline ? formatDate(lesson.homeworkDeadline) : "не задан"}
            </span>
          </div>
        </div>
      </HomeworkCardFrameBox>
    </div>
  );
}
