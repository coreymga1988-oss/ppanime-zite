import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ExternalLink } from 'lucide-react';
import { recordAdView, type StartPlaybackOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';

export type AdItem = NonNullable<StartPlaybackOutputType['ad']>;

/** Plays one ad video full-frame, counts the view when it finishes. */
export default function AdBreak({ ad, label = 'Ad', onDone, overlay }: { ad: AdItem; label?: string; onDone: () => void; overlay?: boolean }) {
  const [left, setLeft] = useState<number | null>(null);
  const counted = useRef(false);
  const finish = () => {
    if (!counted.current) {
      counted.current = true;
      recordAdView({ adId: ad.id }).catch(() => undefined);
    }
    onDone();
  };
  return (
    <div className={overlay ? 'absolute inset-0 z-20 bg-black' : 'relative'}>
      <video
        src={ad.videoUrl}
        autoPlay
        playsInline
        onTimeUpdate={(e) => setLeft(Math.ceil(e.currentTarget.duration - e.currentTarget.currentTime))}
        onEnded={finish}
        onError={onDone}
        className={overlay ? 'w-full h-full bg-black' : 'w-full aspect-video rounded-xl border border-primary/40 bg-black'}
      />
      <div className="absolute top-3 left-3 bg-background/80 rounded px-2 py-1 text-xs font-tech uppercase tracking-widest">
        {label} {left !== null && Number.isFinite(left) ? `· ${left}s` : ''}
      </div>
      <div className="absolute bottom-3 right-3 flex gap-2">
        {ad.clickUrl && (
          <Button size="sm" variant="secondary" asChild>
            <a href={ad.clickUrl} target="_blank" rel="noopener noreferrer">Learn more <ExternalLink className="h-3 w-3" /></a>
          </Button>
        )}
        <Button size="sm" asChild variant="outline"><Link to="/premium"><Crown className="h-3 w-3" />Go ad-free</Link></Button>
      </div>
    </div>
  );
}
