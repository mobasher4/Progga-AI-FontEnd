// Records Progga's short reaction sounds ("Mm-hmm!", "Wow!"…) with the same
// OpenAI voice the backend uses for read-aloud, into public/sounds/reactions.
//
//   OPENAI_API_KEY=sk-… node scripts/make-reaction-sounds.mjs
//
// Re-run after changing src/lib/reaction-lines.json. Existing files are skipped
// unless --force is passed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lines = JSON.parse(readFileSync(join(root, "src/lib/reaction-lines.json"), "utf8"));
const out = join(root, "public/sounds/reactions");
const key = process.env.OPENAI_API_KEY;
const base = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const model = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
const voice = process.env.OPENAI_TTS_VOICE ?? "coral"; // keep in step with the backend's read-aloud voice
const force = process.argv.includes("--force");

if (!key) {
  console.error("Set OPENAI_API_KEY first.");
  process.exit(1);
}

const persona =
  "Identity: a 10-year-old child: Progga, the cheerful robot buddy of a school student in Bangladesh. You ARE a kid, not an adult doing a voice. " +
  "Pitch: high and light, like a young child. Unhurried (the app plays it a little faster). This is a tiny spoken reaction, not a sentence to read: " +
  "make it sound natural and expressive, at full volume and well projected.";

for (const [name, entry] of Object.entries(lines)) {
  for (const lang of ["en", "bn"]) {
    mkdirSync(join(out, lang), { recursive: true });
    for (const [i, text] of entry[lang].entries()) {
      const file = join(out, lang, `${name}-${i}.mp3`);
      if (existsSync(file) && !force) continue;
      const res = await fetch(`${base}/audio/speech`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          voice,
          input: text,
          instructions: `${persona} Tone: ${entry.how}.${lang === "bn" ? " Speak natural Bangladeshi Bangla." : ""}`,
          response_format: "mp3",
        }),
      });
      if (!res.ok) {
        console.error(`✗ ${lang}/${name}-${i}: ${res.status} ${(await res.text()).slice(0, 200)}`);
        process.exitCode = 1;
        continue;
      }
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`✓ ${lang}/${name}-${i}.mp3  "${text}"`);
    }
  }
}
