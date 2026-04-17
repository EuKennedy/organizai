import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Hard ceilings so the UI never hangs forever. */
const SESSION_RESTORE_TIMEOUT_MS = 8000;
const SIGNIN_TIMEOUT_MS = 15000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`__timeout__:${label}`)),
      ms
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message.startsWith("__timeout__")) {
      return "Tempo esgotado. Verifique sua conexão e tente de novo.";
    }
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      return "Sem conexão com o servidor. Tente novamente.";
    }
    return err.message;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let restored = false;

    const applySession = (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      restored = true;
    };

    // Watchdog: if Supabase.getSession() hangs, unblock the UI anyway.
    const watchdog = setTimeout(() => {
      if (!restored) {
        console.warn("[auth] getSession timeout — proceeding without session");
        setLoading(false);
      }
    }, SESSION_RESTORE_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch((err) => {
        console.error("[auth] getSession failed", err);
        setLoading(false);
        restored = true;
      });

    // Subscribe to EVERY auth change (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
    // This keeps user/session in sync across the app's lifetime — not just
    // during the initial restore.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      applySession(s);
    });

    return () => {
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        SIGNIN_TIMEOUT_MS,
        "signIn"
      );
      if (error) {
        // Normalize the most common Supabase messages to Portuguese.
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid login credentials")) {
          return { error: "Email ou senha incorretos" };
        }
        if (msg.includes("email not confirmed")) {
          return { error: "Confirme seu email antes de entrar" };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      return { error: friendlyError(err, "Erro ao entrar") };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({ email, password }),
        SIGNIN_TIMEOUT_MS,
        "signUp"
      );
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: friendlyError(err, "Erro ao criar conta") };
    }
  };

  const signOut = async () => {
    try {
      await withTimeout(supabase.auth.signOut(), SIGNIN_TIMEOUT_MS, "signOut");
    } catch (err) {
      console.error("[auth] signOut failed", err);
      // Still clear local state so the user isn't stuck.
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
