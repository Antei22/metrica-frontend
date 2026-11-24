import markUrl from "../../assets/brand/mark.svg";

/** Same mark and wordmark treatment as the selected Metrica landing. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return <span className={`metrica-brand-logo ${className}`}>
    <img src={markUrl} alt="" width="120" height="63" />
    <span>Метрика</span>
  </span>;
}
