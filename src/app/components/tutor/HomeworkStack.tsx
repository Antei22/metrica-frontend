import { useState } from "react";
import { formatDate } from "../../lib/format";
import {
  compareLessonsByCreatedDesc,
  type HomeworkStack as HomeworkStackModel,
} from "../../lib/homework";
import type { Lesson } from "../../types/domain";
import { HOMEWORK_CARD_EDGE_HEIGHT, HomeworkCard, HomeworkCardEdge } from "./HomeworkCard";

/** Горизонтальный отступ задней карточки на каждый уровень глубины (px). */
const STACK_INSET_X = 20;
/** Запас высоты выглядывающего края, уходящий под верхнюю карточку и скрытый там (px). */
const STACK_OVERLAP = 24;

interface HomeworkStackProps {
  stack: HomeworkStackModel;
  onOpen: (lesson: Lesson) => void;
}

function orderWithRaised(lessons: Lesson[], raisedId: number | null) {
  const raised = raisedId === null ? undefined : lessons.find((lesson) => lesson.id === raisedId);

  if (!raised) {
    return lessons;
  }

  return [raised, ...lessons.filter((lesson) => lesson.id !== raised.id)];
}

export function HomeworkStack({ stack, onOpen }: HomeworkStackProps) {
  const newestFirst = [...stack.lessons].sort(compareLessonsByCreatedDesc);
  const newestId = newestFirst[0]?.id ?? null;
  const [raised, setRaised] = useState<{
    lessonId: number;
    newestId: number;
  } | null>(null);
  // Если в стопке появилось новое ДЗ, прежний ручной выбор больше не применяется:
  // новая карточка сразу становится верхней.
  const raisedId = raised?.newestId === newestId ? raised.lessonId : null;
  const ordered = orderWithRaised(newestFirst, raisedId);
  const top = ordered[0];
  const back = ordered.slice(1);

  if (!top) {
    return null;
  }

  return (
    <div className="relative" style={{ paddingTop: back.length * HOMEWORK_CARD_EDGE_HEIGHT }}>
      {back.map((lesson, index) => {
        // level 1 — ближайшая к верхней, back.length — самая глубокая.
        const level = index + 1;
        const depthFromTop = back.length - level;

        return (
          <button
            aria-label={`Показать ДЗ от ${formatDate(lesson.date)}`}
            className="absolute cursor-pointer rounded-[20px] text-left transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            key={lesson.id}
            onClick={() => {
              if (newestId !== null) {
                setRaised({ lessonId: lesson.id, newestId });
              }
            }}
            style={{
              top: depthFromTop * HOMEWORK_CARD_EDGE_HEIGHT,
              left: level * STACK_INSET_X,
              right: level * STACK_INSET_X,
              height: HOMEWORK_CARD_EDGE_HEIGHT + STACK_OVERLAP,
              zIndex: depthFromTop + 1,
            }}
            type="button"
          >
            <HomeworkCardEdge lesson={lesson} />
          </button>
        );
      })}

      <div className="relative" style={{ zIndex: back.length + 1 }}>
        <HomeworkCard lesson={top} onOpen={() => onOpen(top)} />
      </div>
    </div>
  );
}
