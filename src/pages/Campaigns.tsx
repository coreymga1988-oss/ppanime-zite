import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2, Rocket, Users } from 'lucide-react';
import { toast } from 'sonner';
import { confirmCheckout, createPledgeCheckout, getCampaigns, type GetCampaignsOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Progress } from '@project/components/ui/progress';
import { Skeleton } from '@project/components/ui/skeleton';
import { Badge } from '@project/components/ui/badge';
import { PageHeader } from '../components/Gate';
import { useApp } from '../lib/AppContext';
import { errMsg, money, openExternal } from '../lib/util';

type Campaign = GetCampaignsOutputType['campaigns'][number];

function useCampaigns() {
  const [data, setData] = useState<Campaign[] | null>(null);
  const load = () => getCampaigns({}).then((r) => setData(r.campaigns)).catch(() => setData([]));
  useEffect(() => void load(), []);
  return { data, load };
}

const pct = (c: Campaign) => (c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0);
const daysLeft = (d: string) => (d ? Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) : null);

function Stats({ c }: { c: Campaign }) {
  const days = daysLeft(c.endDate);
  return (
    <div className="space-y-2">
      <Progress value={pct(c)} className="h-2" />
      <div className="flex justify-between text-sm">
        <span><span className="text-primary font-semibold">{money(c.raised)}</span> <span className="text-muted-foreground">of {money(c.goal)}</span></span>
        <span className="font-tech text-xs text-primary">{pct(c)}%</span>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.backers} backers</span>
        {days !== null && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{days} days left</span>}
      </div>
    </div>
  );
}

export function Campaigns() {
  const { data } = useCampaigns();
  return (
    <>
      <PageHeader eyebrow="Crowdfunding" title={<>Back a <span className="text-gradient">Project</span></>}>
        Help greenlight the next Press Play release. Pick a reward tier and fund the anime you want to see.
      </PageHeader>
      <div className="container mx-auto px-4 py-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {!data && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
        {data?.length === 0 && <div className="neon-card p-10 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">No campaigns are live right now. Join the mailing list to hear when the next one launches!</div>}
        {data?.map((c) => (
          <Link key={c.id} to={`/campaigns/${c.id}`} className="neon-card overflow-hidden flex flex-col">
            <div className="aspect-video bg-secondary overflow-hidden">
              {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center"><Rocket className="h-10 w-10 text-primary/50" /></div>}
            </div>
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                {c.status === 'Funded' && <Badge className="mb-2">Funded</Badge>}
                <h3 className="font-display text-3xl">{c.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
              </div>
              <div className="mt-auto"><Stats c={c} /></div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function CampaignDetail() {
  const { id } = useParams();
  const { data, load } = useCampaigns();
  const [params, setParams] = useSearchParams();
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const c = data?.find((x) => x.id === id);

  useEffect(() => {
    const sid = params.get('pledge');
    if (!sid) return;
    confirmCheckout({ sessionId: sid })
      .then((r) => (r.kind === 'pledge' ? toast.success('Thank you for backing this project! 🎉') : toast('Payment not completed.')))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => { setParams({}, { replace: true }); load(); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const back = async (tierId: string | undefined, amount: number) => {
    setBusy(tierId ?? 'custom');
    try {
      const r = await createPledgeCheckout({ campaignId: c!.id, tierId, amount, returnUrl: window.location.origin + window.location.pathname });
      openExternal(r.url);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <div className="container mx-auto px-4 py-10"><Skeleton className="h-96" /></div>;
  if (!c) return <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Campaign not found.</div>;
  const customAmt = Number(custom);
  const active = c.status === 'Active';

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/campaigns"><ArrowLeft className="h-4 w-4" />All campaigns</Link></Button>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div>
          {c.imageUrl && <img src={c.imageUrl} alt="" className="w-full aspect-video object-cover rounded-xl border border-border" />}
          <h1 className="font-display text-5xl sm:text-6xl mt-6">{c.title}</h1>
          <p className="text-muted-foreground mt-4 whitespace-pre-line">{c.description}</p>
        </div>
        <aside className="space-y-4">
          <div className="neon-card p-5"><Stats c={c} /></div>
          <h2 className="font-display text-3xl">Reward Tiers</h2>
          {c.tiers.map((t) => {
            const soldOut = t.limit !== null && t.claimed >= t.limit;
            return (
              <div key={t.id} className="neon-card p-5 space-y-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold">{t.name}</h3>
                  <span className="font-display text-2xl text-primary">{money(t.amount)}</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{t.description}</p>
                {t.limit !== null && <p className="text-xs text-muted-foreground">{t.claimed} / {t.limit} claimed</p>}
                <Button className="w-full" disabled={!active || soldOut || !!busy} onClick={() => back(t.id, t.amount)}>
                  {busy === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : soldOut ? 'Sold out' : 'Select this reward'}
                </Button>
              </div>
            );
          })}
          <div className="neon-card p-5 space-y-2">
            <h3 className="font-semibold">Pledge without a reward</h3>
            <div className="flex gap-2">
              <Input type="number" min={1} placeholder="Amount (USD)" value={custom} onChange={(e) => setCustom(e.target.value)} />
              <Button disabled={!active || !(customAmt >= 1) || !!busy} onClick={() => back(undefined, customAmt)}>
                {busy === 'custom' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Back it'}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
