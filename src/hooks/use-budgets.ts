import { useState, useEffect, useCallback } from "react";
import { Budget, ExpenseCategory } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/budgets`;

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const { token } = useAuth();

  const fetchBudgets = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const setBudget = useCallback(async (category: ExpenseCategory, limit: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${category}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ category, limit }),
      });
      if (response.ok) {
        await fetchBudgets();
      }
    } catch (error) {
      console.error("Error setting budget:", error);
    }
  }, [fetchBudgets, token]);

  const getBudget = useCallback(
    (category: ExpenseCategory) => budgets.find((b) => b.category === category),
    [budgets]
  );

  return { budgets, setBudget, getBudget };
}