import { useEffect, useState } from 'react';
import { DollarSign, Eye, Mail, Megaphone, Rocket, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminOverview, type AdminOverviewOutputType } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';
import { errMsg, money } from '../../lib/util';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminOverview() {
  const [d, setD] = useState<AdminOverviewOutputType | null>(null);
  useEffect(() => {
    adminOverview({}).then(setD).catch((e) => toast.error(errMsg(e)));
  }, []);
  if (!d) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  const kpis = [
    { icon: DollarSign, l: 'MRR (Premium × $8)', v: money(d.mrr) },
    { icon: Megaphone, l: 'Ad revenue', v: money(d.adRevenue, 2) },
    { icon: Rocket, l: 'Crowdfunding raised', v: money(d.pledgedTotal) },
    { icon: Users, l: 'Users (Premium / Free)', v: `${d.premiumUsers} / ${d.freeUsers}` },
    { icon: Eye, l: 'Episode views', v: d.totalViews.toLocaleString() },
    { icon: Megaphone, l: 'Ad impressions', v: d.adImpressions.toLocaleString() },
    { icon: Megaphone, l: 'Ads awaiting approval', v: d.pendingAds },
    { icon: Mail, l: 'Mailing list', v: d.mailingList },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.l} className="neon-card p-4"><k.icon className="h-4 w-4 text-primary mb-2" /><p className="text-xs text-muted-foreground">{k.l}</p><p className="font-display text-3xl sm:text-4xl">{k.v}</p></div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="neon-card p-5 h-72">
          <p className="font-tech text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-2">Users by role</p>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={d.roleCounts} dataKey="count" nameKey="role" innerRadius={50} outerRadius={90} label={(e) => e.role}>
                {d.roleCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="neon-card p-5 h-72">
          <p className="font-tech text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-2">Top series by views</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={d.topSeries}>
              <XAxis dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
