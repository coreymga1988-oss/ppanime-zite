import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Loader2 } from 'lucide-react';
import { startPlayback, type StartPlaybackOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import YouTubePlayer, { youTubeId } from '../components/YouTubePlayer';
import ShakaPlayer from '../components/ShakaPlayer';
import AdBreak from '../components/AdBreak';

function MainVideo({ data }: { data: StartPlaybackOutputType }) {
  const url = data.episode.videoUrl;
  const yt = youTubeId(url);
  if (yt) return <YouTubePlayer videoId={yt} />;
  // Native uploads (HLS, DASH, MP4) go through Shaka with mid/post-roll ads.
  return <ShakaPlayer src={url} midRolls={data.midRolls} postRoll={data.postRoll} />;
}

export default function Watch() {
  const { episodeId } = useParams();
  const [data, setData] = useState<StartPlaybackOutputType | null>(null);
  const [error, setError] = useState('');
  const [adDone, setAdDone] = useState(false);

  useEffect(() => {
    if (!episodeId) return;
    setData(null);
    setAdDone(false);
    startPlayback({ episodeId }).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Could not load episode'));
  }, [episodeId]);

  if (error) return <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">{error}</div>;
  if (!data) return <div className="py-32 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const showAd = data.ad && !adDone;
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 max-w-6xl">
      {data.episode.seriesId && (
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to={`/series/${data.episode.seriesId}`}><ArrowLeft className="h-4 w-4" />{data.episode.seriesTitle}</Link>
        </Button>
      )}
      {data.locked ? (
        <div className="aspect-video rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4 text-center p-6">
          <Crown className="h-10 w-10 text-primary" />
          <h2 className="font-display text-4xl">Premium episode</h2>
          <p className="text-muted-foreground">Upgrade to Premium for $8/month to watch this and every episode ad-free.</p>
          <Button asChild><Link to="/premium">Upgrade to Premium</Link></Button>
        </div>
      ) : showAd ? (
        <AdBreak ad={data.ad!} onDone={() => setAdDone(true)} />
      ) : data.episode.videoUrl ? (
        <MainVideo data={data} />
      ) : (
        <div className="aspect-video rounded-xl border border-border flex items-center justify-center text-muted-foreground">Video coming soon.</div>
      )}
      <h1 className="font-display text-4xl mt-5">E{data.episode.episodeNumber} · {data.episode.title}</h1>
      {!data.isPremium && !data.locked && (
        <p className="text-sm text-muted-foreground mt-1">Free viewing is ad-supported. <Link to="/premium" className="text-primary">Go Premium</Link> to skip ads.</p>
      )}
    </div>
  );
}
