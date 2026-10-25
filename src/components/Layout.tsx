import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ChevronDown, ExternalLink, Menu, User } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@project/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@project/components/ui/dropdown-menu';
import { Toaster } from '@project/components/ui/sonner';
import { cn } from '@project/components/lib/utils';
import { loginWithRedirect } from 'zitejs/auth';
import Logo from './Logo';
import SocialGrid from './SocialGrid';
import MailingListForm from './MailingListForm';
import LanguageToggle from './LanguageToggle';
import PageTranslator from './PageTranslator';
import { useApp } from '../lib/AppContext';
import { useLang } from '../lib/i18n';
import type { SectionKey } from '../lib/visibility';
import { COMPANY_LINKS, COMPANY_SITE } from '../lib/socials';

type NavItem = { to: string; en: string; ja: string; section?: SectionKey; roles?: string[] };
const NAV: NavItem[] = [
  { to: '/', en: 'Home', ja: 'ホーム' },
  { to: '/videos', en: 'Videos', ja: '動画', section: 'youtube' },
  { to: '/browse', en: 'Series', ja: '作品一覧', section: 'browse' },
  { to: '/campaigns', en: 'Back a Project', ja: 'プロジェクト支援', section: 'campaigns' },
  { to: '/news', en: 'News', ja: 'ニュース', section: 'news' },
  { to: '/premium', en: 'Premium', ja: 'プレミアム', section: 'premium' },
  { to: '/advertiser', en: 'Advertiser Hub', ja: '広告主ハブ', roles: ['Advertiser', 'Admin'] },
  { to: '/licensor', en: 'Licensor Hub', ja: 'ライセンサーハブ', roles: ['Licensor', 'Admin'] },
  { to: '/admin', en: 'Admin', ja: '管理', roles: ['Admin', 'Moderator'] },
];

const linkCls = 'font-tech text-[0.65rem] uppercase tracking-[0.14em] px-3 py-2 rounded-md transition-colors whitespace-nowrap';

function useNav() {
  const { canSee, profile } = useApp();
  return NAV.filter((n) => (!n.section || canSee(n.section)) && (!n.roles || (profile && n.roles.includes(profile.role))));
}

function NavLinks({ onClick, vertical }: { onClick?: () => void; vertical?: boolean }) {
  const items = useNav();
  const { t } = useLang();
  return (
    <nav className={cn('flex', vertical ? 'flex-col gap-1' : 'items-center gap-1')}>
      {items.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          onClick={onClick}
          className={({ isActive }) => cn(linkCls, isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary')}
        >
          {t(n.en, n.ja)}
        </NavLink>
      ))}
    </nav>
  );
}

function CompanyMenu() {
  const { t } = useLang();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(linkCls, 'text-muted-foreground hover:text-primary flex items-center gap-1')}>
        {t('Company', '会社情報')} <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {COMPANY_LINKS.map((l) => (
          <DropdownMenuItem key={l.href} asChild>
            <a href={l.href} target="_blank" rel="noopener noreferrer">{t(l.en, l.ja)} <ExternalLink className="h-3 w-3 ml-auto opacity-60" /></a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CompanyLinks({ className }: { className?: string }) {
  const { t } = useLang();
  return (
    <div className={className}>
      {COMPANY_LINKS.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
          {t(l.en, l.ja)}
        </a>
      ))}
    </div>
  );
}

function AccountButtons({ onClick }: { onClick?: () => void }) {
  const { profile, signedIn, authLoading } = useApp();
  const { t } = useLang();
  if (!signedIn && !authLoading)
    return (
      <Button size="sm" onClick={() => { onClick?.(); loginWithRedirect(); }}>
        <User className="h-4 w-4" />{t('Sign in', 'ログイン')}
      </Button>
    );
  return (
    <Button asChild size="sm" variant="outline" onClick={onClick}>
      <Link to="/account">
        {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" /> : <User className="h-4 w-4" />}
        <span className="max-w-[120px] truncate">{profile?.username ?? t('Account', 'アカウント')}</span>
      </Link>
    </Button>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo />
        <div className="hidden xl:flex items-center">
          <NavLinks />
          <CompanyMenu />
        </div>
        <div className="hidden xl:flex items-center gap-2">
          <LanguageToggle />
          <AccountButtons />
        </div>
        <div className="flex items-center gap-2 xl:hidden">
          <LanguageToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" aria-label={t('Menu', 'メニュー')}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col gap-6 overflow-y-auto">
              <SheetTitle className="sr-only">{t('Menu', 'メニュー')}</SheetTitle>
              <Logo height={32} />
              <NavLinks vertical onClick={() => setOpen(false)} />
              <div className="space-y-2">
                <p className="font-tech text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/70 px-3">{t('Company', '会社情報')}</p>
                <CompanyLinks className="flex flex-col gap-2 px-3 text-sm" />
              </div>
              <AccountButtons onClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { canSee } = useApp();
  return (
    <footer className="border-t border-border mt-20">
      <div className="container mx-auto px-4 py-16 space-y-16">
        {canSee('mailing') && <MailingListForm />}
        {canSee('socials') && <SocialGrid />}
        <CompanyLinks className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground border-t border-border pt-8">
          <Logo height={32} />
          <a href={COMPANY_SITE} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            pressplayanime.neocities.org
          </a>
          <p>© {new Date().getFullYear()} Press Play International Media</p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
      <PageTranslator />
    </div>
  );
}
