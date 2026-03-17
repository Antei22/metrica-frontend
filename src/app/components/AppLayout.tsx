import type { PropsWithChildren, ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface AppLayoutProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AppLayout({
  title,
  description,
  actions,
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              Metrica
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
            {description ? (
              <p className="max-w-2xl text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}
