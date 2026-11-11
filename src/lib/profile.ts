import type { Profile, Role, User } from "./types";

// Mirror of the backend's profileChecklist (modules/users/profile.ts), so the
// completion ring moves live while someone types. The server's number is the
// one that counts (and pays out the coin reward).

export type ItemId = "name" | "class" | "photo" | "birthdate" | "bio" | "school" | "district" | "father" | "mother" | "guardian" | "mobile" | "relation" | "occupation" | "subjects";

export interface ProfileDraft {
  name: string;
  grade: number | null;
  birthdate: string;
  email: string;
  phone: string;
  profile: Profile;
}

const has = (v?: string | null) => !!v && v.trim().length > 0;

export function checklist(role: Role, d: ProfileDraft, hasPhoto: boolean): { id: ItemId; done: boolean }[] {
  const p = d.profile;
  if (role === "STUDENT") {
    return [
      { id: "name", done: has(d.name) },
      { id: "class", done: !!d.grade },
      { id: "photo", done: hasPhoto },
      { id: "birthdate", done: has(d.birthdate) },
      { id: "bio", done: has(p.bio) },
      { id: "school", done: has(p.schoolName) },
      { id: "district", done: has(p.district) },
      { id: "father", done: has(p.fatherName) },
      { id: "mother", done: has(p.motherName) },
      { id: "guardian", done: has(p.guardianName) && has(p.guardianRelation) && isMobile(p.guardianPhone ?? "") },
    ];
  }
  const common: { id: ItemId; done: boolean }[] = [
    { id: "name", done: has(d.name) },
    { id: "photo", done: hasPhoto },
    { id: "mobile", done: isMobile(d.phone) },
    { id: "bio", done: has(p.bio) },
    { id: "district", done: has(p.district) },
  ];
  if (role === "TEACHER") return [...common, { id: "school", done: has(p.schoolName) }, { id: "subjects", done: has(p.subjects) }];
  return [...common, { id: "relation", done: has(p.relation) }, { id: "occupation", done: has(p.occupation) }];
}

export const percentOf = (items: { done: boolean }[]) => Math.round((items.filter((i) => i.done).length / items.length) * 100);

export const isMobile = (v: string) => /^(?:\+?88)?01[3-9]\d{8}$/.test(v.trim().replace(/[\s-]/g, ""));
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** "+8801712345678" → "01712345678" (how people write it in Bangladesh). */
export const localMobile = (v?: string | null) => (v ? v.replace(/^\+88/, "") : "");

export function draftFrom(user: User): ProfileDraft {
  const p = user.profile ?? {};
  return {
    name: user.name,
    grade: user.grade,
    birthdate: user.birthdate ?? "",
    email: user.email ?? "",
    phone: localMobile(user.phone),
    profile: { ...p, guardianPhone: localMobile(p.guardianPhone) || undefined },
  };
}

/** Center-crops a picture to a square and shrinks it, so uploads stay tiny. */
export async function squarePhoto(file: File, size = 400): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't encode"))), "image/jpeg", 0.86));
}

/** Scrolls to a profile field (#f-school…), focuses it and flashes it. */
export function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
  el.classList.remove("field-flash");
  void el.offsetWidth; // restart the animation
  el.classList.add("field-flash");
}
