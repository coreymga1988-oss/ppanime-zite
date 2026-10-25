import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Film, Play, Search } from 'lucide-react';
import { getCatalog, type GetCatalogOutputType } from 'zitejs/api';
import { Input } from '@project/components/ui/input';
import { Badge } from '@project/components/ui/badge';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { PageHeader } from '../components/Gate';

type Series = GetCatalogOutputType['series'][number];

function useCatalog() {
  const [data, setData] = useState<Series[] | null>(null);
  useEffect(() => {
    getCatalog({}).then((r) => setData(r.series)).catch(() => setData([]));
  }, []);
  return data;
}

function Cover({ s }: { s: Series }) {
  return s.coverImageUrl ? (
    <img src={s.coverImageUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="h-full w-full flex items-center justify-center bg-secondary"><Film className="h-10 w-10 text-primary/50" /></div>
  );
}

export function Browse() {
  const data = useCatalog();
  const [q, setQ] = useState('');
  const list = useMemo(
    () => (data ?? []).filter((s) => `${s.title} ${s.genres}`.toLowerCase().includes(q.toLowerCase())),
    [data, q],
  );
  return (
    <>
      <PageHeader eyebrow="Catalog" title="Series">Officially licensed anime from Press Play.</PageHeader>
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search series or genre" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {!data && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-xl" />)}
          {list.map((s) => (
            <Link key={s.id} to={`/series/${s.id}`} className="group neon-card overflow-hidden">
              <div className="aspect-[2/3] overflow-hidden"><Cover s={s} /></div>
              <div className="p-3">
                <p className="font-medium line-clamp-1">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.episodes.length} episodes{s.genres ? ` · ${s.genres}` : ''}</p>
              </div>
            </Link>
          ))}
        </div>
        {data && list.length === 0 && (
          <div className="neon-card p-10 text-center text-muted-foreground">
            {data.length === 0 ? 'Our first licensed titles are on the way — check out our YouTube videos in the meantime!' : 'No series match your search.'}
          </div>
        )}
      </div>
    </>
  );
}

export function SeriesDetail() {
  const { id } = useParams();
  const data = useCatalog();
  const s = data?.find((x) => x.id === id);
  if (!data) return <div className="container mx-auto px-4 py-10"><Skeleton className="h-80" /></div>;
  if (!s) return <div className="container mx-auto px-4 py-24 text-center"><p className="text-muted-foreground mb-4">Series not found.</p><Button asChild><Link to="/browse">Back to series</Link></Button></div>;
  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/browse"><ArrowLeft className="h-4 w-4" /> All series</Link></Button>
      <div className="grid md:grid-cols-[260px_1fr] gap-8">
        <div className="aspect-[2/3] rounded-xl overflow-hidden border border-border max-w-[260px]"><Cover s={s} /></div>
        <div>
          <h1 className="font-display text-5xl sm:text-6xl">{s.title}</h1>
          {s.genres && <p className="text-primary text-sm mt-1">{s.genres}</p>}
          <p className="text-muted-foreground mt-4 whitespace-pre-line">{s.synopsis}</p>
          <h2 className="font-display text-3xl mt-8 mb-3">Episodes</h2>
          <div className="space-y-2">
            {s.episodes.length === 0 && <p className="text-muted-foreground text-sm">No episodes yet.</p>}
            {s.episodes.map((e) => (
              <Link key={e.id} to={`/watch/${e.id}`} className="neon-card flex items-center gap-4 p-3">
                <div className="h-16 w-28 shrink-0 rounded-md overflow-hidden bg-secondary flex items-center justify-center">
                  {e.thumbnailUrl ? <img src={e.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <Play className="h-5 w-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">E{e.episodeNumber} · {e.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{e.description}</p>
                </div>
                {e.premiumOnly && <Badge className="gap-1"><Crown className="h-3 w-3" />Premium</Badge>}
                {e.durationMinutes > 0 && <span className="text-xs text-muted-foreground hidden sm:block">{e.durationMinutes}m</span>}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
