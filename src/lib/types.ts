export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO date string
  description: string;
}

export type ExpenseCategory =
  | "food"
  | "transport"
  | "housing"
  | "entertainment"
  | "shopping"
  | "health"
  | "utilities"
  | "other";

export interface Budget {
  category: ExpenseCategory;
  limit: number;
}

export const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: "food", label: "Food", icon: "🍕" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "housing", label: "Housing", icon: "🏠" },
  { value: "entertainment", label: "Entertainment", icon: "🎬" },
  { value: "shopping", label: "Shopping", icon: "🛍️" },
  { value: "health", label: "Health", icon: "💊" },
  { value: "utilities", label: "Utilities", icon: "💡" },
  { value: "other", label: "Other", icon: "📦" },
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "hsl(24, 80%, 55%)",
  transport: "hsl(210, 70%, 50%)",
  housing: "hsl(150, 60%, 40%)",
  entertainment: "hsl(280, 60%, 55%)",
  shopping: "hsl(340, 70%, 55%)",
  health: "hsl(0, 70%, 55%)",
  utilities: "hsl(45, 80%, 50%)",
  other: "hsl(200, 15%, 55%)",
};

export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}