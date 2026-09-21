import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getAiReviewState, getStudentAiReviewState } from "../api/homework";
import type { AiReviewState } from "../types/domain";
import { AiAssistantMark, ReviewResult, StudentProgressPanel } from "./tutor/AiHomeworkReviewControl";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface AiHomeworkReportViewerProps {
  audience: "student" | "tutor";
  lessonId: number;
}

export function AiHomeworkReportViewer({ audience, lessonId }: AiHomeworkReportViewerProps) {
  const [review, setReview] = useState<AiReviewState | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const loadReview = audience === "student" ? getStudentAiReviewState : getAiReviewState;

    loadReview(lessonId)
      .then((nextReview) => {
        if (active) setReview(nextReview);
      })
      .catch(() => {
        if (active) setReview(null);
      });

    return () => { active = false; };
  }, [audience, lessonId]);

  if (review?.status !== "completed" || !review.result) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-panel-blue p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[image:var(--brand-gradient-diagonal)] text-white">
            <AiAssistantMark />
          </div>
          <div>
            <p className="font-medium text-foreground">Результат проверки ИИ-помощником</p>
            <p className="mt-1 text-sm text-muted-foreground">Разбор решения, ошибки и работа над ними</p>
          </div>
        </div>
        <Button className="shrink-0" onClick={() => setOpen(true)} type="button" variant="outline">
          Посмотреть отчёт
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Результат проверки ИИ-помощником</DialogTitle>
            <DialogDescription>
              Разбор сохранённой проверки домашнего задания и накопительная аналитика ученика.
            </DialogDescription>
          </DialogHeader>
          <ReviewResult result={review.result} />
          {audience === "tutor" ? <StudentProgressPanel lessonId={lessonId} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
