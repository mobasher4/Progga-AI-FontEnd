"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface PlayerHandle {
  play(): void;
  pause(): void;
  seek(sec: number): void;
  time(): number;
}

interface Props {
  provider: "youtube" | "mp4";
  src: string;
  onTime: (sec: number) => void;
  onEnded?: () => void;
}

// Minimal typing for the YouTube IFrame API we use
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number;
  destroy(): void;
}
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { ENDED: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

/** One player API for both self-hosted mp4 lessons and YouTube lessons. */
export const VideoPlayer = forwardRef<PlayerHandle, Props>(function VideoPlayer({ provider, src, onTime, onEnded }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytHost = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const onTimeRef = useRef(onTime);
  const onEndedRef = useRef(onEnded);
  onTimeRef.current = onTime;
  onEndedRef.current = onEnded;

  useImperativeHandle(ref, () => ({
    play: () => (provider === "youtube" ? yt.current?.playVideo() : void videoRef.current?.play()),
    pause: () => (provider === "youtube" ? yt.current?.pauseVideo() : videoRef.current?.pause()),
    seek: (sec) => {
      if (provider === "youtube") yt.current?.seekTo(sec, true);
      else if (videoRef.current) videoRef.current.currentTime = sec;
    },
    time: () => (provider === "youtube" ? yt.current?.getCurrentTime() ?? 0 : videoRef.current?.currentTime ?? 0),
  }));

  useEffect(() => {
    if (provider !== "youtube" || !ytHost.current) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !ytHost.current || !window.YT) return;
      yt.current = new window.YT.Player(ytHost.current, {
        videoId: src,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT?.PlayerState.ENDED) onEndedRef.current?.();
          },
        },
      });
      timer = setInterval(() => onTimeRef.current(yt.current?.getCurrentTime?.() ?? 0), 500);
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      yt.current?.destroy();
      yt.current = null;
    };
  }, [provider, src]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-3xl bg-ink">
      {provider === "youtube" ? (
        <div ref={ytHost} className="h-full w-full" />
      ) : (
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          controlsList="nodownload"
          className="h-full w-full"
          onTimeUpdate={(e) => onTime(e.currentTarget.currentTime)}
          onEnded={() => onEnded?.()}
        />
      )}
    </div>
  );
});
