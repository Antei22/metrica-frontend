import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../lib/errors";
import {
  FIELD_LIMITS,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePassword,
} from "../lib/formValidation";
import { getHomePathForRole } from "../lib/routes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

type SubmitMode = "login" | "register" | null;

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [registerRole, setRegisterRole] = useState<"student" | "tutor">("student");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [submitMode, setSubmitMode] = useState<SubmitMode>(null);

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ||
    null;

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);

    const loginValidationError =
      validateEmail(loginEmail) || validatePassword(loginPassword);

    if (loginValidationError) {
      setLoginError(loginValidationError);
      return;
    }

    setSubmitMode("login");

    try {
      const user = await login(loginEmail.trim(), loginPassword);
      navigate(redirectPath || getHomePathForRole(user.role), { replace: true });
    } catch (error) {
      setLoginError(getErrorMessage(error, "Не удалось войти в аккаунт."));
    } finally {
      setSubmitMode(null);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterError(null);

    const registerValidationError =
      validateFirstName(registerFirstName) ||
      validateLastName(registerLastName) ||
      validateEmail(registerEmail) ||
      validatePassword(registerPassword);

    if (registerValidationError) {
      setRegisterError(registerValidationError);
      return;
    }

    setSubmitMode("register");

    try {
      const user = await register({
        email: registerEmail.trim(),
        password: registerPassword,
        firstName: registerFirstName.trim(),
        lastName: registerLastName.trim(),
        role: registerRole,
      });
      navigate(getHomePathForRole(user.role), { replace: true });
    } catch (error) {
      setRegisterError(getErrorMessage(error, "Не удалось создать аккаунт."));
    } finally {
      setSubmitMode(null);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Онлайн-платформа
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight">МЕТРИКА</h1>
              <p className="mt-6 max-w-md text-base text-slate-300">
                Личный кабинет для репетитора и ученика с расписанием, материалами
                занятия и проверкой домашних заданий.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-medium text-white">Для репетитора</p>
                <p className="mt-2 text-sm text-slate-300">
                  Добавление учеников, создание занятий и проверка домашних заданий.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-medium text-white">Для ученика</p>
                <p className="mt-2 text-sm text-slate-300">
                  Просмотр занятий, доступ к материалам и отправка выполненных работ.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Онлайн-платформа
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">МЕТРИКА</h1>
            </div>

            <Tabs className="w-full" defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-slate-100 p-1">
                <TabsTrigger className="rounded-full" value="login">
                  Вход
                </TabsTrigger>
                <TabsTrigger className="rounded-full" value="register">
                  Регистрация
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      autoComplete="email"
                      maxLength={FIELD_LIMITS.email}
                      placeholder="you@example.com"
                      type="email"
                      value={loginEmail}
                      onChange={(event) => {
                        setLoginEmail(event.target.value);
                        setLoginError(null);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      autoComplete="current-password"
                      maxLength={FIELD_LIMITS.password}
                      placeholder="Введите пароль"
                      type="password"
                      value={loginPassword}
                      onChange={(event) => {
                        setLoginPassword(event.target.value);
                        setLoginError(null);
                      }}
                      required
                    />
                  </div>

                  {loginError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {loginError}
                    </div>
                  ) : null}

                  <Button
                    className="mt-2 h-11 w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    disabled={submitMode === "login"}
                    type="submit"
                  >
                    {submitMode === "login" ? "Входим..." : "Войти"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label>Роль</Label>
                    <RadioGroup
                      className="grid gap-3 sm:grid-cols-2"
                      value={registerRole}
                      onValueChange={(value) => setRegisterRole(value as "student" | "tutor")}
                    >
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                        <RadioGroupItem id="role-student" value="student" />
                        <span>Ученик</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                        <RadioGroupItem id="role-tutor" value="tutor" />
                        <span>Репетитор</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="register-first-name">Имя</Label>
                      <Input
                        id="register-first-name"
                        maxLength={FIELD_LIMITS.personName}
                        placeholder="Анна"
                        value={registerFirstName}
                        onChange={(event) => {
                          setRegisterFirstName(event.target.value);
                          setRegisterError(null);
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-last-name">Фамилия</Label>
                      <Input
                        id="register-last-name"
                        maxLength={FIELD_LIMITS.personName}
                        placeholder="Иванова"
                        value={registerLastName}
                        onChange={(event) => {
                          setRegisterLastName(event.target.value);
                          setRegisterError(null);
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      autoComplete="email"
                      maxLength={FIELD_LIMITS.email}
                      placeholder="you@example.com"
                      type="email"
                      value={registerEmail}
                      onChange={(event) => {
                        setRegisterEmail(event.target.value);
                        setRegisterError(null);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <Input
                      id="register-password"
                      autoComplete="new-password"
                      maxLength={FIELD_LIMITS.password}
                      minLength={6}
                      placeholder="Минимум 6 символов"
                      type="password"
                      value={registerPassword}
                      onChange={(event) => {
                        setRegisterPassword(event.target.value);
                        setRegisterError(null);
                      }}
                      required
                    />
                  </div>

                  {registerError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {registerError}
                    </div>
                  ) : null}

                  <Button
                    className="mt-2 h-11 w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    disabled={submitMode === "register"}
                    type="submit"
                  >
                    {submitMode === "register" ? "Создаём аккаунт..." : "Зарегистрироваться"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </div>
  );
}
