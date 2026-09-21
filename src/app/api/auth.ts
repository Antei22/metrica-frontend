import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import { mapCurrentUser } from "./mappers";
import type { CurrentUser, UserRole } from "../types/domain";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export async function login(input: LoginInput): Promise<CurrentUser> {
  const payload = await apiRequest(apiConfig.auth.login, {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });

  return mapCurrentUser(payload);
}

export async function register(input: RegisterInput): Promise<CurrentUser> {
  const payload = await apiRequest(apiConfig.auth.register, {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      first_name: input.firstName,
      last_name: input.lastName || null,
      role: input.role,
    }),
  });

  return mapCurrentUser(payload);
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return apiRequest(apiConfig.auth.resendVerification, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmail(token: string): Promise<CurrentUser> {
  const payload = await apiRequest(apiConfig.auth.verifyEmail, {
    method: "POST",
    body: JSON.stringify({ token }),
  });

  return mapCurrentUser(payload);
}

export interface InvitePreview {
  role: Exclude<UserRole, "tutor">;
  tutorName: string;
  studentName: string | null;
  expiresAt: string;
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const payload = (await apiRequest(apiConfig.auth.invitePreview(token))) as {
    role: string;
    tutor_name: string;
    student_name: string | null;
    expires_at: string;
  };

  return {
    role: payload.role as InvitePreview["role"],
    tutorName: payload.tutor_name,
    studentName: payload.student_name,
    expiresAt: payload.expires_at,
  };
}

interface InviteRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function registerViaInvite(
  token: string,
  input: InviteRegisterInput,
): Promise<CurrentUser> {
  const payload = await apiRequest(apiConfig.auth.registerInvite(token), {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      first_name: input.firstName,
      last_name: input.lastName || null,
    }),
  });

  return mapCurrentUser(payload);
}

export async function getCurrentUser() {
  const payload = await apiRequest(apiConfig.auth.me, undefined, {
    retryOnAuth: true,
  });

  return mapCurrentUser(payload);
}

export async function logout() {
  await apiRequest(apiConfig.auth.logout, {
    method: "POST",
  });
}
