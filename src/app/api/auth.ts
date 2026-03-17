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
