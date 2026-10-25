import { useEffect, useState } from 'react';
import { Loader2, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { getMyAds, saveMyAd, type GetMyAdsOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Badge } from '@project/components/ui/badge';
import { Progress } from '@project/components/ui/progress';
import { Skeleton } from '@project/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import { PageHeader } from '../components/Gate';
import UploadField from '../components/UploadField';
import { useApp } from '../lib/AppContext';
import { errMsg, money } from '../lib/util';

type Ad = GetMyAdsOutputType['ads'][number];
const schema = z.object({
  title: z.string().min(2, 'Title required'),
  videoUrl: z.string().url('Upload a video or paste a URL'),
  targetViews: z.number().min(1, 'Set target views'),
  contactEmail: z.string().email('Valid email required'),
});
const STATUS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { Approved: 'default', Pending: 'secondary', Rejected: 'destructive', Paused: 'outline' };

function AdForm({ ad, onClose, onSaved }: { ad: Ad | null; onClose: () => void; onSaved: () => void }) {
  const { profile } = useApp();
  const [f, setF] = useState({
    title: ad?.title ?? '', videoUrl: ad?.videoUrl ?? '', clickUrl: ad?.clickUrl ?? '', targetViews: String(ad?.targetViews ?? ''), budget: String(ad?.budget ?? ''),
    contactName: ad?.contactName ?? profile?.displayName ?? '', contactEmail: ad?.contactEmail ?? profile?.email ?? '', contactPhone: ad?.contactPhone ?? profile?.phone ?? '', notes: ad?.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const parsed = schema.safeParse({ ...f, targetViews: Number(f.targetViews) });
  const errors = parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]));
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setBusy(true);
    try {
      await saveMyAd({ id: ad?.id, action: 'save', ...f, targetViews: Number(f.targetViews), budget: Number(f.budget) || 0 });
      toast.success('Submitted for admin approval');
      onSaved();
      onClose();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const field = (k: keyof typeof f, label: string, type = 'text') => (
    <div><Label>{label}</Label><Input type={type} value={f[k]} onChange={set(k)} />{errors[k] && <p className="text-xs text-destructive mt-1">{errors[k]}</p>}</div>
  );
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">{field('title', 'Ad title')}</div>
      <div className="sm:col-span-2"><Label>Video file</Label><UploadField value={f.videoUrl} onChange={(v) => setF({ ...f, videoUrl: v })} accept="video/*" />{errors.videoUrl && <p className="text-xs text-destructive mt-1">{errors.videoUrl}</p>}</div>
      {field('targetViews', 'Target views', 'number')}
      {field('budget', 'Budget (USD)', 'number')}
      <div className="sm:col-span-2">{field('clickUrl', 'Click-through URL (optional)')}</div>
      {field('contactName', 'Contact name')}
      {field('contactEmail', 'Contact email', 'email')}
      {field('contactPhone', 'Contact phone')}
      <div className="sm:col-span-2"><Label>Notes for reviewer</Label><Textarea value={f.notes} onChange={set('notes')} rows={3} /></div>
      <Button className="sm:col-span-2" disabled={!parsed.success || busy} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{ad ? 'Save & resubmit' : 'Submit for approval'}</Button>
    </div>
  );
}

function AdRow({ ad, onEdit, reload }: { ad: Ad; onEdit: () => void; reload: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const act = async (action: 'pause' | 'resume' | 'delete') => {
    try { await saveMyAd({ id: ad.id, action }); toast.success('Updated'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const pct = ad.targetViews ? Math.min(100, (ad.deliveredViews / ad.targetViews) * 100) : 0;
  return (
    <div className="neon-card p-5 space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <div><h3 className="font-semibold">{ad.title}</h3><p className="text-xs text-muted-foreground">Budget {money(ad.budget)} · CPM {money(ad.cpm, 2)}</p></div>
        <Badge variant={STATUS[ad.status] ?? 'secondary'}>{ad.status}</Badge>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-sm"><span className="text-primary font-semibold">{ad.deliveredViews.toLocaleString()}</span> <span className="text-muted-foreground">/ {ad.targetViews.toLocaleString()} views delivered ({pct.toFixed(1)}%)</span></p>
      {ad.adminFeedback && <p className="text-xs border-l-2 border-primary pl-2 text-muted-foreground">Admin: {ad.adminFeedback}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3 w-3" />Edit</Button>
        {ad.status === 'Approved' && <Button size="sm" variant="outline" onClick={() => act('pause')}><Pause className="h-3 w-3" />Pause</Button>}
        {ad.status === 'Paused' && <Button size="sm" variant="outline" onClick={() => act('resume')}><Play className="h-3 w-3" />Resume</Button>}
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirm(true)}><Trash2 className="h-3 w-3" />Delete</Button>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this ad?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => act('delete')}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Advertiser() {
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [editing, setEditing] = useState<Ad | null | 'new'>(null);
  const load = () => getMyAds({}).then((r) => setAds(r.ads)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => void load(), []);
  const total = (ads ?? []).reduce((s, a) => s + a.deliveredViews, 0);
  const target = (ads ?? []).reduce((s, a) => s + a.targetViews, 0);
  return (
    <>
      <PageHeader eyebrow="Advertiser Hub" title="Your Campaigns">Upload video ads, set target views, and track delivery once approved.</PageHeader>
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Ads', ads?.length ?? 0], ['Live', ads?.filter((a) => a.status === 'Approved').length ?? 0], ['Views delivered', total.toLocaleString()], ['Target views', target.toLocaleString()]].map(([l, v]) => (
            <div key={l} className="neon-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="font-display text-4xl">{v}</p></div>
          ))}
        </div>
        <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />New ad</Button>
        <div className="grid md:grid-cols-2 gap-4">
          {!ads && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          {ads?.length === 0 && <p className="text-muted-foreground">No ads yet — create your first one.</p>}
          {ads?.map((a) => <AdRow key={a.id} ad={a} onEdit={() => setEditing(a)} reload={load} />)}
        </div>
      </div>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === 'new' ? 'New ad' : 'Edit ad'}</DialogTitle></DialogHeader>
          {editing !== null && <AdForm ad={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={load} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
