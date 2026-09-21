import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../auth/AuthContext";
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Онлайн-платформа
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">МЕТРИКА</h1>

        <div className="mt-8">
          {state === "loading" ? (
            <p className="text-sm text-slate-500">Подтверждаем почту...</p>
          ) : null}

          {state === "success" ? (
            <>
              <p className="text-lg font-semibold text-emerald-700">
                Почта подтверждена!
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Переходим в личный кабинет...
              </p>
            </>
          ) : null}

          {state === "error" ? (
            <>
              <p className="text-lg font-semibold text-red-700">
                Не получилось подтвердить почту
              </p>
              <p className="mt-2 text-sm text-slate-500">{error}</p>
              <Link
                className="mt-6 inline-block text-sm font-medium text-slate-900 underline"
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
