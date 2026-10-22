import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  Crown,
  Flame,
  HeartHandshake,
  Lightbulb,
  MessageCircleQuestion,
  PlayCircle,
  ShieldCheck,
  Swords,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ProggaBot } from "@/components/brand/ProggaBot";

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      <Nav />
      <Hero />
      <Compare />
      <HowItWorks />
      <Features />
      <Levels />
      <Safety />
      <ParentsCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Logo size={36} />
        <nav className="hidden items-center gap-8 font-display font-bold text-ink-soft md:flex">
          <a href="#how" className="hover:text-grape-600">How it works</a>
          <a href="#features" className="hover:text-grape-600">Features</a>
          <a href="#safety" className="hover:text-grape-600">Safety</a>
          <a href="#parents" className="hover:text-grape-600">Parents & teachers</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
          <Link href="/signup" className="btn-primary btn-sm">Start free</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="bg-dots absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -right-32 -top-32 -z-10 h-[520px] w-[520px] rounded-full bg-banana-200/50 blur-3xl" />
      <div className="absolute -left-40 top-40 -z-10 h-[420px] w-[420px] rounded-full bg-grape-200/40 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <span className="chip border-grape-100 bg-white text-grape-600">
            <span className="h-2 w-2 rounded-full bg-mint-500" /> For Class 3 to HSC · English & বাংলা
          </span>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.2rem]">
            The AI tutor that helps kids{" "}
            <span className="relative inline-block text-grape-500">
              think
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden>
                <path d="M3 10 Q100 -2 197 9" stroke="#FFD43B" strokeWidth="8" strokeLinecap="round" fill="none" />
              </svg>
            </span>
            , not copy.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Progga never dumps answers. It breaks every problem into tiny steps, asks the student back, gives hints when they&apos;re
            stuck and explains <b className="text-ink">why</b> each move works. So every answer is truly theirs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary text-lg">
              Start learning free <ArrowRight size={20} />
            </Link>
            <Link href="/signup?role=PARENT" className="btn-ghost text-lg">I&apos;m a parent / teacher</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-ink-soft">
            {["No answer dumping", "Kid-safe by design", "Progress reports for parents"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-mint-100 text-mint-600"><Check size={13} strokeWidth={3} /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -left-6 top-6 z-10 hidden sm:block">
        <ProggaBot size={130} mood="talking" />
      </div>
      <div className="card relative ml-auto w-full p-5 shadow-lift sm:w-[88%]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">Mission · Algebra</p>
            <p className="font-display text-lg font-extrabold">Solve for the mystery number</p>
          </div>
          <span className="chip border-banana-200 bg-banana-50 text-banana-700">Step 2/3</span>
        </div>
        <div className="mb-4 flex gap-1.5">
          <span className="h-2 flex-1 rounded-full bg-mint-500" />
          <span className="h-2 flex-1 rounded-full bg-grape-500" />
          <span className="h-2 flex-1 rounded-full bg-grape-100" />
        </div>
        <div className="space-y-2.5 text-[15px]">
          <Bubble me>Solve 3x + 5 = 20</Bubble>
          <Bubble>Let&apos;s crack it together ⚖️ First, which letter are we trying to find?</Bubble>
          <Bubble me>x</Bubble>
          <div className="rounded-2xl border-2 border-mint-100 bg-mint-50 px-3.5 py-2.5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-mint-600">🧠 Why it works</p>
            <p className="mt-0.5 text-ink-soft">Naming the unknown tells us our mission: get x all alone.</p>
          </div>
          <Bubble question>To undo the +5, what is 20 − 5?</Bubble>
        </div>
      </div>
      <div className="absolute -right-3 -top-5 animate-float rounded-2xl bg-grape-500 px-3.5 py-2 font-display font-extrabold text-white shadow-lift">⭐ +15 XP</div>
      <div className="absolute -bottom-5 left-4 animate-float rounded-2xl bg-white px-3.5 py-2 font-display font-extrabold text-coral-600 shadow-lift [animation-delay:1.2s]">
        🔥 4-day streak
      </div>
    </div>
  );
}

function Bubble({ children, me, question }: { children: React.ReactNode; me?: boolean; question?: boolean }) {
  if (me) return <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-grape-500 px-3.5 py-2 font-semibold text-white">{children}</div>;
  return (
    <div className={`w-fit max-w-[88%] rounded-2xl rounded-bl-md px-3.5 py-2 ${question ? "border-2 border-banana-300 bg-banana-50" : "bg-cream"}`}>
      {question && <p className="text-xs font-extrabold uppercase tracking-wider text-banana-700">Your turn</p>}
      {children}
    </div>
  );
}

function Compare() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Why Progga is different</p>
        <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">Answers don&apos;t teach. Thinking does.</h2>
        <p className="mt-4 text-lg text-ink-soft">
          When students paste homework into a regular chatbot, they get a perfect answer and learn nothing. Progga is built the other way round.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="card p-7 opacity-90">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral-100 text-coral-600"><X strokeWidth={3} size={20} /></span>
            <h3 className="text-2xl font-extrabold">Typical AI chatbot</h3>
          </div>
          <div className="mt-5 rounded-2xl bg-cream p-4 font-mono text-sm text-ink-soft">
            3x + 5 = 20<br />3x = 15<br />x = 5 ✅ <span className="text-ink-muted">// copied into notebook</span>
          </div>
          <ul className="mt-5 space-y-2.5 text-ink-soft">
            {["Hands over the full solution instantly", "Student copies, understanding stays at zero", "Same mistake again in the exam hall"].map((t) => (
              <li key={t} className="flex gap-2"><X size={18} className="mt-0.5 shrink-0 text-coral-500" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="card relative overflow-hidden border-2 border-grape-200 p-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-banana-200/60 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-mint-100 text-mint-600"><Check strokeWidth={3} size={20} /></span>
            <h3 className="text-2xl font-extrabold">Progga AI</h3>
          </div>
          <ol className="relative mt-5 space-y-2 text-sm">
            {["Which letter are we finding?", "What undoes the +5?", "What number × 3 gives 15?"].map((t, i) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-grape-50 px-3.5 py-2.5 font-semibold">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-grape-500 text-xs font-extrabold text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <ul className="relative mt-5 space-y-2.5 text-ink-soft">
            {["Breaks problems into micro-steps the student solves", "3-level hints instead of answers when stuck", "Explains the why behind every step"].map((t) => (
              <li key={t} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-mint-500" />{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: MessageCircleQuestion, title: "Ask anything", text: "Type a question or snap a photo of your homework, in English or Bangla.", color: "bg-grape-500" },
    { icon: Lightbulb, title: "Progga plans tiny steps", text: "It quietly maps the method into micro-steps sized for your class.", color: "bg-banana-500" },
    { icon: HeartHandshake, title: "You solve each step", text: "Progga asks, you answer. Stuck? Unlock a hint. Wrong? It finds the misconception.", color: "bg-mint-500" },
    { icon: Crown, title: "Understand & level up", text: "See why it works, earn XP, keep your streak and try a similar problem alone.", color: "bg-coral-500" },
  ];
  return (
    <section id="how" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">A learning path for every question</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-3xl border border-line bg-cream p-6">
              <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-ink/5">{i + 1}</span>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl text-white ${s.color}`}><s.icon size={24} /></span>
              <h3 className="mt-5 text-xl font-extrabold">{s.title}</h3>
              <p className="mt-2 text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: MessageCircleQuestion, title: "Socratic AI tutor", text: "Guided questions, hint ladders and the reason behind every step. Never a copy-paste answer.", tint: "bg-grape-50 text-grape-600" },
    { icon: Camera, title: "Snap a photo", text: "Photograph a problem from your textbook. Progga reads it and starts the guided path.", tint: "bg-sky-50 text-sky-600" },
    { icon: PlayCircle, title: "Video lessons", text: "Short lessons that pause for checkpoint questions, so watching becomes doing.", tint: "bg-coral-50 text-coral-600" },
    { icon: Swords, title: "Quiz Arena", text: "Timed rounds with combos, hearts and instant explanations. Practice that feels like a game.", tint: "bg-banana-50 text-banana-700" },
    { icon: Flame, title: "Quests & streaks", text: "Daily quests, XP, levels and badges reward effort and independent thinking.", tint: "bg-coral-50 text-coral-600" },
    { icon: Crown, title: "Robot skins", text: "Earn Kola coins 🍌 and customise your Progga robot. Mango, Galaxy, Ninja and more.", tint: "bg-mint-50 text-mint-600" },
    { icon: Users, title: "Parent & teacher insights", text: "Independence score, weak topics, misconceptions and safety alerts in one place.", tint: "bg-grape-50 text-grape-600" },
    { icon: ShieldCheck, title: "Safe by design", text: "Content filters, personal info hidden, wellbeing support and daily limits.", tint: "bg-mint-50 text-mint-600" },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Everything in one place</p>
        <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">Learning that feels like play</h2>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card p-6 transition-transform hover:-translate-y-1">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${f.tint}`}><f.icon size={24} /></span>
            <h3 className="mt-4 text-lg font-extrabold">{f.title}</h3>
            <p className="mt-1.5 text-[15px] text-ink-soft">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Levels() {
  const bands = [
    { range: "Class 3–5", name: "Explorers", text: "Tiny steps, simple words, real-life objects.", color: "from-banana-300 to-banana-500", mood: "happy" as const },
    { range: "Class 6–8", name: "Adventurers", text: "Building blocks of algebra, science and grammar.", color: "from-mint-400 to-mint-600", mood: "talking" as const },
    { range: "Class 9–10", name: "SSC Challengers", text: "Correct terms, exam-ready methods.", color: "from-sky-400 to-sky-600", mood: "thinking" as const },
    { range: "Class 11–12", name: "HSC Scholars", text: "Precise notation and deeper reasoning.", color: "from-grape-400 to-grape-700", mood: "idle" as const },
  ];
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Grows with every student</p>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">From first fractions to HSC calculus</h2>
          <p className="mt-4 text-lg text-ink-soft">Progga adapts its language, step size and depth to each class, following the NCTB curriculum.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bands.map((b) => (
            <div key={b.name} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${b.color} p-6 text-white`}>
              <p className="text-sm font-extrabold uppercase tracking-wider opacity-80">{b.range}</p>
              <h3 className="mt-1 text-2xl font-extrabold">{b.name}</h3>
              <p className="mt-2 max-w-[13rem] text-white/90">{b.text}</p>
              <div className="pointer-events-none absolute -bottom-4 -right-3 opacity-95">
                <ProggaBot size={90} mood={b.mood} float={false} />
              </div>
              <div className="h-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Safety() {
  const items = [
    ["Never hands over full solutions", "The final answer stays hidden on our servers until the student gets there."],
    ["Personal info protection", "Phone numbers and emails are automatically hidden before anything reaches the AI."],
    ["Age-appropriate filters", "Unsafe or off-topic requests are gently redirected back to learning."],
    ["Wellbeing first", "If a student seems upset, Progga responds with care and points them to a trusted adult. Parents get an alert."],
    ["Healthy limits", "Daily problem limits that parents can adjust, plus a nudge to take breaks."],
    ["Photos never stored", "Homework photos are read once in memory and never saved."],
  ];
  return (
    <section id="safety" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="eyebrow">Safety & trust</p>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">Built for kids. Trusted by parents.</h2>
          <p className="mt-4 text-lg text-ink-soft">
            AI for children needs more rules, not fewer. Every conversation passes through guardrails before and after the AI thinks.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-3xl bg-mint-50 px-5 py-4">
            <ShieldCheck className="text-mint-600" size={28} />
            <span className="font-display text-lg font-bold text-mint-700">Guardrails on every message</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(([t, d]) => (
            <div key={t} className="card p-5">
              <p className="flex items-center gap-2 font-display text-lg font-extrabold"><Check size={18} className="text-mint-500" strokeWidth={3} />{t}</p>
              <p className="mt-1.5 text-[15px] text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ParentsCta() {
  return (
    <section id="parents" className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-grape-600 via-grape-500 to-grape-700 px-8 py-14 text-white sm:px-14">
        <div className="bg-dots absolute inset-0 opacity-30" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-banana-300">For parents & teachers</p>
            <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">See how your child thinks, not just what they score.</h2>
            <p className="mt-4 max-w-xl text-lg text-grape-100">
              Link with your child&apos;s code to see their independence score, topics they find tricky, common misconceptions and full tutor
              transcripts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup?role=PARENT" className="btn-banana text-lg">Create a parent account</Link>
              <Link href="/signup?role=TEACHER" className="btn bg-white/15 text-white hover:bg-white/25">I&apos;m a teacher</Link>
            </div>
          </div>
          <div className="flex justify-center">
            <ProggaBot size={210} mood="happy" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo size={30} />
        <p className="text-sm text-ink-muted">© {new Date().getFullYear()} Progga AI · প্রজ্ঞা means wisdom · Made with 🍌 in Bangladesh</p>
      </div>
    </footer>
  );
}
