import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getDb } from '@/db';
import {
  getUserProfile,
  saveUserProfile,
  type UserProfile,
  type UserProfileInput,
} from '@/db/profile';
import { ensureDocumentStorage } from '@/services/document-storage';

type ProfileContextValue = {
  profile: UserProfile | null;
  ready: boolean;
  saveProfile: (input: UserProfileInput) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        ensureDocumentStorage();
        await getDb();
        setProfile(await getUserProfile());
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      ready,
      saveProfile: async (input) => {
        await saveUserProfile(input);
        setProfile(await getUserProfile());
      },
    }),
    [profile, ready]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}
