import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - shaka's UI build ships loose typings
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';
import AdBreak, { type AdItem } from './AdBreak';

type MidRoll = { at: number; ad: AdItem };

/**
 * Shaka Player for native uploads (HLS .m3u8, DASH .mpd, MP4) with
 * built-in audio-language (dub/sub) and subtitle menus, plus mid- and post-roll ad breaks.
 */
export default function ShakaPlayer({ src, midRolls = [], postRoll = null }: { src: string; midRolls?: MidRoll[]; postRoll?: AdItem | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const played = useRef<Set<number>>(new Set());
  const [activeAd, setActiveAd] = useState<{ ad: AdItem; label: string; resume: boolean } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = shaka as any;
    const video = videoRef.current!;
    s.polyfill.installAll();
    if (!s.Player.isBrowserSupported()) {
      video.src = src;
      return;
    }
    const player = new s.Player();
    const ui = new s.ui.Overlay(player, containerRef.current!, video);
    ui.configure({
      overflowMenuButtons: ['quality', 'language', 'captions', 'playback_rate', 'picture_in_picture'],
      addSeekBar: true,
    });
    player.configure({ abr: { enabled: true, defaultBandwidthEstimate: 50_000_000 } });
    player
      .attach(video)
      .then(() => player.load(src))
      .then(() => video.play().catch(() => undefined))
      .catch((e: { code?: number }) => setError(`Could not load video (code ${e?.code ?? '?'})`));
    return () => {
      ui.destroy();
    };
  }, [src]);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || activeAd) return;
    // Breaks the viewer reached (or skipped past) that haven't played yet — play only the latest.
    const due = midRolls.filter((m) => v.currentTime >= m.at && !played.current.has(m.at));
    if (!due.length) return;
    due.forEach((m) => played.current.add(m.at));
    v.pause();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    setActiveAd({ ad: due[due.length - 1].ad, label: 'Mid-roll ad', resume: true });
  };

  const onEnded = () => {
    if (postRoll && !played.current.has(-1)) {
      played.current.add(-1);
      setActiveAd({ ad: postRoll, label: 'Ad', resume: false });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-black" data-shaka-player-container>
      <video ref={videoRef} className="w-full h-full" playsInline autoPlay data-shaka-player onTimeUpdate={onTimeUpdate} onEnded={onEnded} />
      {activeAd && (
        <AdBreak
          overlay
          ad={activeAd.ad}
          label={activeAd.label}
          onDone={() => {
            const resume = activeAd.resume;
            setActiveAd(null);
            if (resume) videoRef.current?.play().catch(() => undefined);
          }}
        />
      )}
      {error && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{error}</div>}
    </div>
  );
}
