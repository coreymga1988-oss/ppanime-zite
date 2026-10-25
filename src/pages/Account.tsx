import { useEffect, useState } from 'react';
import { Copy, CreditCard, Crown, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from 'zitejs/auth';
import { deleteMyAccount, openBillingPortal, syncSubscription, updateMyProfile } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Badge } from '@project/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import { PageHeader } from '../components/Gate';
import UploadField from '../components/UploadField';
import { useApp } from '../lib/AppContext';
import { errMsg, openExternal } from '../lib/util';

function ProfileForm() {
  const { profile, refreshProfile } = useApp();
  const { user } = useAuth();
  const [f, setF] = useState({ username: '', displayName: '', firstName: '', lastName: '', bio: '', avatarUrl: '', company: '', phone: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (profile)
      setF({ username: profile.username, displayName: profile.displayName, firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', bio: profile.bio, avatarUrl: profile.avatarUrl, company: profile.company, phone: profile.phone });
  }, [profile, user]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const usernameErr = f.username.trim().length < 2 ? 'At least 2 characters' : !/^[a-zA-Z0-9_.-]+$/.test(f.username.trim()) ? 'Letters, numbers, _ . - only' : '';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameErr) return;
    setBusy(true);
    try {
      await updateMyProfile(f);
      await refreshProfile();
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="neon-card p-6 space-y-4">
      <h2 className="font-display text-3xl">Profile</h2>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full border border-border overflow-hidden bg-secondary shrink-0">
          {f.avatarUrl && <img src={f.avatarUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1"><Label>Avatar</Label><UploadField value={f.avatarUrl} onChange={(v) => setF({ ...f, avatarUrl: v })} accept="image/*" /></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><Label>Username</Label><Input value={f.username} onChange={set('username')} />{usernameErr && <p className="text-xs text-destructive mt-1">{usernameErr}</p>}</div>
        <div><Label>Display name</Label><Input value={f.displayName} onChange={set('displayName')} /></div>
        <div><Label>First name</Label><Input value={f.firstName} onChange={set('firstName')} /></div>
        <div><Label>Last name</Label><Input value={f.lastName} onChange={set('lastName')} /></div>
        <div><Label>Email (sign-in)</Label><Input value={profile?.email ?? ''} disabled /></div>
        <div><Label>Phone</Label><Input value={f.phone} onChange={set('phone')} /></div>
        <div className="sm:col-span-2"><Label>Company</Label><Input value={f.company} onChange={set('company')} /></div>
        <div className="sm:col-span-2"><Label>Bio</Label><Textarea value={f.bio} onChange={set('bio')} rows={3} /></div>
      </div>
      <p className="text-xs text-muted-foreground">Your email is your sign-in (magic link or Google), so there's no password to manage.</p>
      <Button type="submit" disabled={busy || !!usernameErr}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save profile</Button>
    </form>
  );
}

function Membership() {
  const { profile, refreshProfile } = useApp();
  const [busy, setBusy] = useState('');
  const portal = async () => {
    setBusy('portal');
    try { openExternal((await openBillingPortal({ returnUrl: window.location.href })).url); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };
  const sync = async () => {
    setBusy('sync');
    try { await syncSubscription({}); await refreshProfile(); toast.success('Membership refreshed'); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };
  const refLink = `${window.location.origin}/premium?ref=${profile?.referralCode ?? ''}`;
  return (
    <div className="neon-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl">Membership</h2>
        <Badge variant={profile?.tier === 'Premium' ? 'default' : 'secondary'} className="gap-1">{profile?.tier === 'Premium' && <Crown className="h-3 w-3" />}{profile?.tier}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">Role: {profile?.role}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={portal} disabled={!!busy}>{busy === 'portal' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}Payment methods & billing</Button>
        {profile?.hasSubscription && <Button variant="ghost" onClick={sync} disabled={!!busy}>Refresh status</Button>}
      </div>
      {profile?.referralCode && (
        <div>
          <Label>Your referral link</Label>
          <div className="flex gap-2"><Input readOnly value={refLink} /><Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(refLink); toast.success('Copied'); }}><Copy className="h-4 w-4" /></Button></div>
        </div>
      )}
    </div>
  );
}

function DangerZone() {
  const [busy, setBusy] = useState(false);
  const del = async () => {
    setBusy(true);
    try { await deleteMyAccount({ confirm: 'DELETE' }); toast.success('Account deleted'); window.location.href = '/'; } catch (e) { toast.error(errMsg(e)); setBusy(false); }
  };
  return (
    <div className="neon-card p-6 border-destructive/40 space-y-3">
      <h2 className="font-display text-3xl text-destructive">Delete account</h2>
      <p className="text-sm text-muted-foreground">Permanently removes your profile, pledges and ads, and cancels any subscription.</p>
      <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="destructive" disabled={busy}><Trash2 className="h-4 w-4" />Delete my account</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete your account?</AlertDialogTitle><AlertDialogDescription>This can't be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Account() {
  const { profile } = useApp();
  return (
    <>
      <PageHeader eyebrow="Your Account" title="Account Settings" />
      <div className="container mx-auto px-4 py-10 grid lg:grid-cols-[1fr_380px] gap-6">
        <ProfileForm />
        <div className="space-y-6"><Membership />{profile?.role !== 'Admin' && <DangerZone />}</div>
      </div>
    </>
  );
}
