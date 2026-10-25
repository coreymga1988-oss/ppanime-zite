import { Ban, Check, Copy, Crown, Mail, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { adminSave } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import ResourceManager, { type Row } from './ResourceManager';
import { errMsg, money } from '../../lib/util';

const date = (v?: string) => (v ? format(new Date(v), 'MMM d, yyyy') : '');
const pill = (v?: string) => (v ? <Badge variant={['Active', 'Approved', 'Published', 'Paid', 'Premium', 'Accepted'].includes(v) ? 'default' : v === 'Banned' || v === 'Rejected' || v === 'Revoked' ? 'destructive' : 'secondary'}>{v}</Badge> : null);

async function quick(table: Parameters<typeof adminSave>[0]['table'], id: string, record: Row, reload: () => void, msg: string) {
  try { await adminSave({ table, id, record }); toast.success(msg); reload(); } catch (e) { toast.error(errMsg(e)); }
}

export function UsersManager() {
  return (
    <ResourceManager
      table="profiles"
      title="Users"
      canCreate={false}
      searchKeys={['username', 'displayName', 'email', 'role', 'tier', 'status', 'company']}
      columns={[
        { key: 'username', label: 'Username' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role', render: (r) => pill(r.role) },
        { key: 'tier', label: 'Tier', render: (r) => pill(r.tier) },
        { key: 'status', label: 'Status', render: (r) => pill(r.status) },
        { key: 'joinedAt', label: 'Joined', render: (r) => date(r.joinedAt) },
      ]}
      fields={[
        { key: 'email', label: 'Sign-in email', type: 'readonly' },
        { key: 'username', label: 'Username', type: 'text', required: true },
        { key: 'displayName', label: 'Display name', type: 'text' },
        { key: 'role', label: 'Role', type: 'select', options: ['Viewer', 'Advertiser', 'Licensor', 'Moderator', 'Admin'], required: true },
        { key: 'tier', label: 'Tier', type: 'select', options: ['Free', 'Premium'] },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Banned'] },
        { key: 'cancelStripe', label: 'Also cancel Stripe subscription when set to Free', type: 'checkbox' },
        { key: 'company', label: 'Company', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'avatarUrl', label: 'Avatar', type: 'upload', accept: 'image/*' },
        { key: 'bio', label: 'Bio', type: 'textarea' },
        { key: 'referralCode', label: 'Referral code', type: 'text' },
        { key: 'referredBy', label: 'Referred by', type: 'text' },
        { key: 'stripeCustomerId', label: 'Stripe customer ID', type: 'text' },
        { key: 'stripeSubscriptionId', label: 'Stripe subscription ID', type: 'text' },
      ]}
      rowActions={(r, reload) => (
        <>
          <Button size="icon" variant="ghost" title={r.tier === 'Premium' ? 'Make Free' : 'Make Premium'} onClick={() => quick('profiles', r.id, { tier: r.tier === 'Premium' ? 'Free' : 'Premium' }, reload, 'Tier changed')}>
            <Crown className={`h-4 w-4 ${r.tier === 'Premium' ? 'text-primary' : ''}`} />
          </Button>
          <Button size="icon" variant="ghost" title={r.status === 'Banned' ? 'Unban' : 'Ban'} onClick={() => quick('profiles', r.id, { status: r.status === 'Banned' ? 'Active' : 'Banned' }, reload, r.status === 'Banned' ? 'User unbanned' : 'User banned')}>
            {r.status === 'Banned' ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4 text-destructive" />}
          </Button>
        </>
      )}
    />
  );
}

export function SeriesManager() {
  return (
    <div className="space-y-12">
      <ResourceManager
        table="series"
        title="Series"
        defaults={{ status: 'Draft', revenueShare: 0.5 }}
        columns={[{ key: 'title', label: 'Title' }, { key: 'genres', label: 'Genres' }, { key: 'status', label: 'Status', render: (r) => pill(r.status) }, { key: 'revenueShare', label: 'Licensor share', render: (r) => `${Math.round((r.revenueShare ?? 0) * 100)}%` }]}
        fields={[
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'genres', label: 'Genres', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Published'] },
          { key: 'licensor', label: 'Licensor', type: 'link', linkTable: 'profiles', linkLabel: 'username' },
          { key: 'revenueShare', label: 'Licensor revenue share (%)', type: 'percent' },
          { key: 'coverImageUrl', label: 'Cover image', type: 'upload', accept: 'image/*' },
          { key: 'synopsis', label: 'Synopsis', type: 'textarea' },
        ]}
      />
      <ResourceManager
        table="episodes"
        title="Episodes"
        defaults={{ premiumOnly: false, views: 0 }}
        columns={[{ key: 'title', label: 'Title' }, { key: 'episodeNumber', label: '#' }, { key: 'premiumOnly', label: 'Premium', render: (r) => (r.premiumOnly ? 'Yes' : 'No') }, { key: 'views', label: 'Views' }]}
        fields={[
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'series', label: 'Series', type: 'link', linkTable: 'series', required: true },
          { key: 'episodeNumber', label: 'Episode #', type: 'number' },
          { key: 'durationMinutes', label: 'Duration (min)', type: 'number' },
          { key: 'premiumOnly', label: 'Premium only', type: 'checkbox' },
          { key: 'views', label: 'Views', type: 'number' },
          { key: 'videoUrl', label: 'Video (upload or YouTube URL)', type: 'upload', accept: 'video/*', required: true },
          { key: 'midRollTimes', label: 'Mid-roll ad breaks (e.g. 7:30, 15:00) — native uploads only', type: 'text' },
          { key: 'disablePostRoll', label: 'No end-roll ad for this episode', type: 'checkbox' },
          { key: 'thumbnailUrl', label: 'Thumbnail', type: 'upload', accept: 'image/*' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]}
      />
    </div>
  );
}

export function AdsManager() {
  return (
    <ResourceManager
      table="ads"
      title="Ads"
      defaults={{ status: 'Approved', deliveredViews: 0, cpm: 10 }}
      searchKeys={['title', 'status', 'contactName', 'contactEmail']}
      columns={[
        { key: 'title', label: 'Ad' },
        { key: 'status', label: 'Status', render: (r) => pill(r.status) },
        { key: 'placement', label: 'Slot', render: (r) => String(r.placement ?? 'Any') },
        { key: 'contactName', label: 'Submitted by', render: (r) => <span>{r.contactName}<br /><span className="text-xs text-muted-foreground">{r.contactEmail} {r.contactPhone}</span></span> },
        { key: 'deliveredViews', label: 'Delivery', render: (r) => `${r.deliveredViews ?? 0} / ${r.targetViews ?? 0}` },
        { key: 'budget', label: 'Budget', render: (r) => money(r.budget ?? 0) },
      ]}
      fields={[
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Rejected', 'Paused'] },
        { key: 'placement', label: 'Ad slot (Any = pre, mid or end of episode)', type: 'select', options: ['Any', 'Pre-roll', 'Mid-roll', 'Post-roll'] },
        { key: 'advertiser', label: 'Advertiser account', type: 'link', linkTable: 'profiles', linkLabel: 'username' },
        { key: 'videoUrl', label: 'Ad video (preview the URL before approving)', type: 'upload', accept: 'video/*', required: true },
        { key: 'clickUrl', label: 'Click URL', type: 'text' },
        { key: 'targetViews', label: 'Target views', type: 'number' },
        { key: 'deliveredViews', label: 'Delivered views', type: 'number' },
        { key: 'budget', label: 'Budget ($)', type: 'number' },
        { key: 'cpm', label: 'CPM ($ per 1000 views)', type: 'number' },
        { key: 'contactName', label: 'Contact name', type: 'text' },
        { key: 'contactEmail', label: 'Contact email', type: 'text' },
        { key: 'contactPhone', label: 'Contact phone', type: 'text' },
        { key: 'notes', label: 'Advertiser notes', type: 'textarea' },
        { key: 'adminFeedback', label: 'Feedback to advertiser', type: 'textarea' },
      ]}
      rowActions={(r, reload) => (
        <>
          {r.videoUrl && <Button size="sm" variant="ghost" asChild><a href={r.videoUrl} target="_blank" rel="noopener noreferrer">Preview</a></Button>}
          {r.status !== 'Approved' && <Button size="icon" variant="ghost" title="Approve" onClick={() => quick('ads', r.id, { status: 'Approved' }, reload, 'Ad approved')}><Check className="h-4 w-4 text-primary" /></Button>}
          {r.status === 'Pending' && <Button size="icon" variant="ghost" title="Reject" onClick={() => quick('ads', r.id, { status: 'Rejected' }, reload, 'Ad rejected')}><X className="h-4 w-4 text-destructive" /></Button>}
        </>
      )}
    />
  );
}

export function CampaignsManager() {
  return (
    <div className="space-y-12">
      <ResourceManager
        table="campaigns"
        title="Campaigns"
        defaults={{ status: 'Draft' }}
        columns={[{ key: 'title', label: 'Title' }, { key: 'status', label: 'Status', render: (r) => pill(r.status) }, { key: 'goal', label: 'Goal', render: (r) => money(r.goal ?? 0) }, { key: 'endDate', label: 'Ends', render: (r) => date(r.endDate) }]}
        fields={[
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Funded', 'Closed'] },
          { key: 'goal', label: 'Goal ($)', type: 'number', required: true },
          { key: 'endDate', label: 'End date', type: 'date' },
          { key: 'imageUrl', label: 'Image', type: 'upload', accept: 'image/*' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]}
      />
      <ResourceManager
        table="rewardTiers"
        title="Reward Tiers"
        columns={[{ key: 'name', label: 'Name' }, { key: 'amount', label: 'Amount', render: (r) => money(r.amount ?? 0) }, { key: 'limit', label: 'Limit' }]}
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'campaign', label: 'Campaign', type: 'link', linkTable: 'campaigns', required: true },
          { key: 'amount', label: 'Amount ($)', type: 'number', required: true },
          { key: 'limit', label: 'Quantity limit', type: 'number' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]}
      />
      <ResourceManager
        table="pledges"
        title="Pledges"
        canCreate={false}
        columns={[{ key: 'reference', label: 'Pledge' }, { key: 'amount', label: 'Amount', render: (r) => money(r.amount ?? 0, 2) }, { key: 'status', label: 'Status', render: (r) => pill(r.status) }, { key: 'createdAt', label: 'Date', render: (r) => date(r.createdAt) }]}
        fields={[
          { key: 'reference', label: 'Reference', type: 'text' },
          { key: 'amount', label: 'Amount', type: 'number' },
          { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Paid', 'Refunded'] },
          { key: 'stripeSessionId', label: 'Stripe session', type: 'readonly' },
        ]}
      />
    </div>
  );
}

export function NewsManager() {
  return (
    <ResourceManager
      table="newsPosts"
      title="News Posts"
      defaults={{ published: true }}
      columns={[{ key: 'title', label: 'Title' }, { key: 'published', label: 'Published', render: (r) => (r.published ? 'Yes' : 'Draft') }, { key: 'createdAt', label: 'Date', render: (r) => date(r.createdAt) }]}
      fields={[
        { key: 'title', label: 'Title', type: 'text', required: true, full: true },
        { key: 'published', label: 'Published', type: 'checkbox' },
        { key: 'imageUrl', label: 'Image', type: 'upload', accept: 'image/*' },
        { key: 'body', label: 'Body', type: 'textarea', required: true },
      ]}
    />
  );
}

export function CouponsManager() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Discount codes are created in Stripe automatically when payments are switched on. Mark one coupon as <b>Referral</b> — it's applied whenever someone uses another member's referral code.</p>
      <ResourceManager
        table="coupons"
        title="Coupons"
        defaults={{ kind: 'Discount', duration: 'once', active: true, timesRedeemed: 0 }}
        columns={[{ key: 'code', label: 'Code' }, { key: 'kind', label: 'Kind' }, { key: 'percentOff', label: 'Discount', render: (r) => (r.percentOff ? `${r.percentOff}%` : r.amountOff ? money(r.amountOff, 2) : '') }, { key: 'timesRedeemed', label: 'Used' }, { key: 'active', label: 'Active', render: (r) => (r.active ? 'Yes' : 'No') }]}
        fields={[
          { key: 'code', label: 'Code', type: 'text', required: true },
          { key: 'kind', label: 'Kind', type: 'select', options: ['Discount', 'Referral'] },
          { key: 'percentOff', label: 'Percent off', type: 'number' },
          { key: 'amountOff', label: 'Amount off ($)', type: 'number' },
          { key: 'duration', label: 'Duration', type: 'select', options: ['once', 'repeating', 'forever'] },
          { key: 'durationMonths', label: 'Months (if repeating)', type: 'number' },
          { key: 'maxRedemptions', label: 'Max redemptions', type: 'number' },
          { key: 'timesRedeemed', label: 'Times redeemed', type: 'number' },
          { key: 'active', label: 'Active', type: 'checkbox' },
          { key: 'stripeCouponId', label: 'Stripe coupon ID', type: 'text' },
        ]}
      />
    </div>
  );
}

const inviteLink = (r: Row) => `${window.location.origin}/join?invite=${r.code}`;
const mailto = (r: Row) =>
  `mailto:${r.email}?subject=${encodeURIComponent(`Your Press Play ${r.role} invite`)}&body=${encodeURIComponent(
    `Hi${r.company ? ` ${r.company}` : ''},

You've been invited to join Press Play Anime as a ${r.role}.\n\n1. Open ${inviteLink(r)}\n2. Sign in with this email address (${r.email})\n3. Your invite code is: ${r.code}\n\nSee you there!\nPress Play International Media`,
  )}`;

export function InvitesManager() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Advertisers, licensors and admins can only join by invite. Create an invite, then email it — the code unlocks the right dashboard when they sign in with that email.</p>
      <ResourceManager
        table="invites"
        title="Invites"
        defaults={{ role: 'Advertiser' }}
        columns={[{ key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'code', label: 'Code', render: (r) => <span className="font-tech text-xs">{r.code}</span> }, { key: 'status', label: 'Status', render: (r) => pill(r.status) }]}
        fields={[
          { key: 'email', label: 'Email', type: 'text', required: true },
          { key: 'role', label: 'Role', type: 'select', options: ['Advertiser', 'Licensor', 'Moderator', 'Admin'], required: true },
          { key: 'company', label: 'Company', type: 'text' },
          { key: 'code', label: 'Code (auto-generated if blank)', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Accepted', 'Revoked'] },
        ]}
        rowActions={(r) =>
          r.status === 'Pending' ? (
            <>
              <Button size="icon" variant="ghost" title="Copy invite link" onClick={() => { navigator.clipboard.writeText(inviteLink(r)); toast.success('Invite link copied'); }}><Copy className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title="Email invite" asChild><a href={mailto(r)}><Mail className="h-4 w-4 text-primary" /></a></Button>
            </>
          ) : null
        }
      />
    </div>
  );
}

export function MailingManager() {
  return (
    <ResourceManager
      table="mailingList"
      title="Mailing List"
      columns={[{ key: 'email', label: 'Email' }, { key: 'name', label: 'Name' }, { key: 'source', label: 'Source' }, { key: 'subscribedAt', label: 'Joined', render: (r) => date(r.subscribedAt) }]}
      fields={[{ key: 'email', label: 'Email', type: 'text', required: true }, { key: 'name', label: 'Name', type: 'text' }, { key: 'source', label: 'Source', type: 'text' }]}
    />
  );
}
