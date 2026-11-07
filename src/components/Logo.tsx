/** Brand mark: three soft blocks of different heights, plus the serif wordmark. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden>
      <rect x="2" y="6" width="5" height="14" rx="2.5" fill="#4f7a55" />
      <rect x="8.5" y="2" width="5" height="18" rx="2.5" fill="#a2512f" />
      <rect x="15" y="9" width="5" height="11" rx="2.5" fill="#6c5d9c" />
    </svg>
  );
}

export function Logo({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-lg font-medium tracking-tight">Blockwise</span>
    </span>
  );
}
