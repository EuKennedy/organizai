import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Couple, CoupleMember } from "@/types";

interface CoupleContextValue {
  couple: Couple | null;
  members: CoupleMember[];
  partner: CoupleMember | null;
  loading: boolean;
  /** True when the current user has a couple but no partner yet. */
  isSolo: boolean;
  refetch: () => Promise<void>;
  /** Create a one-shot invite code (8 chars, 14d expiry). */
  createInvite: () => Promise<string>;
  /** Join the partner's couple via their code. Throws on invalid/used. */
  redeemInvite: (code: string) => Promise<void>;
  /** Update display name / avatar color for the current user. */
  updateMyProfile: (
    updates: Partial<Pick<CoupleMember, "display_name" | "avatar_color">>
  ) => Promise<void>;
  /** Update couple name / start_date. */
  updateCouple: (updates: Partial<Pick<Couple, "name" | "start_date" | "logo_url" | "accent_hue" | "iphone_partner_name" | "android_partner_name" | "monthly_capacity" | "date_tier_limits" | "date_weekly_quota">>) => Promise<void>;
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [members, setMembers] = useState<CoupleMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCouple = useCallback(async () => {
    if (!user) {
      setCouple(null);
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Find which couple the current user belongs to.
      const { data: memberRow } = await supabase
        .from("couple_members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!memberRow) {
        // The signup trigger should have created one — log and bail.
        console.warn("[couple] no couple_members row for current user");
        setCouple(null);
        setMembers([]);
        return;
      }

      const cid = (memberRow as CoupleMember).couple_id;

      const [coupleRes, membersRes] = await Promise.all([
        supabase.from("couples").select("*").eq("id", cid).maybeSingle(),
        supabase.from("couple_members").select("*").eq("couple_id", cid),
      ]);

      setCouple((coupleRes.data as Couple | null) ?? null);
      setMembers((membersRes.data as CoupleMember[] | null) ?? []);
    } catch (err) {
      console.error("[couple] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCouple();
  }, [fetchCouple]);

  // Realtime: any change to our couple/members → refetch.
  useEffect(() => {
    if (!couple) return;
    const ch = supabase
      .channel(`couple:${couple.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "couple_members", filter: `couple_id=eq.${couple.id}` },
        () => fetchCouple()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "couples", filter: `id=eq.${couple.id}` },
        () => fetchCouple()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [couple, fetchCouple]);

  const partner = useMemo(() => {
    if (!user) return null;
    return members.find((m) => m.user_id !== user.id) ?? null;
  }, [members, user]);

  const isSolo = !!couple && members.length <= 1;

  const createInvite = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.rpc("create_couple_invite");
    if (error) throw new Error(error.message);
    return data as string;
  }, []);

  const redeemInvite = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) throw new Error("Código vazio");
      const { error } = await supabase.rpc("redeem_couple_invite", {
        invite_code: trimmed,
      });
      if (error) throw new Error(error.message);
      await fetchCouple();
    },
    [fetchCouple]
  );

  const updateMyProfile = useCallback(
    async (
      updates: Partial<Pick<CoupleMember, "display_name" | "avatar_color">>
    ) => {
      if (!user) return;
      const { error } = await supabase
        .from("couple_members")
        .update(updates)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
      await fetchCouple();
    },
    [user, fetchCouple]
  );

  const updateCouple = useCallback(
    async (updates: Partial<Pick<Couple, "name" | "start_date" | "logo_url" | "accent_hue" | "iphone_partner_name" | "android_partner_name" | "monthly_capacity" | "date_tier_limits" | "date_weekly_quota">>) => {
      if (!couple) return;
      const { error } = await supabase
        .from("couples")
        .update(updates)
        .eq("id", couple.id);
      if (error) throw new Error(error.message);
      await fetchCouple();
    },
    [couple, fetchCouple]
  );

  const value: CoupleContextValue = {
    couple,
    members,
    partner,
    loading,
    isSolo,
    refetch: fetchCouple,
    createInvite,
    redeemInvite,
    updateMyProfile,
    updateCouple,
  };

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>;
}

export function useCouple() {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error("useCouple must be used within CoupleProvider");
  return ctx;
}

/**
 * Like useCouple but returns null instead of throwing when used outside the
 * provider (e.g. login page). Useful for components shared across logged-in
 * and logged-out trees.
 */
export function useOptionalCouple(): CoupleContextValue | null {
  return useContext(CoupleContext);
}

/** Convenience: read just the couple_id (or null while loading / no couple). */
export function useCoupleId(): string | null {
  const { couple } = useCouple();
  return couple?.id ?? null;
}
