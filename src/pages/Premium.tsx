import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirmCheckout, createSubscriptionCheckout } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { PageHeader } from '../components/Gate';
import { useApp } from '../lib/AppContext';
import { errMsg, openExternal } from '../lib/util';

const PERKS = ['No pre-roll ads, ever', 'Premium-only episodes', 'Early access to new releases', 'Support official localization'];

export default function Premium() {
  const { profile, refreshProfile } = useApp();
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get('ref') ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sid = params.get('checkout');
    if (!sid) return;
    confirmCheckout({ sessionId: sid })
      .then((r) => (r.kind === 'subscription' ? toast.success('Welcome to Premium! 🎉') : toast('Checkout not completed.')))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => { setParams({}, { replace: true }); refreshProfile(); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subscribe = async () => {
    setBusy(true);
    try {
      const r = await createSubscriptionCheckout({ code: code.trim() || undefined, returnUrl: window.location.origin + '/premium' });
      openExternal(r.url);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const isPremium = profile?.tier === 'Premium';
  return (
    <>
      <PageHeader eyebrow="Membership" title={<>Go <span className="text-gradient">Premium</span></>}>Watch everything ad-free and directly support official anime releases.</PageHeader>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="neon-card p-8 w-full max-w-md border-primary/50" style={{ boxShadow: 'var(--shadow-glow)' }}>
          <Crown className="h-8 w-8 text-primary" />
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-7xl">$8</span>
            <span className="text-muted-foreground">/ month</span>
          </div>
          <ul className="mt-6 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary mt-0.5" />{p}</li>
            ))}
          </ul>
          {isPremium ? (
            <p className="mt-8 text-center text-primary font-tech text-xs uppercase tracking-widest">You're Premium — thank you!</p>
          ) : (
            <div className="mt-8 space-y-3">
              <Input placeholder="Coupon or referral code (optional)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <Button className="w-full h-11 font-tech text-xs uppercase tracking-widest" onClick={subscribe} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe with card'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Secure checkout by Stripe. Cancel anytime from your account.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
