import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";

export interface InviteLink {
  token: string;
  url: string;
  role: "student" | "parent";
  expiresAt: string;
}

function mapInvite(payload: unknown): InviteLink {
  const record = payload as {
    token: string;
    url: string;
    role: "student" | "parent";
    expires_at: string;
  };

  return {
    token: record.token,
    url: record.url,
    role: record.role,
    expiresAt: record.expires_at,
  };
}

export async function createStudentInvite(invitee_email?: string): Promise<InviteLink> {
  const payload = await apiRequest(apiConfig.tutor.inviteStudent, {
    method: "POST",
    body: JSON.stringify({ role: "student", invitee_email: invitee_email || null }),
  });

  return mapInvite(payload);
}

export async function createParentInvite(
  tutorStudentId: number | string,
  invitee_email?: string,
): Promise<InviteLink> {
  const payload = await apiRequest(apiConfig.tutor.inviteParent(tutorStudentId), {
    method: "POST",
    body: JSON.stringify({ role: "parent", invitee_email: invitee_email || null }),
  });

  return mapInvite(payload);
}
