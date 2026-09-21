import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import { mapHomeworkReview } from "./mappers";
import type { AiHomeworkHistoryItem, AiProgressReport, AiReviewState } from "../types/domain";

export async function listPendingSubmissions() {
  const payload = await apiRequest<unknown[]>(apiConfig.tutor.pendingSubmissions);
  return payload.map(mapHomeworkReview);
}

export async function listSubmissions(status?: "submitted" | "checked") {
  const endpoint = status
    ? `${apiConfig.tutor.submissions}?status=${encodeURIComponent(status)}`
    : apiConfig.tutor.submissions;
  const payload = await apiRequest<unknown[]>(endpoint);
  return payload.map(mapHomeworkReview);
}

export interface SubmissionCheckInput {
  comment: string;
  grade: number | null;
  checkedFileId?: number | null;
  checkedFileIds?: number[];
}

export async function checkSubmission(
  submissionId: number,
  input: SubmissionCheckInput,
) {
  const payload = await apiRequest(apiConfig.tutor.checkSubmission(submissionId), {
    method: "POST",
    body: JSON.stringify({
      comment: input.comment || null,
      grade: input.grade,
      checked_file_id: input.checkedFileId || null,
      checked_file_ids: input.checkedFileIds || [],
    }),
  });

  return mapHomeworkReview(payload);
}

export function getAiReviewState(lessonId: number) {
  return apiRequest<AiReviewState>(apiConfig.tutor.aiReview(lessonId));
}

export function startAiReview(lessonId: number) {
  return apiRequest<AiReviewState>(apiConfig.tutor.aiReview(lessonId), {
    method: "POST",
  });
}

export function getAiReviewHistory(lessonId: number) {
  return apiRequest<AiHomeworkHistoryItem[]>(apiConfig.tutor.aiHistory(lessonId));
}

export function getAiReviewProgress(lessonId: number) {
  return apiRequest<AiProgressReport>(apiConfig.tutor.aiProgress(lessonId));
}

export function getStudentAiReviewState(lessonId: number) {
  return apiRequest<AiReviewState>(apiConfig.student.aiReview(lessonId));
}
