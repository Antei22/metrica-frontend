// Обёртка над Яндекс.Метрикой: подгружает счётчик только если задан
// VITE_YANDEX_METRIKA_ID, шлёт просмотры страниц при переходах в SPA
// и позволяет размечать ключевые клики/конверсии как цели.

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...rest: unknown[]) => void;
  }
}

const COUNTER_ID_RAW = import.meta.env.VITE_YANDEX_METRIKA_ID as string | undefined;
const COUNTER_ID = COUNTER_ID_RAW ? Number(COUNTER_ID_RAW) : null;

let isInitialized = false;

export function initMetrika(): void {
  if (!COUNTER_ID || isInitialized || typeof window === "undefined") {
    return;
  }
  isInitialized = true;

  /* eslint-disable */
  (function (m: any, e: Document, t: string, r: string, i: string) {
    m[i] =
      m[i] ||
      function (...args: unknown[]) {
        (m[i].a = m[i].a || []).push(args);
      };
    m[i].l = Date.now();
    for (let j = 0; j < e.scripts.length; j++) {
      if (e.scripts[j].src === r) return;
    }
    const script = e.createElement(t) as HTMLScriptElement;
    const firstScript = e.getElementsByTagName(t)[0];
    script.async = true;
    script.src = r;
    firstScript.parentNode?.insertBefore(script, firstScript);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  /* eslint-enable */

  window.ym?.(COUNTER_ID, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

/** Вызывать при каждой смене маршрута — SPA не даёт полных перезагрузок,
 * поэтому стандартный сниппет их не увидит сам по себе. */
export function trackPageView(path: string): void {
  if (!COUNTER_ID) return;
  window.ym?.(COUNTER_ID, "hit", path);
}

/** Разметка кликов/конверсий по названию цели (заводится в кабинете Метрики,
 * либо считается и без предварительного создания — просто не будет графиков). */
export function trackGoal(name: string, params?: Record<string, unknown>): void {
  if (!COUNTER_ID) return;
  window.ym?.(COUNTER_ID, "reachGoal", name, params);
}
