import { api } from "./api";
import type { StartResult } from "./types";

export function startTutorSession(question: string, subject: string, image?: File | null) {
  const form = new FormData();
  form.set("question", question);
  form.set("subject", subject);
  if (image) form.set("image", image);
  return api<StartResult>("/tutor/sessions", { form });
}

export const EXAMPLES_BN: Record<string, string[]> = {
  math: ["3x + 5 = 20 সমাধান করো", "47 + 38 কত?", "ত্রিভুজের ক্ষেত্রফল কীভাবে বের করব?"],
  science: ["বজ্রপাতের আগে বিদ্যুৎ চমকানো দেখি কেন?", "উদ্ভিদ কীভাবে খাদ্য তৈরি করে?", "বরফ পানিতে ভাসে কেন?"],
  english: ["'a' আর 'an' কখন ব্যবহার করব?", "Passive করো: Rina wrote a letter", "Pronoun কী?"],
  bangla: ["সন্ধি কাকে বলে?", "'বিদ্যালয়' এর সন্ধি বিচ্ছেদ কী?"],
  physics: ["একটি গাড়ি 5 সেকেন্ডে 100 মিটার যায়। বেগ কত?", "বল নিচে পড়ে কেন?"],
  chemistry: ["NaCl আয়নিক যৌগ কেন?", "সমতা বিধান করো: H2 + O2 → H2O"],
  biology: ["মাইটোকন্ড্রিয়াকে কোষের শক্তিঘর বলে কেন?", "রক্ত কীভাবে সঞ্চালিত হয়?"],
  "higher-math": ["x³ + 2x এর অন্তরজ নির্ণয় করো", "লিমিট কী?"],
  ict: ["বাইনারি 1010 কে দশমিকে রূপান্তর করো", "CPU কী কাজ করে?"],
  bgs: ["২১ ফেব্রুয়ারি কেন গুরুত্বপূর্ণ?", "বাংলাদেশের রাজধানী কোথায়?"],
};

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
