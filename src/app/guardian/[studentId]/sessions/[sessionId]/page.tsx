"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import useSWR from "swr";
import { ChatMessage } from "@/components/tutor/ChatMessage";
import { PageLoader } from "@/components/ui/primitives";
import type { TutorMessage } from "@/lib/types";

interface Transcript {
  session: { id: string; title: string; topic: string; status: string; problemText: string; hintsUsed: number; messages: TutorMessage[] };
}

export default function TranscriptPage({ params }: { params: Promise<{ studentId: string; sessionId: string }> }) {
  const { studentId, sessionId } = use(params);
  const { data } = useSWR<Transcript>(`/guardian/students/${studentId}/sessions/${sessionId}`);
  if (!data) return <PageLoader />;
  const s = data.session;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/guardian/${studentId}`} className="inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft size={18} /> Back to report
      </Link>
      <div className="card p-6">
        <p className="eyebrow">Read-only transcript</p>
        <h1 className="mt-1 text-3xl font-extrabold">{s.title}</h1>
        <p className="text-ink-soft">{s.topic} · {s.status} · {s.hintsUsed} hints used</p>
      </div>
      <div className="card space-y-3 bg-cream/50 p-4 sm:p-6">
        {s.messages.map((m) => (
          <div key={m.id}>
            <ChatMessage m={m} />
            {typeof m.meta.misconception === "string" && (
              <p className="ml-12 mt-1 text-xs font-bold text-banana-700">🔎 Teacher note: {m.meta.misconception}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
