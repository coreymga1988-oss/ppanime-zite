import { useEffect, type ReactNode } from 'react';
import { loginWithRedirect } from 'zitejs/auth';
import { Link } from 'react-router-dom';
import { Loader2, Lock, ShieldOff } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { useApp } from '../lib/AppContext';
import type { SectionKey } from '../lib/visibility';

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg" />
      <div className="container mx-auto px-4 py-12 sm:py-16 relative">
        <div className="eyebrow mb-4">{eyebrow}</div>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95]">{title}</h1>
        {children && <div className="mt-4 text-muted-foreground max-w-2xl text-base sm:text-lg">{children}</div>}
      </div>
    </div>
  );
}

function Notice({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center gap-4">
      <div className="h-14 w-14 rounded-full border border-border flex items-center justify-center text-primary">{icon}</div>
      <h2 className="font-display text-4xl">{title}</h2>
      <p className="text-muted-foreground max-w-md">{body}</p>
      {action}
    </div>
  );
}

export function FullLoader() {
  return (
    <div className="py-32 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function SignInRedirect() {
  useEffect(() => {
    loginWithRedirect();
  }, []);
  return <FullLoader />;
}

/** Restricts a page by sign-in, role, and admin-controlled section visibility. */
export default function Gate({ children, roles, section, requireAuth }: { children: ReactNode; roles?: string[]; section?: SectionKey; requireAuth?: boolean }) {
  const { authLoading, signedIn, profile, canSee, profileError } = useApp();
  if (authLoading) return <FullLoader />;
  if (profile?.status === 'Banned' || profileError?.includes('suspended'))
    return <Notice icon={<ShieldOff />} title="Account suspended" body="This account has been suspended. Contact Press Play if you think this is a mistake." />;
  if (section && !canSee(section))
    return <Notice icon={<Lock />} title="Not available" body="This section isn't available for your account type right now." action={<Button asChild><Link to="/">Go home</Link></Button>} />;
  if ((requireAuth || roles) && !signedIn) return <SignInRedirect />;
  if (roles && signedIn && !profile) return <FullLoader />;
  if (roles && profile && !roles.includes(profile.role))
    return <Notice icon={<Lock />} title="Restricted area" body="Your account doesn't have access to this dashboard. Partner dashboards are invite-only." action={<Button asChild variant="outline"><Link to="/join">Have an invite code?</Link></Button>} />;
  return <>{children}</>;
}
