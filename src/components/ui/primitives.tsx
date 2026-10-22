import clsx from "clsx";
import { Loader2 } from "lucide-react";

export function ProgressBar({
  value,
  className,
  color = "bg-grape-500",
  track = "bg-grape-100",
  height = "h-3",
}: {
  value: number;
  className?: string;
  color?: string;
  track?: string;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={clsx("w-full overflow-hidden rounded-full", track, height, className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx("relative h-full rounded-full transition-[width] duration-700 ease-out", color)} style={{ width: `${pct}%` }}>
        <span className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/35" />
      </div>
    </div>
  );
}

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 size={size} className={clsx("animate-spin", className)} />;
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex items-center gap-3 font-display text-lg font-bold text-ink-soft">
        <Spinner className="text-grape-500" /> {label}
      </div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-3 text-xl font-extrabold">{title}</h3>
      <p className="mt-1 max-w-sm text-ink-soft">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div className="rounded-2xl border-2 border-coral-100 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600" role="alert">
      {message}
    </div>
  );
}

export function SubjectIcon({ icon, color, size = 44 }: { icon: string; color: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-2xl"
      style={{ width: size, height: size, background: `${color}1f`, fontSize: size * 0.5 }}
    >
      {icon}
    </span>
  );
}
