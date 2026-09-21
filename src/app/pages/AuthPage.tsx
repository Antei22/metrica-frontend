import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { resendVerification } from "../api/auth";
import { ApiError } from "../api/client";
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
  const [loginNeedsVerification, setLoginNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const [registerRole, setRegisterRole] = useState<"student" | "tutor" | "parent">("student");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const [submitMode, setSubmitMode] = useState<SubmitMode>(null);

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ||
    null;

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    setLoginNeedsVerification(false);
    setResendState("idle");

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
      if (error instanceof ApiError && error.detail === "EMAIL_NOT_VERIFIED") {
        setLoginNeedsVerification(true);
        setLoginError("Почта не подтверждена. Проверьте письмо со ссылкой подтверждения.");
      } else {
        setLoginError(getErrorMessage(error, "Не удалось войти в аккаунт."));
      }
    } finally {
      setSubmitMode(null);
    }
  }

  async function handleResendVerification() {
    setResendState("sending");
    try {
      await resendVerification(loginEmail.trim());
      setResendState("sent");
    } catch {
      setResendState("idle");
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
      const email = registerEmail.trim();
      await register({
        email,
        password: registerPassword,
        firstName: registerFirstName.trim(),
        lastName: registerLastName.trim(),
        role: registerRole,
      });
      // Регистрация больше не логинит сразу — почту нужно подтвердить письмом.
      setRegisteredEmail(email);
    } catch (error) {
      setRegisterError(getErrorMessage(error, "Не удалось создать аккаунт."));
    } finally {
      setSubmitMode(null);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--warm)_0%,var(--panel-blue)_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-white shadow-float lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden flex-col brand-gradient p-10 text-primary-foreground lg:flex">
            <div className="-mt-2">
              <p className="text-xs uppercase tracking-[0.13em] text-white/70">
                Онлайн-платформа
              </p>
              <h1 className="mt-4 text-5xl leading-[1.05] tracking-[-0.045em]">МЕТРИКА</h1>
              <p className="mt-6 max-w-md text-base text-white/80">
                Личный кабинет для репетитора, ученика и родителя с расписанием,
                материалами занятия и проверкой домашних заданий.
              </p>
            </div>

            <div className="mt-7 grid gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/15 p-5">
                <p className="text-sm font-medium text-white">Для репетитора</p>
                <p className="mt-2 text-sm text-white/80">
                  Добавление учеников, создание занятий и проверка домашних заданий.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/15 p-5">
                <p className="text-sm font-medium text-white">Для ученика</p>
                <p className="mt-2 text-sm text-white/80">
                  Просмотр занятий, доступ к материалам и отправка выполненных работ.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/15 p-5">
                <p className="text-sm font-medium text-white">Для родителя</p>
                <p className="mt-2 text-sm text-white/80">
                  Последние оценки, история занятий и расписание ребенка.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 lg:hidden">
              <p className="text-xs uppercase tracking-[0.13em] text-white/70">
                Онлайн-платформа
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-foreground">МЕТРИКА</h1>
            </div>

            <Tabs className="w-full" defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-panel p-1">
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
                    <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-ink">
                      <p>{loginError}</p>
                      {loginNeedsVerification ? (
                        <button
                          className="mt-2 font-medium underline disabled:opacity-60"
                          disabled={resendState !== "idle"}
                          onClick={() => void handleResendVerification()}
                          type="button"
                        >
                          {resendState === "sending"
                            ? "Отправляем..."
                            : resendState === "sent"
                              ? "Письмо отправлено повторно"
                              : "Отправить письмо ещё раз"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <Button
                    className="mt-2 h-11 w-full rounded-full"
                    disabled={submitMode === "login"}
                    type="submit"
                  >
                    {submitMode === "login" ? "Входим..." : "Войти"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                {registeredEmail ? (
                  <div className="mt-6 space-y-4 rounded-2xl border border-success/20 bg-success-soft px-5 py-6 text-center">
                    <p className="text-base font-semibold text-ink">
                      Почти готово!
                    </p>
                    <p className="text-sm text-ink">
                      Мы отправили письмо со ссылкой подтверждения на{" "}
                      <span className="font-medium">{registeredEmail}</span>. Перейдите
                      по ней, чтобы войти в аккаунт.
                    </p>
                    <button
                      className="text-sm font-medium text-ink underline"
                      onClick={() => setRegisteredEmail(null)}
                      type="button"
                    >
                      Зарегистрировать ещё один аккаунт
                    </button>
                  </div>
                ) : (
                <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label>Роль</Label>
                    <RadioGroup
                      className="grid gap-3 sm:grid-cols-3"
                      value={registerRole}
                      onValueChange={(value) =>
                        setRegisterRole(value as "student" | "tutor" | "parent")
                      }
                    >
                      <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
                        <RadioGroupItem id="role-student" value="student" />
                        <span>Ученик</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
                        <RadioGroupItem id="role-tutor" value="tutor" />
                        <span>Репетитор</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
                        <RadioGroupItem id="role-parent" value="parent" />
                        <span>Родитель</span>
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
                    <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-ink">
                      {registerError}
                    </div>
                  ) : null}

                  <Button
                    className="mt-2 h-11 w-full rounded-full"
                    disabled={submitMode === "register"}
                    type="submit"
                  >
                    {submitMode === "register" ? "Создаём аккаунт..." : "Зарегистрироваться"}
                  </Button>
                </form>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </div>
  );
}
