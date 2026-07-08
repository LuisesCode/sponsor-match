import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getDb } from "@/db/client";
import { getProfileById } from "@/db/repositories/profiles";
import { getSessionProfileId, setSessionProfileId, clearSession } from "./session";
import type { Profile } from "@/lib/types";

type SessionState = {
  profile: Profile | null;
  loading: boolean;
  login: (profileId: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const id = getSessionProfileId();
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const db = await getDb();
    setProfile(getProfileById(db, id));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const login = useCallback(
    async (profileId: string) => {
      setSessionProfileId(profileId);
      await load();
    },
    [load]
  );

  const logout = useCallback(() => {
    clearSession();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ profile, loading, login, logout, refresh: load }),
    [profile, loading, login, logout, load]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession muss innerhalb von <SessionProvider> verwendet werden.");
  return ctx;
}
