/** Presentation of existing API states; no API or business logic changes. */
export type StatusTone = "secondary" | "soft" | "warning" | "success" | "danger";
export type AiReviewStatus = "not_started" | "pending" | "running" | "completed" | "failed";
export const aiReviewLabels: Record<AiReviewStatus, { label: string; tone: StatusTone }> = {
  not_started: { label: "Проверка не запущена", tone: "secondary" },
  pending: { label: "В очереди", tone: "warning" },
  running: { label: "Проверяем", tone: "soft" },
  completed: { label: "Проверка готова", tone: "success" },
  failed: { label: "Не удалось проверить", tone: "danger" },
};
export function getAiReviewPresentation(status: AiReviewStatus, available = true) {
  return available ? aiReviewLabels[status] : { label: "Проверка недоступна", tone: "secondary" as const };
}
export const submissionLabels = {
  submitted: { label: "На проверке", tone: "warning" },
  checked: { label: "Проверено", tone: "success" },
} as const;
