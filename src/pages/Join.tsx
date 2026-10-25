import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { redeemInvite } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { useApp } from '../lib/AppContext';
import { errMsg } from '../lib/util';

const HOME: Record<string, string> = { Advertiser: '/advertiser', Licensor: '/licensor', Admin: '/admin' };

export default function Join() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('invite') ?? '');
  const [busy, setBusy] = useState(false);
  const { refreshProfile } = useApp();
  const nav = useNavigate();

  const redeem = async () => {
    setBusy(true);
    try {
      const r = await redeemInvite({ code });
      await refreshProfile();
      toast.success(`Welcome! Your ${r.role} account is ready.`);
      nav(HOME[r.role] ?? '/');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 flex justify-center">
      <div className="neon-card p-8 w-full max-w-md text-center space-y-4">
        <KeyRound className="h-8 w-8 text-primary mx-auto" />
        <h1 className="font-display text-4xl">Partner Invite</h1>
        <p className="text-sm text-muted-foreground">Advertiser, licensor and admin accounts are invite-only. Enter the code from your invitation email.</p>
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="INVITE CODE" className="text-center font-tech tracking-widest" />
        <Button className="w-full" disabled={code.trim().length < 4 || busy} onClick={redeem}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          'Redeem invite'
        </Button>
      </div>
    </div>
  );
}
