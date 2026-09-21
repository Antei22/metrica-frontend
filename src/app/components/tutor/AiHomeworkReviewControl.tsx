import { AlertCircle, CheckCircle2, History, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAiReviewHistory,
  getAiReviewProgress,
  getAiReviewState,
  startAiReview,
} from "../../api/homework";
import { getErrorMessage } from "../../lib/errors";
import type {
  AiHomeworkHistoryItem,
  AiHomeworkResult,
  AiProgressReport,
  AiReviewState,
} from "../../types/domain";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";


export function AiAssistantMark() {
  return (
    <svg aria-hidden="true" className="size-[22px] shrink-0" fill="none" viewBox="0 0 24 24">
      <rect height="18" rx="5.5" stroke="currentColor" strokeWidth="2.4" width="18" x="3" y="3" />
      <rect fill="currentColor" height="6.5" rx="2.2" width="6.5" x="8.75" y="8.75" />
    </svg>
  );
}

function severityLabel(severity: string) {
  if (severity === "conceptual") return "Ошибка в понимании";
  if (severity === "computational") return "Ошибка в вычислениях";
  return "Невнимательность";
}

export function StudentProgressPanel({ lessonId }: { lessonId: number }) {
  const [history, setHistory] = useState<AiHomeworkHistoryItem[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [progress, setProgress] = useState<AiProgressReport | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  async function handleShowHistory() {
    if (history || isHistoryLoading) return;
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      setHistory(await getAiReviewHistory(lessonId));
    } catch (error) {
      setHistoryError(getErrorMessage(error, "Не удалось загрузить историю."));
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function handleCollectProgress() {
    if (isProgressLoading) return;
    setIsProgressLoading(true);
    setProgressError(null);
    try {
      setProgress(await getAiReviewProgress(lessonId));
    } catch (error) {
      setProgressError(getErrorMessage(error, "Не удалось собрать аналитику за период."));
    } finally {
      setIsProgressLoading(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <History className="size-5 text-primary" />
        <h3>Прогресс ученика</h3>
      </div>

      <Accordion
        className="rounded-2xl border border-border px-4"
        collapsible
        onValueChange={(value) => { if (value) void handleShowHistory(); }}
        type="single"
      >
        <AccordionItem value="history">
          <AccordionTrigger>
            <span className="flex flex-wrap items-center gap-2">
              <span>Показать историю и прогресс</span>
              {isHistoryLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            {historyError ? <p className="text-sm text-danger-foreground">{historyError}</p> : null}

            {history ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Занятий: {history.length}/10</p>
                <div className="flex flex-wrap gap-2">
                  {history.map((item) => (
                    <Badge key={item.homework_number} variant="soft">
                      {item.homework_label}
                    </Badge>
                  ))}
                </div>

                <Button
                  disabled={isProgressLoading}
                  onClick={() => void handleCollectProgress()}
                  type="button"
                  variant="outline"
                >
                  {isProgressLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Собрать аналитику за период
                </Button>

                {progressError ? <p className="text-sm text-danger-foreground">{progressError}</p> : null}

                {progress ? (
                  <div className="space-y-4 rounded-2xl bg-canvas p-4">
                    {!progress.threshold_reached ? (
                      <div className="rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-ink">
                        Ещё не набралось 10 занятий — это предварительная сводка по {progress.homework_count}.
                      </div>
                    ) : null}

                    <p className="text-sm text-foreground">{progress.narrative}</p>

                    {progress.strengths.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">Сильные стороны:</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {progress.strengths.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {progress.focus_areas.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">Над чем работать:</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {progress.focus_areas.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {progress.clusters.map((cluster, index) => (
                      <div className="rounded-xl border border-border bg-white p-3" key={`${cluster.label}-${index}`}>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-medium text-foreground">{cluster.label}</span>
                          <span className="text-muted-foreground">
                            {cluster.error_count} ошибок · {cluster.homework_labels.join(", ")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{cluster.description}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

export function ReviewResult({ result, onUseSummary }: { result: AiHomeworkResult; onUseSummary?: (summary: string) => void }) {
  if (!result.readable) {
    return (
      <div className="rounded-2xl border border-warning/20 bg-warning-soft p-5">
        <div className="flex items-center gap-2 text-foreground">
          <AlertCircle className="size-5" />
          Не удалось уверенно прочитать работу
        </div>
        {result.quality_note ? <p className="mt-2 text-sm text-muted-foreground">{result.quality_note}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-canvas p-5">
        <p className="text-xs uppercase tracking-[0.13em] text-quiet">Общий вывод</p>
        <p className="mt-2 text-sm text-foreground">{result.summary || "Проверка завершена."}</p>
        {result.summary && onUseSummary ? (
          <Button className="mt-4 rounded-full" onClick={() => onUseSummary(result.summary)} size="sm" type="button" variant="outline">
            Добавить вывод в комментарий
          </Button>
        ) : null}
      </section>

      <section>
        <h3>Разбор заданий</h3>
        {result.tasks.length > 0 ? (
          <Accordion className="mt-3 rounded-2xl border border-border px-4" collapsible type="single">
            {result.tasks.map((task, index) => (
              <AccordionItem key={`${task.task_label}-${index}`} value={`task-${index}`}>
                <AccordionTrigger>
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{task.task_label || `Задание ${index + 1}`}</span>
                    <Badge variant={task.is_correct ? "success" : "danger"}>
                      {task.is_correct ? "Верно" : "Есть ошибки"}
                    </Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="rounded-xl bg-canvas p-4">
                    <p className="text-xs uppercase tracking-[0.13em] text-quiet">Распознанное решение</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{task.transcription}</p>
                  </div>
                  {task.errors.map((error, errorIndex) => (
                    <div className="rounded-xl border border-danger/20 bg-danger-soft p-4" key={`${error.location}-${errorIndex}`}>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="danger">{severityLabel(error.severity)}</Badge>
                        <Badge variant="secondary">{error.topic}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-foreground">{error.explanation}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Ученик написал: {error.student_wrote}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Правильно: {error.correct}</p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Задания не распознаны.</p>
        )}
      </section>

      {result.practice.length > 0 ? (
        <section>
          <h3>Работа над ошибками</h3>
          <div className="mt-3 grid gap-3">
            {result.practice.map((task, index) => (
              <div className="rounded-2xl border border-border bg-white p-4" key={`${task.topic}-${index}`}>
                <Badge variant="soft">{task.topic}</Badge>
                <p className="mt-3 text-sm text-foreground">{task.question}</p>
                <p className="mt-3 text-xs text-muted-foreground">Подсказка: {task.hint}</p>
                <details className="mt-3 text-sm text-muted-foreground">
                  <summary className="cursor-pointer text-primary">Показать ответ и решение</summary>
                  <p className="mt-2">Ответ: {task.answer}</p>
                  <p className="mt-1">{task.solution}</p>
                </details>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

interface AiHomeworkReviewControlProps {
  lessonId: number;
  onUseSummary: (summary: string) => void;
}

export function AiHomeworkReviewControl({ lessonId, onUseSummary }: AiHomeworkReviewControlProps) {
  const [state, setState] = useState<AiReviewState | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getAiReviewState(lessonId)
      .then((nextState) => { if (active) setState(nextState); })
      .catch(() => { if (active) setState(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [lessonId]);

  useEffect(() => {
    if (!isOpen || state?.status !== "not_started" || !state.available) return;
    setIsLoading(true);
    startAiReview(lessonId)
      .then(setState)
      .catch((error) => toast.error(getErrorMessage(error, "Не удалось запустить ИИ-проверку.")))
      .finally(() => setIsLoading(false));
  }, [isOpen, lessonId, state?.available, state?.status]);

  useEffect(() => {
    if (!isOpen || (state?.status !== "pending" && state?.status !== "running")) return;
    const timeout = window.setTimeout(() => {
      getAiReviewState(lessonId).then(setState).catch(() => undefined);
    }, 1800);
    return () => window.clearTimeout(timeout);
  }, [isOpen, lessonId, state]);

  const isCompleted = state?.status === "completed";
  const isProcessing = state?.status === "pending" || state?.status === "running";
  const disabled = isLoading || !state || (!isCompleted && !isProcessing && !state.available);

  return (
    <>
      <Button
        className="h-auto w-full rounded-2xl bg-[image:var(--brand-gradient-diagonal)] px-4 py-4 text-white shadow-none hover:opacity-95 disabled:opacity-50"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {isProcessing ? <Loader2 className="size-[22px] animate-spin" /> : <AiAssistantMark />}
        {isCompleted ? "Посмотреть результаты проверки" : isProcessing ? "ИИ проверяет домашнее задание" : "Проверить с помощью ИИ помощника"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Проверка домашнего задания с помощью ИИ</DialogTitle>
            <DialogDescription>ИИ анализирует не более трёх заданий ученика в день. Итоговую оценку подтверждает репетитор.</DialogDescription>
          </DialogHeader>

          {isLoading || isProcessing || !state ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[image:var(--brand-gradient-diagonal)] text-white">
                <Loader2 className="size-8 animate-spin" />
              </div>
              <div>
                <h3>ИИ проверяет работу</h3>
                <p className="mt-2 text-sm text-muted-foreground">Можно закрыть окно — результат сохранится и будет доступен позже.</p>
              </div>
            </div>
          ) : null}

          {state?.status === "failed" ? (
            <div className="rounded-2xl border border-danger/20 bg-danger-soft p-5">
              <div className="flex items-center gap-2 text-foreground"><AlertCircle className="size-5" />Проверку завершить не удалось</div>
              <p className="mt-2 text-sm text-muted-foreground">{state.error_message || "Попробуйте запустить проверку позже."}</p>
              <Button className="mt-4 rounded-full" onClick={() => setState({ ...state, status: "not_started", available: true })} type="button" variant="outline">Попробовать ещё раз</Button>
            </div>
          ) : null}

          {state?.status === "completed" && state.result ? (
            <>
              <div className="flex items-center gap-2 text-sm text-success-foreground"><CheckCircle2 className="size-5" />Проверка завершена</div>
              <ReviewResult result={state.result} onUseSummary={(summary) => { onUseSummary(summary); toast.success("Вывод добавлен в комментарий"); }} />
              <StudentProgressPanel lessonId={lessonId} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
