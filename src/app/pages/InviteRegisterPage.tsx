import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getInvitePreview, registerViaInvite, type InvitePreview } from "../api/auth";
import { getErrorMessage } from "../lib/errors";
import {
  FIELD_LIMITS,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePassword,
} from "../lib/formValidation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const ROLE_LABELS: Record<InvitePreview["role"], string> = {
  student: "Ученик",
  parent: "Родитель",
};

type LoadState = "loading" | "ready" | "invalid";

export function InviteRegisterPage() {
  const { token } = useParams<{ token: string }>();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InvitePreview | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadState("invalid");
      setLoadError("Ссылка повреждена.");
      return;
    }

    getInvitePreview(token)
      .then((preview) => {
        setInvite(preview);
        setLoadState("ready");
      })
      .catch((error) => {
        setLoadError(
          getErrorMessage(error, "Приглашение не найдено или уже недействительно."),
        );
        setLoadState("invalid");
      });
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const validationError =
      validateFirstName(firstName) ||
      validateLastName(lastName) ||
      validateEmail(email) ||
      validatePassword(password);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const trimmedEmail = email.trim();
      await registerViaInvite(token, {
        email: trimmedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setRegisteredEmail(trimmedEmail);
    } catch (error) {
      setFormError(getErrorMessage(error, "Не удалось создать аккаунт."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Онлайн-платформа
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">МЕТРИКА</h1>

          {loadState === "loading" ? (
            <p className="mt-8 text-sm text-slate-500">Проверяем ссылку...</p>
          ) : null}

          {loadState === "invalid" ? (
            <div className="mt-8">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loadError}
              </div>
              <Link
                className="mt-6 inline-block text-sm font-medium text-slate-900 underline"
                to="/"
              >
                Перейти на страницу входа
              </Link>
            </div>
          ) : null}

          {loadState === "ready" && invite ? (
            registeredEmail ? (
              <div className="mt-8 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center">
                <p className="text-base font-semibold text-emerald-900">
                  Почти готово!
                </p>
                <p className="text-sm text-emerald-800">
                  Мы отправили письмо со ссылкой подтверждения на{" "}
                  <span className="font-medium">{registeredEmail}</span>. Перейдите по
                  ней, чтобы войти в аккаунт.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">{invite.tutorName}</span>{" "}
                    приглашает вас как «{ROLE_LABELS[invite.role]}»
                    {invite.studentName ? (
                      <>
                        {" "}
                        к ученику{" "}
                        <span className="font-medium text-slate-900">
                          {invite.studentName}
                        </span>
                      </>
                    ) : null}
                    .
                  </p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="invite-first-name">Имя</Label>
                      <Input
                        id="invite-first-name"
                        maxLength={FIELD_LIMITS.personName}
                        placeholder="Анна"
                        value={firstName}
                        onChange={(event) => {
                          setFirstName(event.target.value);
                          setFormError(null);
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-last-name">Фамилия</Label>
                      <Input
                        id="invite-last-name"
                        maxLength={FIELD_LIMITS.personName}
                        placeholder="Иванова"
                        value={lastName}
                        onChange={(event) => {
                          setLastName(event.target.value);
                          setFormError(null);
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      autoComplete="email"
                      maxLength={FIELD_LIMITS.email}
                      placeholder="you@example.com"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setFormError(null);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-password">Пароль</Label>
                    <Input
                      id="invite-password"
                      autoComplete="new-password"
                      maxLength={FIELD_LIMITS.password}
                      minLength={6}
                      placeholder="Минимум 6 символов"
                      type="password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setFormError(null);
                      }}
                      required
                    />
                  </div>

                  {formError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </div>
                  ) : null}

                  <Button
                    className="mt-2 h-11 w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Создаём аккаунт..." : "Зарегистрироваться"}
                  </Button>
                </form>
              </>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
