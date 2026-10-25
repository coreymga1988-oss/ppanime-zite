import { useState } from 'react';
import { BarChart3, Users, Ticket, Film, Upload, Megaphone, HandCoins, Newspaper, Percent, Mail, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from '@project/components/lib/utils';
import { PageHeader } from '../../components/Gate';
import { useApp } from '../../lib/AppContext';
import AdminOverview from './AdminOverview';
import AdminSettings from './AdminSettings';
import R2Uploader from './R2Uploader';
import { AdsManager, CampaignsManager, CouponsManager, InvitesManager, MailingManager, NewsManager, SeriesManager, UsersManager } from './Managers';

type Tab = { key: string; label: string; icon: LucideIcon; group: string; el: JSX.Element; mod?: boolean };

// mod: true = Moderators can use this tab too; the rest are Admin-only
const TABS: Tab[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3, group: 'Platform', el: <AdminOverview /> },
  { key: 'users', label: 'Users', icon: Users, group: 'Platform', el: <UsersManager /> },
  { key: 'invites', label: 'Invites', icon: Ticket, group: 'Platform', el: <InvitesManager /> },
  { key: 'settings', label: 'Visibility & Settings', icon: SlidersHorizontal, group: 'Platform', el: <AdminSettings /> },
  { key: 'content', label: 'Series & Episodes', icon: Film, group: 'Content', el: <SeriesManager />, mod: true },
  { key: 'upload', label: 'Upload Episode', icon: Upload, group: 'Content', el: <R2Uploader />, mod: true },
  { key: 'news', label: 'News', icon: Newspaper, group: 'Content', el: <NewsManager />, mod: true },
  { key: 'ads', label: 'Ads', icon: Megaphone, group: 'Revenue', el: <AdsManager />, mod: true },
  { key: 'campaigns', label: 'Crowdfunding', icon: HandCoins, group: 'Revenue', el: <CampaignsManager />, mod: true },
  { key: 'coupons', label: 'Coupons', icon: Percent, group: 'Revenue', el: <CouponsManager /> },
  { key: 'mailing', label: 'Mailing List', icon: Mail, group: 'Revenue', el: <MailingManager /> },
];
const GROUPS = ['Platform', 'Content', 'Revenue'];

function NavButton({ t, active, onClick }: { t: Tab; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors w-full',
        active ? 'bg-primary/15 text-primary font-medium ring-1 ring-primary/40' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <t.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{t.label}</span>
    </button>
  );
}

export default function Admin() {
  const { profile } = useApp();
  const isAdmin = profile?.role === 'Admin';
  const tabs = TABS.filter((t) => isAdmin || t.mod);
  const [tab, setTab] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === tab) ?? tabs[0];
  return (
    <>
      <PageHeader eyebrow={isAdmin ? 'Admin Console' : 'Moderator Console'} title="Platform Control" />
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-[220px_1fr] items-start">
        <aside className="lg:sticky lg:top-20 rounded-xl border border-border bg-card p-3 space-y-4">
          {GROUPS.map((g) => {
            const items = tabs.filter((t) => t.group === g);
            if (!items.length) return null;
            return (
              <div key={g}>
                <p className="font-tech text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/70 px-3 mb-1.5">{g}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
                  {items.map((t) => <NavButton key={t.key} t={t} active={t.key === current.key} onClick={() => setTab(t.key)} />)}
                </div>
              </div>
            );
          })}
        </aside>
        <section className="min-w-0">{current.el}</section>
      </div>
    </>
  );
}
