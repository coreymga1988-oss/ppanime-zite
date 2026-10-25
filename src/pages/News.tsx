import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getNews, type GetNewsOutputType } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';
import { PageHeader } from '../components/Gate';

export default function News() {
  const [posts, setPosts] = useState<GetNewsOutputType['posts'] | null>(null);
  useEffect(() => {
    getNews({}).then((r) => setPosts(r.posts)).catch(() => setPosts([]));
  }, []);
  return (
    <>
      <PageHeader eyebrow="Transmission" title="News Feed">The latest from the Press Play team.</PageHeader>
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
        {!posts && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        {posts?.length === 0 && <div className="neon-card p-10 text-center text-muted-foreground">No news yet — stay tuned.</div>}
        {posts?.map((p) => (
          <article key={p.id} className="neon-card overflow-hidden">
            {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full aspect-[21/9] object-cover" />}
            <div className="p-6">
              {p.createdAt && <p className="font-tech text-[0.6rem] uppercase tracking-widest text-primary">{format(new Date(p.createdAt), 'MMM d, yyyy')}</p>}
              <h2 className="font-display text-4xl mt-1">{p.title}</h2>
              <p className="text-muted-foreground mt-3 whitespace-pre-line">{p.body}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
