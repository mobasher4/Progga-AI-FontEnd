"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { Live } from "@/components/battle/Live";
import { Result } from "@/components/battle/Result";
import { Versus } from "@/components/battle/Versus";
import { useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { type BattleState, serverNow, syncClock } from "@/lib/battle";

export default function BattleRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<BattleState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, rerender] = useState(0);

  useEffect(() => {
    let stop = false;
    const sent = Date.now();
    api<BattleState>(`/battle/${id}`)
      .then((s) => {
        syncClock(s.now, sent);
        if (!stop) setState(s);
      })
      .catch((e) => !stop && setError(errorMessage(e)));
    return () => {
      stop = true;
    };
  }, [id]);

  // swap the VS splash for the battle exactly at the start time
  useEffect(() => {
    if (!state || state.result) return;
    const wait = state.startsAt - serverNow();
    if (wait <= 0) return;
    const timer = setTimeout(() => rerender((x) => x + 1), wait + 250);
    return () => clearTimeout(timer);
  }, [state]);

  const onState = useCallback(
    (s: BattleState) => {
      if (s.result) {
        setState(s);
        void mutate("/auth/me");
        void mutate("/battle/arena");
        void mutate("/me/dashboard");
      }
    },
    [mutate],
  );

  if (error) {
    return (
      <div className="battle-sky fixed inset-0 z-[60] grid place-items-center p-6 text-center text-white">
        <div>
          <p className="font-display text-2xl font-extrabold">{error}</p>
          <button onClick={() => router.push("/battle")} className="btn-glossy btn-glossy-blue mt-6">
            {t("battle.backArena")}
          </button>
        </div>
      </div>
    );
  }
  if (!state) {
    return (
      <div className="battle-sky fixed inset-0 z-[60] grid place-items-center text-white">
        <p className="animate-pulse font-display text-2xl font-extrabold">⚔️ {t("battle.getReady")}</p>
      </div>
    );
  }
  if (state.result) {
    return <Result state={state} onAgain={() => router.push("/battle?go=1")} onExit={() => router.push("/battle")} />;
  }
  if (serverNow() < state.startsAt) {
    return <Versus me={state.me} opponent={state.opponent} startsAt={state.startsAt} />;
  }
  return <Live initial={state} onState={onState} onLeave={() => router.push("/battle")} />;
}
