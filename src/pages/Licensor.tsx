import { useEffect, useState } from 'react';
import { Eye, DollarSign, Film, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getLicensorDashboard, type GetLicensorDashboardOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { PageHeader } from '../components/Gate';
import { COMPANY_SITE } from '../lib/socials';
import { errMsg, money } from '../lib/util';

export default function Licensor() {
  const [data, setData] = useState<GetLicensorDashboardOutputType | null>(null);
  useEffect(() => {
    getLicensorDashboard({}).then(setData).catch((e) => toast.error(errMsg(e)));
  }, []);
  const views = data?.series.reduce((s, x) => s + x.views, 0) ?? 0;
  const rev = data?.series.reduce((s, x) => s + x.licensorRevenue, 0) ?? 0;
  return (
    <>
      <PageHeader eyebrow="Licensor Hub" title="Performance & Revenue">Read-only analytics for the titles you license to Press Play.</PageHeader>
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Film, l: 'Your titles', v: data?.series.length ?? '—' },
            { icon: Eye, l: 'Total views', v: views.toLocaleString() },
            { icon: DollarSign, l: 'Your revenue share', v: money(rev, 2) },
          ].map((k) => (
            <div key={k.l} className="neon-card p-5"><k.icon className="h-5 w-5 text-primary mb-2" /><p className="text-xs text-muted-foreground">{k.l}</p><p className="font-display text-4xl">{k.v}</p></div>
          ))}
        </div>
        {!data && <Skeleton className="h-72" />}
        {data && data.series.length > 0 && (
          <div className="neon-card p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series.map((s) => ({ name: s.title, views: s.views }))}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {data?.series.length === 0 && <div className="neon-card p-8 text-center text-muted-foreground">No titles are linked to your account yet. Press Play will connect your series once licensing is finalized.</div>}
        <div className="space-y-4">
          {data?.series.map((s) => (
            <div key={s.id} className="neon-card p-5">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <h3 className="font-display text-3xl">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.views.toLocaleString()} views · {Math.round(s.revenueShare * 100)}% share · <span className="text-primary">{money(s.licensorRevenue, 2)}</span></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground"><th className="py-1">Episode</th><th className="py-1 text-right">Views</th><th className="py-1 text-right">Your share</th></tr></thead>
                  <tbody>{s.episodes.map((e) => (
                    <tr key={e.id} className="border-t border-border"><td className="py-2">E{e.episodeNumber} · {e.title}</td><td className="text-right">{e.views.toLocaleString()}</td><td className="text-right">{money(e.views * (data?.revenuePerView ?? 0) * s.revenueShare, 2)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div className="neon-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3"><Handshake className="h-6 w-6 text-primary shrink-0" /><div><p className="font-medium">Need localization for another title?</p><p className="text-sm text-muted-foreground">Press Play handles subtitling, dubbing and distribution for English-speaking audiences. Visit our company site to reach our partnerships team.</p></div></div>
          <Button asChild><a href={COMPANY_SITE} target="_blank" rel="noopener noreferrer">Contact Press Play</a></Button>
        </div>
      </div>
    </>
  );
}
