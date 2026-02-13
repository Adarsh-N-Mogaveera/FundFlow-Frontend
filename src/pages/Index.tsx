import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenses } from "@/hooks/use-expenses";
import { useBudgets } from "@/hooks/use-budgets";
import { CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { DollarSign, TrendingDown, Tag } from "lucide-react";

const Dashboard = () => {
  const { expenses } = useExpenses();
  const { budgets } = useBudgets();
  const [currentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthExpenses = expenses.filter((e) => {
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const remaining = totalBudget - totalSpent;

  // Top category
  const categoryTotals = CATEGORIES.map((c) => ({
    ...c,
    total: monthExpenses
      .filter((e) => e.category === c.value)
      .reduce((sum, e) => sum + e.amount, 0),
  })).sort((a, b) => b.total - a.total);

  const topCategory = categoryTotals[0];

  // Daily spending chart
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd > new Date() ? new Date() : monthEnd });
  const dailyData = days.map((day) => ({
    date: format(day, "MMM d"),
    amount: monthExpenses
      .filter((e) => format(parseISO(e.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  // Category pie data
  const pieData = categoryTotals.filter((c) => c.total > 0);

  // Recent transactions
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{format(currentMonth, "MMMM yyyy")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Budget</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : ""}`}>
              ${remaining.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 ? `of $${totalBudget.toFixed(2)} budget` : "No budget set"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topCategory && topCategory.total > 0 ? `${topCategory.icon} ${topCategory.label}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {topCategory && topCategory.total > 0 ? `$${topCategory.total.toFixed(2)}` : "No expenses yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.some((d) => d.amount > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]} />
                  <Bar dataKey="amount" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No spending data this month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="total"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.value} fill={CATEGORY_COLORS[entry.value as ExpenseCategory]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No expenses to show
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map((e) => {
                const cat = CATEGORIES.find((c) => c.value === e.category);
                return (
                  <div key={e.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat?.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{e.description || cat?.label}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(e.date), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <span className="font-medium">-${e.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No expenses recorded yet. Add one to get started!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
