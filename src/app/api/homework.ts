import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import { mapHomeworkReview } from "./mappers";

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
