import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import { mapHomeworkReview } from "./mappers";

export async function listPendingSubmissions() {
  const payload = await apiRequest<unknown[]>(apiConfig.tutor.pendingSubmissions);
  return payload.map(mapHomeworkReview);
}

export async function checkSubmission(submissionId: number, comment: string) {
  const payload = await apiRequest(apiConfig.tutor.checkSubmission(submissionId), {
    method: "POST",
    body: JSON.stringify({
      comment: comment || null,
    }),
  });

  return mapHomeworkReview(payload);
}
