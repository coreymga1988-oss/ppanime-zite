import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Languages, Subtitles } from 'lucide-react';
import { cn } from '@project/components/lib/utils';

type Track = { id: number; label: string };

const labelOf = (t: { name?: string; lang?: string }, i: number) => t.name || t.lang?.toUpperCase() || `Track ${i + 1}`;

/** HLS (.m3u8) player with dub/sub audio switching and subtitle selection. */
export default function HlsPlayer({ src, autoPlay = true, className }: { src: string; autoPlay?: boolean; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [audio, setAudio] = useState<Track[]>([]);
  const [subs, setSubs] = useState<Track[]>([]);
  const [audioId, setAudioId] = useState(0);
  const [subId, setSubId] = useState(-1);
  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError('');
    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: false, startLevel: -1 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        hls.nextLevel = hls.levels.length - 1; // start at the highest quality
        if (autoPlay) video.play().catch(() => undefined);
      });
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, d) => {
        setAudio(d.audioTracks.map((t, i) => ({ id: i, label: labelOf(t, i) })));
        setAudioId(hls.audioTrack);
      });
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, d) => {
        setSubs(d.subtitleTracks.map((t, i) => ({ id: i, label: labelOf(t, i) })));
        setSubId(hls.subtitleTrack);
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) setError('This episode could not be loaded. Please try again later.');
      });
      return () => { hls.destroy(); hlsRef.current = null; };
    }
    // Safari / iOS play HLS natively and show audio + subtitle choices in their own controls
    video.src = src;
    if (autoPlay) video.play().catch(() => undefined);
  }, [src, autoPlay]);

  const pickAudio = (id: number) => { if (hlsRef.current) hlsRef.current.audioTrack = id; setAudioId(id); };
  const pickSub = (id: number) => { if (hlsRef.current) hlsRef.current.subtitleTrack = id; setSubId(id); };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-border bg-black">
        <video ref={videoRef} controls playsInline className="absolute inset-0 h-full w-full" />
        {error && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground p-6 text-center">{error}</div>}
      </div>
      {(audio.length > 1 || subs.length > 0) && (
        <div className="flex flex-wrap gap-4 text-sm">
          {audio.length > 1 && (
            <TrackPicker icon={<Languages className="h-4 w-4" />} tracks={audio} value={audioId} onChange={pickAudio} />
          )}
          {subs.length > 0 && (
            <TrackPicker icon={<Subtitles className="h-4 w-4" />} tracks={[{ id: -1, label: 'Off' }, ...subs]} value={subId} onChange={pickSub} />
          )}
        </div>
      )}
    </div>
  );
}

function TrackPicker({ icon, tracks, value, onChange }: { icon: React.ReactNode; tracks: Track[]; value: number; onChange: (id: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <span className="px-2 text-muted-foreground">{icon}</span>
      {tracks.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn('rounded-md px-3 py-1 transition-colors', value === t.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
