// import { useState, useEffect, useCallback } from "react";
// import { Expense } from "@/lib/types";

// const STORAGE_KEY = "expense-tracker-expenses";

// function loadExpenses(): Expense[] {
//   try {
//     const data = localStorage.getItem(STORAGE_KEY);
//     return data ? JSON.parse(data) : [];
//   } catch {
//     return [];
//   }
// }

// export function useExpenses() {
//   const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);

//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
//   }, [expenses]);

//   const addExpense = useCallback((expense: Omit<Expense, "id">) => {
//     setExpenses((prev) => [
//       { ...expense, id: crypto.randomUUID() },
//       ...prev,
//     ]);
//   }, []);

//   const updateExpense = useCallback((id: string, updates: Partial<Omit<Expense, "id">>) => {
//     setExpenses((prev) =>
//       prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
//     );
//   }, []);

//   const deleteExpense = useCallback((id: string) => {
//     setExpenses((prev) => prev.filter((e) => e.id !== id));
//   }, []);

//   return { expenses, addExpense, updateExpense, deleteExpense };
// }

import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/lib/types";

const API_BASE_URL = "http://localhost:8080/api/expenses";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (response.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Omit<Expense, "id">>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  }, [fetchExpenses]);

  return { expenses, addExpense, updateExpense, deleteExpense };
}
