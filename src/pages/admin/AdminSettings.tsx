import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminList, adminSave } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Checkbox } from '@project/components/ui/checkbox';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { AUDIENCES, SECTIONS, type Visibility } from '../../lib/visibility';
import { useApp } from '../../lib/AppContext';
import { errMsg } from '../../lib/util';

async function saveSetting(key: string, value: string) {
  const { records } = await adminList({ table: 'siteSettings' });
  const existing = records.find((r) => (r as Record<string, unknown>).settingKey === key) as Record<string, unknown> | undefined;
  await adminSave({ table: 'siteSettings', id: existing ? String(existing.id) : undefined, record: { settingKey: key, value } });
}

function VisibilityMatrix() {
  const { visibility, refreshSettings } = useApp();
  const [v, setV] = useState<Visibility>(visibility);
  const [busy, setBusy] = useState(false);
  useEffect(() => setV(visibility), [visibility]);
  const toggle = (s: string, a: string) => setV({ ...v, [s]: { ...v[s], [a]: !v[s]?.[a] } });
  const save = async () => {
    setBusy(true);
    try { await saveSetting('visibility', JSON.stringify(v)); await refreshSettings(); toast.success('Visibility updated'); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="neon-card p-5 space-y-4">
      <div>
        <h2 className="font-display text-3xl">Section Visibility</h2>
        <p className="text-sm text-muted-foreground">Choose which parts of the site each audience can see. Admins always see everything.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr>
              <th className="text-left p-2" />
              {AUDIENCES.map((a) => <th key={a.key} className="p-2 font-tech text-[0.6rem] uppercase tracking-widest text-muted-foreground">{a.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((s) => (
              <tr key={s.key} className="border-t border-border">
                <td className="p-2"><p className="font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.description}</p></td>
                {AUDIENCES.map((a) => (
                  <td key={a.key} className="p-2 text-center"><Checkbox checked={v[s.key]?.[a.key] !== false} onCheckedChange={() => toggle(s.key, a.key)} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save visibility</Button>
    </div>
  );
}

function SiteText() {
  const { settings, refreshSettings } = useApp();
  const [beta, setBeta] = useState('');
  const [rpv, setRpv] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setBeta(settings.beta_message ?? ''); setRpv(settings.revenue_per_view ?? '0.01'); }, [settings]);
  const save = async () => {
    setBusy(true);
    try { await saveSetting('beta_message', beta); await saveSetting('revenue_per_view', rpv); await refreshSettings(); toast.success('Settings saved'); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="neon-card p-5 space-y-4">
      <h2 className="font-display text-3xl">Site Settings</h2>
      <div><Label>Home page beta notice</Label><Textarea rows={3} value={beta} onChange={(e) => setBeta(e.target.value)} placeholder="Leave blank to use the default closed-beta message" /></div>
      <div className="max-w-xs"><Label>Licensor revenue per view (USD)</Label><Input type="number" step="0.001" value={rpv} onChange={(e) => setRpv(e.target.value)} /></div>
      <Button onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save settings</Button>
    </div>
  );
}

export default function AdminSettings() {
  return <div className="space-y-6"><VisibilityMatrix /><SiteText /></div>;
}
