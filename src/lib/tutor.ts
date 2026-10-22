import { api } from "./api";
import type { StartResult } from "./types";

export function startTutorSession(question: string, subject: string, image?: File | null) {
  const form = new FormData();
  form.set("question", question);
  form.set("subject", subject);
  if (image) form.set("image", image);
  return api<StartResult>("/tutor/sessions", { form });
}

export const EXAMPLES: Record<string, string[]> = {
  math: ["Solve 3x + 5 = 20", "What is 47 + 38?", "How do I find the area of a triangle?"],
  science: ["Why do we see lightning before thunder?", "How do plants make food?", "What makes ice float?"],
  english: ["When do I use 'a' and 'an'?", "Change to passive: Rina wrote a letter", "What is a pronoun?"],
  bangla: ["সন্ধি কাকে বলে?", "'বিদ্যালয়' এর সন্ধি বিচ্ছেদ কী?"],
  physics: ["A car goes 100 m in 5 s. What is its speed?", "Why does a ball fall down?"],
  chemistry: ["Why is NaCl an ionic compound?", "Balance: H2 + O2 → H2O"],
  biology: ["Why is mitochondria called the powerhouse?", "How does blood circulate?"],
  "higher-math": ["Differentiate x³ + 2x", "What is a limit?"],
  ict: ["Convert 1010 binary to decimal", "What does a CPU do?"],
  bgs: ["Why is 21 February important?", "Why do we have seasons?"],
};
