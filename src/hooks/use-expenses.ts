import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/lib/types";

const STORAGE_KEY = "expense-tracker-expenses";

function loadExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [
      { ...expense, id: crypto.randomUUID() },
      ...prev,
    ]);
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Omit<Expense, "id">>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { expenses, addExpense, updateExpense, deleteExpense };
}
