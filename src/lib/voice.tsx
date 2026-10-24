"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "./useEngine";

// Read-aloud for Ask Progga: one shared <audio> element plays Progga's replies
// in order. The first clip streams from the API (speaking starts fast); the
// rest of the queue downloads in the background so there are no gaps.

export const VOICE_RATES = [0.85, 1, 1.2] as const;
export type VoiceRate = (typeof VOICE_RATES)[number];

const ENABLED_KEY = "progga_voice";
const RATE_KEY = "progga_voice_rate";

interface VoiceCtx {
  /** the backend can speak (OpenAI key configured) */
  available: boolean;
  /** the student switched read-aloud on (off by default) */
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  /** counts the student's own clicks on the switch (not the saved setting loading) */
  toggles: number;
  rate: VoiceRate;
  setRate: (r: VoiceRate) => void;
  /** message currently being spoken, or loading to be spoken */
  speakingId: string | null;
  loadingId: string | null;
  /** read these messages one after another (replaces anything queued) */
  speak: (sessionId: string, messageIds: string[]) => void;
  stop: () => void;
}

const Ctx = createContext<VoiceCtx | null>(null);

const speechUrl = (sessionId: string, messageId: string) => `/api/tutor/sessions/${sessionId}/messages/${messageId}/speech`;

function readStore<T>(key: string, parse: (v: string) => T | undefined, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return parse(v) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the setting just won't persist */
  }
}

export function VoiceProvider({ children, onError }: { children: React.ReactNode; onError?: () => void }) {
  const { voice: available } = useEngine();
  const [enabled, setEnabledState] = useState(false);
  const [toggles, setToggles] = useState(0);
  const [rate, setRateState] = useState<VoiceRate>(1);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const audio = useRef<HTMLAudioElement | null>(null);
  const queue = useRef<{ sessionId: string; id: string }[]>([]);
  const blobs = useRef(new Map<string, Promise<string | null>>());
  const rateRef = useRef<VoiceRate>(1);
  const generation = useRef(0); // bumps on stop/replace so stale callbacks do nothing

  useEffect(() => {
    setEnabledState(readStore(ENABLED_KEY, (v) => v === "1", false));
    const r = readStore(RATE_KEY, (v) => VOICE_RATES.find((x) => String(x) === v), 1 as VoiceRate);
    setRateState(r);
    rateRef.current = r;
  }, []);

  const player = useCallback(() => {
    if (!audio.current) audio.current = new Audio();
    return audio.current;
  }, []);

  /** Downloads a clip in the background (used for everything after the first in the queue). */
  const prefetch = useCallback((sessionId: string, id: string) => {
    if (blobs.current.has(id)) return;
    blobs.current.set(
      id,
      fetch(speechUrl(sessionId, id), { credentials: "include" })
        .then((r) => (r.ok ? r.blob() : null))
        .then((b) => (b ? URL.createObjectURL(b) : null))
        .catch(() => null),
    );
  }, []);

  const playNext = useCallback(async () => {
    const gen = generation.current;
    const next = queue.current.shift();
    if (!next) {
      setSpeakingId(null);
      setLoadingId(null);
      return;
    }
    queue.current.forEach((q) => prefetch(q.sessionId, q.id));

    const el = player();
    setSpeakingId(null);
    setLoadingId(next.id);
    const cached = blobs.current.has(next.id) ? await blobs.current.get(next.id) : null;
    if (gen !== generation.current) return;
    el.src = cached ?? speechUrl(next.sessionId, next.id);
    el.playbackRate = rateRef.current;
    el.onplaying = () => gen === generation.current && (setSpeakingId(next.id), setLoadingId(null));
    el.onended = () => gen === generation.current && void playNext();
    el.onerror = () => {
      if (gen !== generation.current) return;
      onError?.();
      void playNext();
    };
    try {
      await el.play();
    } catch {
      // autoplay blocked or aborted: stop quietly, the student can press play
      if (gen === generation.current) {
        queue.current = [];
        setSpeakingId(null);
        setLoadingId(null);
      }
    }
  }, [player, prefetch, onError]);

  const stop = useCallback(() => {
    generation.current++;
    queue.current = [];
    const el = audio.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setSpeakingId(null);
    setLoadingId(null);
  }, []);

  const speak = useCallback(
    (sessionId: string, messageIds: string[]) => {
      if (!available || !messageIds.length) return;
      stop();
      queue.current = messageIds.map((id) => ({ sessionId, id }));
      void playNext();
    },
    [available, stop, playNext],
  );

  const setEnabled = useCallback(
    (v: boolean) => {
      setEnabledState(v);
      setToggles((n) => n + 1);
      writeStore(ENABLED_KEY, v ? "1" : "0");
      if (!v) stop();
    },
    [stop],
  );

  const setRate = useCallback((r: VoiceRate) => {
    setRateState(r);
    rateRef.current = r;
    writeStore(RATE_KEY, String(r));
    if (audio.current) audio.current.playbackRate = r;
  }, []);

  // stop talking when leaving Ask Progga; free downloaded clips
  useEffect(
    () => () => {
      generation.current++;
      audio.current?.pause();
      blobs.current.forEach((p) => p.then((u) => u && URL.revokeObjectURL(u)));
    },
    [],
  );

  const value = useMemo<VoiceCtx>(
    () => ({ available, enabled: available && enabled, setEnabled, toggles, rate, setRate, speakingId, loadingId, speak, stop }),
    [available, enabled, setEnabled, toggles, rate, setRate, speakingId, loadingId, speak, stop],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVoice() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVoice must be used inside VoiceProvider");
  return ctx;
}

/** For components used both inside and outside Ask Progga (e.g. guardian transcripts). */
export const useOptionalVoice = () => useContext(Ctx);
