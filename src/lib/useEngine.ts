"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

interface Health {
  llm: { provider: string; model: string; vision: boolean };
  /** Progga can read its replies aloud */
  voice?: boolean;
  /** playback speed-up that makes the current voice engine sound like a kid */
  voiceLift?: number;
}

/** Which AI engine the backend runs, and what it can do (read homework photos, speak). */
export function useEngine() {
  const { data } = useSWR<Health>("/health", { revalidateOnFocus: false, dedupingInterval: 60_000 });
  return { provider: data?.llm.provider, model: data?.llm.model, vision: data?.llm.vision ?? false, voice: data?.voice ?? false, voiceLift: data?.voiceLift ?? 1.12, loaded: !!data };
}

/** An AI model the student can pick in the chat. */
export interface EngineChoice {
  id: string;
  provider: string;
  model: string;
  label: string;
  vision: boolean;
  isDefault: boolean;
}

const ENGINE_KEY = "progga.engine";
const ENGINE_EVENT = "progga:engine";

/** The model this student picked (saved in this browser), sent with every tutor request. */
export function storedEngine(): string | undefined {
  try {
    return localStorage.getItem(ENGINE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Which AI models the student can choose from, and their current pick. */
export function useEngineChoice() {
  const { data } = useSWR<{ engines: EngineChoice[] }>("/tutor/engines", { revalidateOnFocus: false, dedupingInterval: 60_000 });
  const [picked, setPicked] = useState<string | undefined>(undefined);
  useEffect(() => {
    setPicked(storedEngine());
    // keep every picker on the page in step
    const sync = () => setPicked(storedEngine());
    window.addEventListener(ENGINE_EVENT, sync);
    return () => window.removeEventListener(ENGINE_EVENT, sync);
  }, []);

  const engines = data?.engines ?? [];
  const current = engines.find((e) => e.id === picked) ?? engines.find((e) => e.isDefault) ?? engines[0];
  const choose = (id: string) => {
    try {
      localStorage.setItem(ENGINE_KEY, id);
    } catch {
      /* private mode: the pick lasts until reload */
    }
    setPicked(id);
    window.dispatchEvent(new Event(ENGINE_EVENT));
  };
  return { engines, current, choose };
}
