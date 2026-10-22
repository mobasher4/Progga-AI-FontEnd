export function duration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}:${String(s).padStart(2, "0")}` : `0:${String(s).padStart(2, "0")}`;
}

export function gradeLabel(grade: number | null | undefined): string {
  if (!grade) return "";
  if (grade >= 11) return `Class ${grade} · HSC`;
  if (grade >= 9) return `Class ${grade} · SSC`;
  return `Class ${grade}`;
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const firstName = (name?: string) => name?.split(" ")[0] ?? "";

export const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
