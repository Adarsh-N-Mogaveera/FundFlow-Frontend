import { useState, useEffect, useCallback } from "react";
import { Budget, ExpenseCategory } from "@/lib/types";

const STORAGE_KEY = "expense-tracker-budgets";

function loadBudgets(): Budget[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>(loadBudgets);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  }, [budgets]);

  const setBudget = useCallback((category: ExpenseCategory, limit: number) => {
    setBudgets((prev) => {
      const existing = prev.findIndex((b) => b.category === category);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { category, limit };
        return updated;
      }
      return [...prev, { category, limit }];
    });
  }, []);

  const getBudget = useCallback(
    (category: ExpenseCategory) => budgets.find((b) => b.category === category),
    [budgets]
  );

  return { budgets, setBudget, getBudget };
}
