import { useEffect, useState } from "react";
import { toast } from "sonner";
import { checkSubmission, listPendingSubmissions } from "../api/homework";
import { resolveApiUrl } from "../api/client";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { formatDate } from "../lib/format";
import { getErrorMessage } from "../lib/errors";
import type { HomeworkReview } from "../types/domain";

export function TutorHomework() {
  const [pendingSubmissions, setPendingSubmissions] = useState<HomeworkReview[]>([]);
  const [checkedSubmissions, setCheckedSubmissions] = useState<HomeworkReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkReview | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadPendingSubmissions() {
    setLoading(true);
    setError(null);

    try {
      setPendingSubmissions(await listPendingSubmissions());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить домашние задания."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPendingSubmissions();
  }, []);

  async function handleCheckSubmission() {
    if (!selectedSubmission) {
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewedSubmission = await checkSubmission(selectedSubmission.id, comment);
      setPendingSubmissions((currentItems) =>
        currentItems.filter((item) => item.id !== reviewedSubmission.id),
      );
      setCheckedSubmissions((currentItems) => [reviewedSubmission, ...currentItems]);
      setSelectedSubmission(null);
      setComment("");
      toast.success("Домашнее задание проверено");
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Не удалось сохранить проверку."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout
      title="Проверка домашних заданий"
      description="Здесь собраны работы, которые ученики уже отправили и которые ждут вашего комментария."
      actions={
        <Button variant="outline" onClick={() => void loadPendingSubmissions()}>
          Обновить
        </Button>
      }
    >
      {loading ? <LoadingState title="Загружаем домашние задания..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось загрузить работы"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadPendingSubmissions()}
        />
      ) : null}

      {!loading && !error ? (
        <>
          {pendingSubmissions.length === 0 && checkedSubmissions.length === 0 ? (
            <EmptyState
              title="Нет работ на проверке"
              description="Как только ученики отправят решения, они появятся в этом разделе."
            />
          ) : null}

          {pendingSubmissions.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">На проверке</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {pendingSubmissions.length} {pendingSubmissions.length === 1 ? "работа" : "работ"}
                </p>
              </div>

              <div className="grid gap-4">
                {pendingSubmissions.map((submission) => (
                  <Card key={submission.id} className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader className="gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle>{submission.student}</CardTitle>
                          <p className="mt-2 text-sm text-slate-500">
                            {submission.lessonTopic || "Тема занятия не указана"}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          На проверке
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div className="space-y-2 text-sm text-slate-600">
                        <p>Дата занятия: {formatDate(submission.lessonDate)}</p>
                        {submission.fileUrl ? (
                          <a
                            className="inline-flex text-sm font-medium text-slate-900 underline underline-offset-4"
                            href={resolveApiUrl(submission.fileUrl)}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Открыть файл{submission.fileName ? `: ${submission.fileName}` : ""}
                          </a>
                        ) : (
                          <p>Файл не прикреплён.</p>
                        )}
                      </div>

                      <Button
                        className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setComment(submission.comment || "");
                        }}
                      >
                        Проверить
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {checkedSubmissions.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Проверено в этой сессии</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Эти работы уже получили ваш комментарий.
                </p>
              </div>

              <div className="grid gap-4">
                {checkedSubmissions.map((submission) => (
                  <Card key={submission.id} className="rounded-3xl border-emerald-200 bg-emerald-50 shadow-sm">
                    <CardContent className="grid gap-3 p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{submission.student}</p>
                          <p className="text-sm text-slate-600">
                            {submission.lessonTopic || "Тема занятия не указана"}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          Проверено
                        </span>
                      </div>

                      <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">Комментарий</p>
                        <p className="mt-2">
                          {submission.comment || "Комментарий не был добавлен."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <Dialog
        open={Boolean(selectedSubmission)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedSubmission(null);
            setComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Проверка домашнего задания</DialogTitle>
          </DialogHeader>

          {selectedSubmission ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{selectedSubmission.student}</p>
                <p className="mt-1">{selectedSubmission.lessonTopic || "Тема занятия не указана"}</p>
                <p className="mt-1">Дата занятия: {formatDate(selectedSubmission.lessonDate)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission-comment">Комментарий ученику</Label>
                <Textarea
                  id="submission-comment"
                  placeholder="Напишите, что выполнено хорошо и что стоит исправить."
                  rows={5}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedSubmission(null);
                    setComment("");
                  }}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800"
                  disabled={isSubmitting}
                  onClick={handleCheckSubmission}
                >
                  {isSubmitting ? "Сохраняем..." : "Отправить проверку"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
