import { useEffect, useMemo, useState } from 'react';
import { Play, Search, Youtube } from 'lucide-react';
import { getYoutubeVideos, type GetYoutubeVideosOutputType } from 'zitejs/api';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@project/components/ui/dialog';
import YouTubePlayer from './YouTubePlayer';
import { YT_CHANNEL } from '../lib/socials';

type Video = GetYoutubeVideosOutputType['videos'][number];

export default function YouTubeGallery({ limit }: { limit?: number }) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    getYoutubeVideos({})
      .then((r) => setVideos(r.videos))
      .catch(() => setError(true));
  }, []);

  const filtered = useMemo(() => {
    const list = (videos ?? []).filter((v) => v.title.toLowerCase().includes(q.toLowerCase()));
    return limit ? list.slice(0, limit) : list;
  }, [videos, q, limit]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {videos ? `${videos.length} videos · synced live from our channel` : 'Loading our channel…'}
        </p>
        {!limit && (
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search videos" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        )}
      </div>

      {error && (
        <div className="neon-card p-6 text-center text-muted-foreground">
          Couldn't reach YouTube right now.{' '}
          <a className="text-primary" href={YT_CHANNEL} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!videos && !error && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}
        {filtered.map((v) => (
          <button key={v.id} onClick={() => setActive(v)} className="group text-left neon-card overflow-hidden">
            <div className="relative aspect-video overflow-hidden">
              <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent flex items-center justify-center">
                <span className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-5 w-5 fill-current" />
                </span>
              </div>
              {v.duration && <span className="absolute bottom-2 right-2 text-[0.65rem] font-tech bg-background/80 px-1.5 py-0.5 rounded">{v.duration}</span>}
            </div>
            <p className="p-3 text-sm font-medium line-clamp-2">{v.title}</p>
          </button>
        ))}
      </div>
      {videos && filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No videos match “{q}”.</p>}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-[min(96vw,1400px)] p-3 sm:p-4 bg-background">
          <DialogTitle className="text-base pr-8">{active?.title}</DialogTitle>
          {active && <YouTubePlayer videoId={active.id} />}
          <Button asChild variant="outline" size="sm" className="w-fit">
            <a href={`https://www.youtube.com/watch?v=${active?.id}`} target="_blank" rel="noopener noreferrer">
              <Youtube className="h-4 w-4" /> Open on YouTube
            </a>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
