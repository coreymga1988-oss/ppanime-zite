import { useEffect, useRef } from 'react';
import { cn } from '@project/components/lib/utils';

/**
 * YouTube embed. Error 153 happens when YouTube receives no Referer header,
 * so we send one explicitly (referrerPolicy) and pass our origin.
 * YouTube ignores the old `vq` URL param, so once the player is up we ask it
 * for 1080p over the IFrame API (postMessage) and repeat that as playback starts.
 */
export default function YouTubePlayer({ videoId, autoplay = true, className }: { videoId: string; autoplay?: boolean; className?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    vq: 'hd1080',
    enablejsapi: '1',
    origin: window.location.origin,
    widget_referrer: window.location.href,
  });

  useEffect(() => {
    const send = (func: string, args: unknown[] = []) =>
      ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com');
    const requestHd = () => {
      send('setPlaybackQualityRange', ['hd1080', 'highres']);
      send('setPlaybackQuality', ['hd1080']);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // Re-request HD whenever the player becomes ready, starts playing, or drops quality
        if (data?.event === 'onReady' || data?.event === 'onStateChange' && data.info === 1) requestHd();
        if (data?.event === 'onPlaybackQualityChange' && !['hd1080', 'highres', 'hd1440', 'hd2160'].includes(data.info)) requestHd();
      } catch { /* ignore non-JSON messages */ }
    };
    window.addEventListener('message', onMessage);
    // Register as a listener so the player sends us events, and nudge quality a few times early on
    const timers = [300, 1000, 2500, 5000].map((ms) =>
      setTimeout(() => {
        ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoId }), 'https://www.youtube.com');
        requestHd();
      }, ms),
    );
    return () => {
      window.removeEventListener('message', onMessage);
      timers.forEach(clearTimeout);
    };
  }, [videoId]);

  return (
    <div className={cn('relative w-full aspect-video overflow-hidden rounded-xl border border-border bg-black', className)}>
      <iframe
        ref={ref}
        key={videoId}
        src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
        title="YouTube video player"
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

export function youTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m?.[1] ?? null;
}
