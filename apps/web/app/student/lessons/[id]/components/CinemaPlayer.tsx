"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonVideo } from "@/app/lib/api";

interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
        onError?: () => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API needs a browser"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube API did not initialise"));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("YouTube API failed to load"));
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function clock(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function thumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function NativeEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <iframe
      className="lc-player-fallback-frame"
      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

interface CinemaPlayerProps {
  video: LessonVideo;
  title: string;
}

/**
 * An emerald cinema shell around the official YouTube player.
 *
 * The real YT thumbnail is the poster; after the first play the video is
 * controlled through the IFrame API with thin silver/emerald controls.
 * YouTube's native player chrome is never imitated—when the API cannot load,
 * the component falls back to the official embed with native controls.
 */
export function CinemaPlayer({ video, title }: CinemaPlayerProps) {
  const videoId =
    video.provider === "youtube" && video.providerVideoId
      ? video.providerVideoId
      : null;

  const frameRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pendingPlayRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration ?? 0);
  const [muted, setMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fatal, setFatal] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (playing) {
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
        hideTimerRef.current = null;
      }, 2400);
    }
  }, [playing]);

  const holdControls = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setControlsVisible(true);
  }, []);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [revealControls]);

  useEffect(() => {
    if (!videoId) return;
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let localPlayer: YouTubePlayer | null = null;

    const target = document.createElement("div");
    target.style.width = "100%";
    target.style.height = "100%";
    host.replaceChildren(target);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;

        const player = new YT.Player(target, {
          videoId,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              localPlayer = player;
              playerRef.current = player;
              setPlayerReady(true);
              const realDuration = player.getDuration();
              if (Number.isFinite(realDuration) && realDuration > 0) {
                setDuration(realDuration);
              }
              setMuted(player.isMuted());
              if (pendingPlayRef.current) {
                pendingPlayRef.current = false;
                player.playVideo();
                setStarted(true);
                setPosterLoading(false);
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              if (event.data === YT.PlayerState.PLAYING) {
                setStarted(true);
                setPlaying(true);
                setBuffering(false);
                setPosterLoading(false);
                setControlsVisible(true);
              } else if (event.data === YT.PlayerState.PAUSED) {
                setPlaying(false);
                setBuffering(false);
                setControlsVisible(true);
              } else if (event.data === YT.PlayerState.BUFFERING) {
                setBuffering(true);
              } else if (event.data === YT.PlayerState.ENDED) {
                setPlaying(false);
                setBuffering(false);
                setControlsVisible(true);
                const realDuration = player.getDuration();
                setCurrentTime(
                  Number.isFinite(realDuration) && realDuration > 0
                    ? realDuration
                    : 0,
                );
              } else {
                setBuffering(false);
              }
            },
            onError: () => {
              if (!cancelled) setFatal(true);
            },
          },
        });

        localPlayer = player;
        playerRef.current = player;
      })
      .catch(() => {
        if (!cancelled) setFatal(true);
      });

    return () => {
      cancelled = true;
      const player = localPlayer ?? playerRef.current;
      playerRef.current = null;
      try {
        player?.destroy();
      } catch {
        // The player may already be gone after a fatal error.
      }
      host.replaceChildren();
    };
  }, [videoId]);

  useEffect(() => {
    if (!fatal) return;
    const player = playerRef.current;
    playerRef.current = null;
    try {
      player?.destroy();
    } catch {
      // Already gone.
    }
  }, [fatal]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const time = player.getCurrentTime();
      if (Number.isFinite(time)) setCurrentTime(time);
      const realDuration = player.getDuration();
      if (Number.isFinite(realDuration) && realDuration > 0) {
        setDuration(realDuration);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const play = useCallback(() => {
    const player = playerRef.current;
    if (player && playerReady) {
      player.playVideo();
      setStarted(true);
      setPlaying(true);
      revealControls();
      requestAnimationFrame(() => frameRef.current?.focus());
      return;
    }
    pendingPlayRef.current = true;
    setPosterLoading(true);
    revealControls();
  }, [playerReady, revealControls]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      play();
      return;
    }
    if (playing) {
      player.pauseVideo();
      setPlaying(false);
      setControlsVisible(true);
    } else {
      player.playVideo();
      setStarted(true);
      setPlaying(true);
      revealControls();
    }
  }, [play, playing, revealControls]);

  const seek = useCallback((value: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(value, true);
    setCurrentTime(value);
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void frame.requestFullscreen?.();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLButtonElement
      ) {
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seek(Math.min(duration, currentTime + 5));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seek(Math.max(0, currentTime - 5));
      } else if (event.key.toLowerCase() === "m") {
        toggleMute();
      } else if (event.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    },
    [currentTime, duration, seek, toggleFullscreen, toggleMute, togglePlay],
  );

  if (!videoId) {
    return (
      <div className="lc-cinema-frame lc-cinema-frame--empty">
        <div className="lc-cinema-empty">
          <span>لا يوجد فيديو متاح لهذه الحصة بعد.</span>
        </div>
      </div>
    );
  }

  if (fatal) {
    return (
      <div className="lc-cinema-frame" ref={frameRef} data-fallback="true">
        <div className="lc-player lc-player--fallback">
          <NativeEmbed videoId={videoId} title={title} />
        </div>
        <span className="lc-cinema-inner-line" aria-hidden="true" />
        <p className="lc-player-fallback-note">
          تم تحويل التشغيل إلى مشغل يوتيوب الأساسي.
        </p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={frameRef}
      className="lc-cinema-frame"
      tabIndex={0}
      role="region"
      aria-label={`مشغل الحصة: ${title}`}
      onKeyDown={onKeyDown}
      onMouseMove={() => {
        if (started) revealControls();
      }}
      onMouseLeave={() => {
        if (playing) setControlsVisible(false);
      }}
      data-started={started || undefined}
    >
      <div className="lc-player">
        <div
          className="lc-player-stage"
          aria-hidden={!started}
          inert={!started}
        >
          <div ref={hostRef} className="lc-player-host" />
        </div>

        {!started && (
          <button
            type="button"
            className="lc-player-poster"
            onClick={play}
            aria-label={`تشغيل ${title}`}
            aria-busy={posterLoading}
          >
            {!thumbFailed && (
              <img
                className="lc-player-poster-img"
                src={thumbnail(videoId)}
                alt=""
                loading="eager"
                onError={() => setThumbFailed(true)}
              />
            )}
            <span className="lc-player-poster-shade" aria-hidden="true" />
            <span className="lc-player-poster-copy">
              <span className="lc-player-poster-kicker">درس مرئي</span>
              <span className="lc-player-poster-title">{title}</span>
            </span>
            <span className="lc-player-poster-play" aria-hidden="true">
              {posterLoading ? (
                <span className="lc-player-poster-spinner" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6.7v10.6L18 12z" fill="currentColor" />
                </svg>
              )}
            </span>
            <span className="lc-player-poster-meta">
              <span>{duration > 0 ? clock(duration) : "تشغيل الحصة"}</span>
              <span className="lc-player-poster-hint">اضغط للتشغيل</span>
            </span>
          </button>
        )}

        {started && (
          <div
            className="lc-player-controls"
            data-visible={controlsVisible || !playing ? "true" : undefined}
            dir="ltr"
            onMouseEnter={holdControls}
            onMouseLeave={revealControls}
          >
            <button
              type="button"
              className="lc-player-control"
              onClick={togglePlay}
              aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            <span className="lc-player-time">
              {clock(currentTime)} / {clock(duration)}
            </span>

            <div className="lc-player-progress">
              <span className="lc-player-track">
                <span
                  className="lc-player-fill"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </span>
              <input
                className="lc-player-range"
                type="range"
                min={0}
                max={Math.max(duration, 0)}
                step={0.1}
                value={Math.min(currentTime, Math.max(duration, 0))}
                onChange={(event) => seek(Number(event.target.value))}
                disabled={duration <= 0}
                aria-label="موضع التشغيل"
              />
            </div>

            <button
              type="button"
              className="lc-player-control"
              onClick={toggleMute}
              aria-label={muted ? "إلغاء كتم الصوت" : "كتم الصوت"}
            >
              {muted ? <MutedIcon /> : <VolumeIcon />}
            </button>

            <button
              type="button"
              className="lc-player-control"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
            >
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </button>
          </div>
        )}

        {buffering && started && (
          <span className="lc-player-buffer" aria-label="جارٍ التحميل">
            <span className="lc-player-buffer-ring" aria-hidden="true" />
          </span>
        )}
      </div>
      <span className="lc-cinema-inner-line" aria-hidden="true" />
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.5 5.8v12.4L19 12z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" />
      <rect x="13.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 9.5h3.2L12 6.2v11.6l-4.3-3.3H4.5z" />
      <path d="M15.4 9.2a4.1 4.1 0 0 1 0 5.6M17.8 6.8a7.4 7.4 0 0 1 0 10.4" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 9.5h3.2L12 6.2v11.6l-4.3-3.3H4.5z" />
      <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 4.5V9H4.5M19.5 9H15V4.5M15 19.5V15h4.5M4.5 15H9v4.5" />
    </svg>
  );
}
