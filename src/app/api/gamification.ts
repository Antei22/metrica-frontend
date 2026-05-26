import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import { mapBonusTask, mapGamification } from "./mappers";

export interface GamificationSettingsInput {
  starRewardsEnabled: boolean;
  starGoal: number | null;
  starRewardTitle: string | null;
}

export interface BonusTaskInput {
  title: string;
  description?: string | null;
  stars?: number | null;
  rewardTitle?: string | null;
  dueDate?: string | null;
}

export async function getTutorStudentGamification(tutorStudentId: number | string) {
  const payload = await apiRequest(
    apiConfig.tutor.studentGamification(tutorStudentId),
  );
  return mapGamification(payload);
}

export async function updateTutorStudentGamification(
  tutorStudentId: number | string,
  input: GamificationSettingsInput,
) {
  const payload = await apiRequest(
    apiConfig.tutor.studentGamification(tutorStudentId),
    {
      method: "PATCH",
      body: JSON.stringify({
        star_rewards_enabled: input.starRewardsEnabled,
        star_goal: input.starGoal,
        star_reward_title: input.starRewardTitle || null,
      }),
    },
  );
  return mapGamification(payload);
}

export async function createBonusTask(
  tutorStudentId: number | string,
  input: BonusTaskInput,
) {
  const payload = await apiRequest(apiConfig.tutor.bonusTasks(tutorStudentId), {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      description: input.description || null,
      stars: input.stars ?? null,
      reward_title: input.rewardTitle || null,
      due_date: input.dueDate || null,
    }),
  });
  return mapBonusTask(payload);
}

export async function updateBonusTask(
  taskId: number | string,
  input: Partial<BonusTaskInput> & { isCompleted?: boolean },
) {
  const payload = await apiRequest(apiConfig.tutor.bonusTaskById(taskId), {
    method: "PATCH",
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      stars: input.stars,
      reward_title: input.rewardTitle,
      due_date: input.dueDate,
      is_completed: input.isCompleted,
    }),
  });
  return mapBonusTask(payload);
}

export async function listStudentGamification() {
  const payload = await apiRequest<unknown[]>(apiConfig.student.gamification);
  return payload.map(mapGamification);
}
