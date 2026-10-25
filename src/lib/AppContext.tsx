import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from 'zitejs/auth';
import { getMe, getSiteConfig, type GetMeOutputType } from 'zitejs/api';
import { parseVisibility, type Audience, type SectionKey, type Visibility } from './visibility';

export type Profile = GetMeOutputType['profile'];

type Ctx = {
  authLoading: boolean;
  signedIn: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  profileError: string | null;
  settings: Record<string, string>;
  visibility: Visibility;
  audience: Audience;
  canSee: (s: SectionKey) => boolean;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const refreshSettings = useCallback(async () => {
    try {
      const r = await getSiteConfig({});
      setSettings(r.settings);
    } catch {
      /* keep defaults */
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return setProfile(null);
    setProfileLoading(true);
    try {
      const r = await getMe({});
      setProfile(r.profile);
      setProfileError(null);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not load your account');
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => void refreshSettings(), [refreshSettings]);
  useEffect(() => void refreshProfile(), [refreshProfile]);

  const visibility = useMemo(() => parseVisibility(settings.visibility), [settings.visibility]);
  const audience: Audience = !profile
    ? 'guest'
    : profile.role === 'Admin'
      ? 'admin'
      : profile.role === 'Licensor'
        ? 'licensor'
        : profile.role === 'Advertiser'
          ? 'advertiser'
          : profile.tier === 'Premium'
            ? 'premium'
            : 'free';
  const canSee = useCallback((s: SectionKey) => audience === 'admin' || visibility[s]?.[audience] !== false, [audience, visibility]);

  return (
    <AppCtx.Provider
      value={{
        authLoading: isLoading || (!!user && profileLoading && !profile),
        signedIn: !!user,
        profile,
        profileLoading,
        profileError,
        settings,
        visibility,
        audience,
        canSee,
        refreshProfile,
        refreshSettings,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
