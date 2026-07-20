import { useState } from "react";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useExpenses } from "@/hooks/use-expenses";
import { useBudgets } from "@/hooks/use-budgets";
import { CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const BudgetPage = () => {
  const { expenses } = useExpenses();
  const { budgets, setBudget, getBudget } = useBudgets();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthExpenses = expenses.filter((e) => {
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  });

  const getSpent = (category: ExpenseCategory) =>
    monthExpenses.filter((e) => e.category === category).reduce((s, e) => s + e.amount, 0);

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Budget</h1>

      {/* Overall */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Overall Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>${totalSpent.toFixed(2)} spent</span>
            <span>{totalBudget > 0 ? `$${totalBudget.toFixed(2)} total` : "No budgets set"}</span>
          </div>
          <Progress
            value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}
            className="h-3"
          />
        </CardContent>
      </Card>

      {/* Per Category */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const budget = getBudget(cat.value);
          const spent = getSpent(cat.value);
          const limit = budget?.limit || 0;
          const pct = limit > 0 ? (spent / limit) * 100 : 0;
          const statusColor = pct >= 100 ? "text-destructive" : pct >= 80 ? "text-warning" : "";

          return (
            <Card key={cat.value}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <span>{cat.icon}</span> {cat.label}
                  </span>
                  <span className={cn("text-sm font-medium", statusColor)}>
                    {limit > 0 ? `${pct.toFixed(0)}%` : "No Budget Set"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="w-16 shrink-0 text-xs text-muted-foreground">Limit $</Label>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    className="h-8 text-sm"
                    placeholder="0"
                    value={limit || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setBudget(cat.value, val);
                    }}
                  />
                </div>

                {limit > 0 && (
                  <>
                    <Progress
                      value={Math.min(pct, 100)}
                      className={cn(
                        "h-2",
                        pct >= 100 ? "[&>div]:bg-destructive" : pct >= 80 ? "[&>div]:bg-warning" : "[&>div]:bg-primary"
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      ${spent.toFixed(2)} of ${limit.toFixed(2)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetPage;
