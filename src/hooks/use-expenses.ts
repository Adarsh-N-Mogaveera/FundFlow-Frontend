import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

// const API_BASE_URL = "http://localhost:8080/api/expenses";
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/expenses`;

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { token } = useAuth(); // Read the active JWT token
  
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${mm}`;
  });

  const fetchExpenses = useCallback(async () => {
    if (!token) return; // Don't fetch if user isn't logged in
    try {
      const [year, month] = selectedMonth.split("-");
      const url = `${API_BASE_URL}?year=${year}&month=${parseInt(month, 10)}`;
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}` // Attach token
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  }, [selectedMonth, token]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(expense),
      });
      if (response.ok) {
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  }, [fetchExpenses, token]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Omit<Expense, "id">>) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  }, [fetchExpenses, token]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  }, [fetchExpenses, token]);

  return { 
    expenses, 
    selectedMonth, 
    setSelectedMonth, 
    addExpense, 
    updateExpense, 
    deleteExpense 
  };
}