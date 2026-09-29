import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { trackGoal } from "../lib/analytics";
import { getErrorMessage } from "../lib/errors";
import { getHomePathForRole } from "../lib/routes";

type VerifyState = "loading" | "success" | "error";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [state, setState] = useState<VerifyState>("loading");
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;

    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setError("Ссылка повреждена — не найден токен подтверждения.");
      return;
    }

    verifyEmail(token)
      .then((user) => {
        setState("success");
        trackGoal("email_verified", { role: user.role });
        setTimeout(() => {
          navigate(getHomePathForRole(user.role), { replace: true });
        }, 1500);
      })
      .catch((err) => {
        setState("error");
        setError(getErrorMessage(err, "Не удалось подтвердить почту."));
      });
  }, [searchParams, verifyEmail, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,var(--warm)_0%,var(--panel-blue)_100%)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-float">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-quiet">
          Онлайн-платформа
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">МЕТРИКА</h1>

        <div className="mt-8">
          {state === "loading" ? (
            <p className="text-sm text-muted-foreground">Подтверждаем почту...</p>
          ) : null}

          {state === "success" ? (
            <>
              <p className="text-lg font-semibold text-success-foreground">
                Почта подтверждена!
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Переходим в личный кабинет...
              </p>
            </>
          ) : null}

          {state === "error" ? (
            <>
              <p className="text-lg font-semibold text-danger-foreground">
                Не получилось подтвердить почту
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Link
                className="mt-6 inline-block text-sm font-medium text-foreground underline"
                to="/"
              >
                Вернуться на страницу входа
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
