import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Transaction, FinancialGoal, GoalDeposit } from "@/types";

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      setTransactions((data as Transaction[] | null) ?? []);
    } catch (err) {
      console.error("[transactions] fetch failed", err);
    } finally {
      setLoading(false);
    }
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

/**
 * Goals + their deposits. A deposit is an atomic record of money added
 * (or initially seeded). The goal's current_amount is kept in sync with
 * the sum of deposits on every write.
 */
export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [deposits, setDeposits] = useState<GoalDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [goalsRes, depositsRes] = await Promise.all([
        supabase
          .from("financial_goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("goal_deposits")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setGoals((goalsRes.data as FinancialGoal[] | null) ?? []);
      setDeposits((depositsRes.data as GoalDeposit[] | null) ?? []);
    } catch (err) {
      console.error("[goals] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addGoal = async (
    g: Omit<FinancialGoal, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (!user) return;
    const { error } = await supabase.from("financial_goals").insert({ ...g, user_id: user.id });
    if (error) throw new Error(error.message);
    await fetchAll();
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    const { error } = await supabase.from("financial_goals").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    await fetchAll();
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("financial_goals").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchAll();
  };

  /** Register a deposit AND update the goal's current_amount. */
  const addDeposit = async (goalId: string, amount: number, note?: string) => {
    if (!user) throw new Error("Não autenticado");
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Valor inválido");
    }
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) throw new Error("Meta não encontrada");

    const { error: insertError } = await supabase.from("goal_deposits").insert({
      user_id: user.id,
      goal_id: goalId,
      amount,
      note: note?.trim() || null,
    });
    if (insertError) throw new Error(insertError.message);

    const newAmount = Number(goal.current_amount) + amount;
    const { error: updateError } = await supabase
      .from("financial_goals")
      .update({ current_amount: newAmount })
      .eq("id", goalId);
    if (updateError) throw new Error(updateError.message);

    await fetchAll();
  };

  /** Remove a deposit AND decrement the goal's current_amount. */
  const deleteDeposit = async (depositId: string) => {
    const deposit = deposits.find((d) => d.id === depositId);
    if (!deposit) throw new Error("Depósito não encontrado");
    const goal = goals.find((g) => g.id === deposit.goal_id);
    if (!goal) throw new Error("Meta não encontrada");

    const { error: deleteError } = await supabase
      .from("goal_deposits")
      .delete()
      .eq("id", depositId);
    if (deleteError) throw new Error(deleteError.message);

    const newAmount = Math.max(Number(goal.current_amount) - Number(deposit.amount), 0);
    const { error: updateError } = await supabase
      .from("financial_goals")
      .update({ current_amount: newAmount })
      .eq("id", goal.id);
    if (updateError) throw new Error(updateError.message);

    await fetchAll();
  };

  /** Deposits grouped by goal_id, ordered by newest first (via server order). */
  const depositsByGoal: Record<string, GoalDeposit[]> = useMemo(() => {
    const map: Record<string, GoalDeposit[]> = {};
    for (const d of deposits) {
      (map[d.goal_id] ??= []).push(d);
    }
    return map;
  }, [deposits]);

  return {
    goals,
    deposits,
    depositsByGoal,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    addDeposit,
    deleteDeposit,
    refetch: fetchAll,
  };
}
