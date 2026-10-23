import clsx from "clsx";

/** The Progga mark: a friendly robot head with a banana antenna 🍌 */
export function ProggaMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <line x1="32" y1="14" x2="32" y2="21" stroke="#2B7BE8" strokeWidth="3" strokeLinecap="round" />
      <path d="M18.5 8.5 Q31 21 45.5 5 Q32 13.5 18.5 8.5 Z" fill="#FFD43B" stroke="#E5A800" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M23 10.6 Q31 16 40.5 8.6" fill="none" stroke="#FFF1A8" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="45.3" y1="5.2" x2="47.8" y2="2.8" stroke="#7A4E1D" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="18.7" cy="8.6" r="1" fill="#7A4E1D" />
      <rect x="5" y="33" width="6" height="12" rx="3" fill="#FFD43B" />
      <rect x="53" y="33" width="6" height="12" rx="3" fill="#FFD43B" />
      <rect x="9" y="20" width="46" height="38" rx="14" fill="#2B7BE8" />
      <ellipse cx="20" cy="25.5" rx="7" ry="3" fill="#FFFFFF" opacity="0.18" />
      <rect x="15" y="27" width="34" height="22" rx="10" fill="#0F1E3D" />
      <rect x="21.5" y="32" width="6" height="8" rx="3" fill="#7CF5D4" />
      <rect x="36.5" y="32" width="6" height="8" rx="3" fill="#7CF5D4" />
      <path d="M27.5 43 Q32 46.5 36.5 43" fill="none" stroke="#7CF5D4" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16.5" cy="52.5" r="2.4" fill="#FF8FA3" opacity="0.85" />
      <circle cx="47.5" cy="52.5" r="2.4" fill="#FF8FA3" opacity="0.85" />
    </svg>
  );
}

export function Logo({ size = 40, className, light = false }: { size?: number; className?: string; light?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)} aria-label="Progga AI">
      <ProggaMark size={size} />
      <span
        className={clsx("font-display font-extrabold tracking-tight leading-none", light ? "text-white" : "text-ink")}
        style={{ fontSize: size * 0.62 }}
      >
        progga
      </span>
      <span
        className="rounded-lg bg-banana-400 px-1.5 py-0.5 font-display font-extrabold leading-none text-ink"
        style={{ fontSize: size * 0.4 }}
      >
        AI
      </span>
    </span>
  );
}
