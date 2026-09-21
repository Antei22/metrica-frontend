import { FileUp, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { resolveApiUrl } from "../../api/client";
import { uploadTutorFile } from "../../api/files";
import { checkSubmission } from "../../api/homework";
import { getErrorMessage } from "../../lib/errors";
import { formatDate } from "../../lib/format";
import { getHomeworkCardState, HOMEWORK_FILE_ACCEPT } from "../../lib/homework";
import type { HomeworkReview, Lesson, LessonMaterial } from "../../types/domain";
import { FileLinkButton } from "../FileLinkButton";
import { StarRatingInput } from "../StarRatingInput";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { HomeworkBadge } from "./HomeworkCard";
import { AiHomeworkReviewControl } from "./AiHomeworkReviewControl";
import { SubmissionFilesBlock } from "./SubmissionFilesBlock";

function getPendingFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(file: File) {
  return `${(file.size / 1024).toFixed(1)} KB`;
}

interface HomeworkReviewDialogProps {
  lesson: Lesson | null;
  submission: HomeworkReview | null;
  onClose: () => void;
  onChecked: (review: HomeworkReview) => void;
}

/**
 * Сводка по заданию: статус, ученик/тема/дата/дедлайн (в compact-режиме скрыты —
 * уже есть в шапке формы проверки и SubmissionFilesBlock), файлы задания.
 * Не содержит элементов проверки — те рендерит HomeworkReviewForm, если есть submission.
 */
function HomeworkTaskInfo({ lesson, compact }: { lesson: Lesson; compact: boolean }) {
  const state = getHomeworkCardState(lesson);

  return (
    <div className="rounded-2xl bg-canvas p-4 text-sm text-muted-foreground">
      <HomeworkBadge state={state} />

      {!compact ? (
        <>
          <p className="mt-3 font-medium text-foreground">{lesson.studentName || "Ученик"}</p>
          <p className="mt-1">
            {[lesson.subject, lesson.topic].filter(Boolean).join(" · ") || "Тема занятия не указана"}
          </p>
          <p className="mt-1">Дата занятия: {formatDate(lesson.date)}</p>
          <p className="mt-1">
            Дедлайн ДЗ: {lesson.homeworkDeadline ? formatDate(lesson.homeworkDeadline) : "не задан"}
          </p>
        </>
      ) : null}

      <div className="mt-3">
        <p className="font-medium text-foreground">Файлы задания:</p>
        {lesson.homeworkTaskFiles.length > 0 ? (
          <div className="mt-2 flex max-w-full flex-col items-start gap-2">
            {lesson.homeworkTaskFiles.map((file) => (
              <FileLinkButton file={file} fallback="Открыть файл" key={file.id} />
            ))}
          </div>
        ) : (
          <p className="mt-1">Файлы задания не прикреплены</p>
        )}
      </div>
    </div>
  );
}

interface HomeworkReviewFormProps {
  lessonId: number;
  selectedSubmission: HomeworkReview;
  onClose: () => void;
  onChecked: (review: HomeworkReview) => void;
}

/* Форма монтируется с key={submission.id}, поэтому useState-инициализаторы
   берут значения из props синхронно — без мигания, как в прежнем openReviewDialog. */
function HomeworkReviewForm({
  lessonId,
  selectedSubmission,
  onClose,
  onChecked,
}: HomeworkReviewFormProps) {
  const [comment, setComment] = useState(selectedSubmission.comment || "");
  const [grade, setGrade] = useState<number | null>(selectedSubmission.grade);
  const [retainedReviewFiles, setRetainedReviewFiles] = useState<LessonMaterial[]>(
    selectedSubmission.checkedFiles,
  );
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAddReviewFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || []);

    if (nextFiles.length > 0) {
      setReviewFiles((currentFiles) => [...currentFiles, ...nextFiles]);
    }

    event.target.value = "";
  }

  function removeRetainedReviewFile(fileId: string) {
    setRetainedReviewFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
  }

  function removeReviewFile(index: number) {
    setReviewFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  async function handleCheckSubmission() {
    if (!grade) {
      toast.error("Выберите оценку за ДЗ.");
      return;
    }

    setIsSubmitting(true);

    try {
      const checkedFileRefs = await Promise.all(
        reviewFiles.map((file) => uploadTutorFile(file)),
      );
      const retainedReviewFileIds = retainedReviewFiles
        .map((file) => file.fileId)
        .filter((fileId): fileId is number => typeof fileId === "number");
      const reviewedSubmission = await checkSubmission(selectedSubmission.id, {
        comment,
        grade,
        checkedFileIds: [
          ...retainedReviewFileIds,
          ...checkedFileRefs.map((file) => file.fileId),
        ],
      });

      onChecked(reviewedSubmission);
      onClose();
      toast.success("Домашнее задание проверено");
    } catch (submitError) {
      toast.error(
        getErrorMessage(submitError, "Не удалось сохранить проверку."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-canvas p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          {selectedSubmission.student}
        </p>
        <p className="mt-1">
          {selectedSubmission.lessonTopic || "Тема занятия не указана"}
        </p>
        <p className="mt-1">
          Дата занятия: {formatDate(selectedSubmission.lessonDate)}
        </p>
        {selectedSubmission.files.length > 0 ? (
          <div className="mt-3">
            <SubmissionFilesBlock
              files={selectedSubmission.files}
              homeworkDeadline={selectedSubmission.homeworkDeadline}
              homeworkDeadlineMissed={selectedSubmission.homeworkDeadlineMissed}
              submittedAt={selectedSubmission.submittedAt}
              title="Решение ученика"
            />
          </div>
        ) : null}
        {selectedSubmission.studentComment ? (
          <p className="mt-3 rounded-2xl bg-white p-3 text-sm text-muted-foreground">
            {selectedSubmission.studentComment}
          </p>
        ) : null}
      </div>

      <AiHomeworkReviewControl
        lessonId={lessonId}
        onUseSummary={(summary) =>
          setComment((current) => current.trim() ? `${current.trim()}\n\n${summary}` : summary)
        }
      />

      <div className="space-y-2">
        <Label htmlFor="submission-grade">Оценка за ДЗ</Label>
        <StarRatingInput id="submission-grade" value={grade} onChange={setGrade} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="submission-review-file">
          Проверенный файл с правками
        </Label>
        <Input
          accept={HOMEWORK_FILE_ACCEPT}
          id="submission-review-file"
          multiple
          type="file"
          onChange={handleAddReviewFiles}
        />
        <p className="text-xs text-muted-foreground">
          Можно добавлять файлы в несколько подходов. Лишние файлы можно убрать перед сохранением проверки.
        </p>

        {retainedReviewFiles.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-quiet">
              Уже прикрепленные проверенные файлы
            </p>
            {retainedReviewFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-canvas px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Будет сохранен в проверке</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {file.url ? (
                    <Button asChild size="sm" type="button" variant="outline">
                      <a href={resolveApiUrl(file.url)} rel="noreferrer" target="_blank">
                        Открыть
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => removeRetainedReviewFile(file.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {reviewFiles.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-quiet">
              Новые проверенные файлы
            </p>
            {reviewFiles.map((file, index) => (
              <div
                key={getPendingFileKey(file)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-quiet/40 bg-canvas px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file)}</p>
                </div>
                <Button
                  onClick={() => removeReviewFile(index)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
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
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={handleCheckSubmission}
        >
          <FileUp className="size-4" />
          {isSubmitting ? "Сохраняем..." : "Сохранить проверку"}
        </Button>
      </div>
    </div>
  );
}

export function HomeworkReviewDialog({
  lesson,
  submission,
  onClose,
  onChecked,
}: HomeworkReviewDialogProps) {
  return (
    <Dialog
      open={Boolean(lesson)}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {submission ? "Проверка домашнего задания" : "Домашнее задание"}
          </DialogTitle>
        </DialogHeader>

        {lesson ? <HomeworkTaskInfo compact={Boolean(submission)} lesson={lesson} /> : null}

        {submission ? (
          <HomeworkReviewForm
            key={submission.id}
            lessonId={lesson.id}
            onChecked={onChecked}
            onClose={onClose}
            selectedSubmission={submission}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
