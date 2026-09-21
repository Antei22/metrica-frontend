import type { PropsWithChildren, ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface AppLayoutProps extends PropsWithChildren {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function AppLayout({
  title,
  description,
  actions,
  children,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-soft sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-quiet">
              МЕТРИКА
            </p>
            <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
            {typeof description === "string" ? (
              <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : (
              description
            )}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}
