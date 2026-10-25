import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { joinMailingList } from 'zitejs/api';

const schema = z.string().email();

export default function MailingListForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = schema.safeParse(email.trim()).success;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      const r = await joinMailingList({ email: email.trim(), source: 'footer' });
      toast.success(r.alreadySubscribed ? "You're already on the list!" : 'Welcome aboard! You’re on the list.');
      setEmail('');
    } catch {
      toast.error('Could not subscribe right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="neon-card p-6 sm:p-8 max-w-2xl mx-auto text-center">
      <Mail className="mx-auto h-7 w-7 text-primary mb-3" />
      <h3 className="font-display text-3xl">Join the Mailing List</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5">Release news, beta invites, and crowdfunding drops — straight to your inbox.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        <Button type="submit" disabled={!valid || busy} className="h-11 font-tech text-xs tracking-widest uppercase">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </Button>
      </div>
      {email && !valid && <p className="text-xs text-destructive mt-2 text-left">Enter a valid email address.</p>}
    </form>
  );
}
