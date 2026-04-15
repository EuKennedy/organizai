import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Transaction, FinancialGoal } from "@/types";

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    setTransactions((data as Transaction[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (t: Omit<Transaction, "id" | "user_id" | "created_at">) => {
    if (!user) return;
    const { error } = await supabase.from("transactions").insert({ ...t, user_id: user.id });
    if (error) throw new Error(error.message);
    await fetchTransactions();
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchTransactions();
  };

  return { transactions, loading, addTransaction, deleteTransaction, refetch: fetchTransactions };
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("financial_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals((data as FinancialGoal[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (g: Omit<FinancialGoal, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("financial_goals").insert({ ...g, user_id: user.id });
    if (error) throw new Error(error.message);
    await fetchGoals();
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    const { error } = await supabase.from("financial_goals").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    await fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("financial_goals").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchGoals();
  };

  return { goals, loading, addGoal, updateGoal, deleteGoal, refetch: fetchGoals };
}
