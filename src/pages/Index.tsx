import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useExpenses } from "@/hooks/use-expenses";
import { useBudgets } from "@/hooks/use-budgets";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { DollarSign, TrendingDown, Tag, Calendar, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { expenses, selectedMonth, setSelectedMonth } = useExpenses();
  const { budgets } = useBudgets();
  const { token } = useAuth();

  // AI input states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Convert "YYYY-MM" string from our hook into a standard JavaScript Date object
  const currentMonthDate = parseISO(`${selectedMonth}-01`);

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);

  // Filter expenses matching the active calendar view boundaries
  const monthExpenses = expenses.filter((e) => {
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const remaining = totalBudget - totalSpent;

  // AI Quick Log Trigger Method
  const handleAiQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !token) return;

    setIsAiLoading(true);
    const toastId = toast.loading("AI parsing and logging transaction...");

    try {
      const response = await fetch("http://localhost:8080/api/expenses/ai", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "Authorization": `Bearer ${token}`
        },
        body: aiPrompt,
      });

      if (response.ok) {
        const newExpense = await response.json();
        
        // Extract the target month formatted from the AI's generated response
        const targetMonth = format(parseISO(newExpense.date), "yyyy-MM");
        
        // Dynamically update the dashboard view focus to point to the parsed month!
        setSelectedMonth(targetMonth);
        setAiPrompt("");
        
        toast.success(
          `Success! Logged $${newExpense.amount.toFixed(2)} for "${newExpense.description}" under ${newExpense.category.toUpperCase()} on ${format(parseISO(newExpense.date), "MMM d, yyyy")}`, 
          { id: toastId }
        );
      } else {
        const errorMsg = await response.text();
        toast.error(errorMsg || "Failed to structure quick log.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error connecting to AI backend.", { id: toastId });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Top category tracking calculations
  const categoryTotals = CATEGORIES.map((c) => ({
    ...c,
    total: monthExpenses
      .filter((e) => e.category === c.value)
      .reduce((sum, e) => sum + e.amount, 0),
  })).sort((a, b) => b.total - a.total);

  const topCategory = categoryTotals[0];

  // Daily spending chart calculations
  const today = new Date();
  const endIntervalDate = monthEnd > today && isSameYearMonth(monthEnd, today) ? today : monthEnd;
  
  const days = eachDayOfInterval({ start: monthStart, end: endIntervalDate });
  const dailyData = days.map((day) => ({
    date: format(day, "MMM d"),
    amount: monthExpenses
      .filter((e) => format(parseISO(e.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  // Category pie chart rendering arrays
  const pieData = categoryTotals.filter((c) => c.total > 0);

  // Recent transactions array slice
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const getMonthOptions = () => {
    const options = [];
    const iteratorDate = new Date();
    for (let i = 0; i < 12; i++) {
      const year = iteratorDate.getFullYear();
      const monthStr = String(iteratorDate.getMonth() + 1).padStart(2, '0');
      const textLabel = iteratorDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value: `${year}-${monthStr}`, label: textLabel });
      iteratorDate.setMonth(iteratorDate.getMonth() - 1);
    }
    return options;
  };

  function isSameYearMonth(dateA: Date, dateB: Date) {
    return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth();
  }

  // Active tracking modes
  const isCurrentMonthActive = 
    currentMonthDate.getFullYear() === today.getFullYear() && 
    currentMonthDate.getMonth() === today.getMonth();

  let budgetCardTitle = "Remaining Budget";
  let budgetCardSubtitle = totalBudget > 0 ? `of $${totalBudget.toFixed(2)} budget` : "No budget set";
  let absoluteRemainingAmount = Math.abs(remaining);

  if (isCurrentMonthActive) {
    if (remaining < 0) {
      budgetCardTitle = "Exceeded by";
    } else {
      budgetCardTitle = "Remaining Budget";
    }
  } else {
    if (remaining < 0) {
      budgetCardTitle = "Budget Deficit";
      budgetCardSubtitle = `Overspent by $${absoluteRemainingAmount.toFixed(2)}`;
    } else {
      budgetCardTitle = "Budget Surplus";
      budgetCardSubtitle = `Saved $${absoluteRemainingAmount.toFixed(2)} of total budget`;
    }
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      
      {/* Title Segment Wrapper with Statement Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Manage your finances dynamically with AI assist.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm max-w-xs">
          <Calendar className="h-4 w-4 text-muted-foreground ml-1.5 flex-shrink-0" />
          <select
            id="statement-period"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-transparent text-sm font-medium focus:outline-none pr-8 cursor-pointer text-foreground"
          >
            {getMonthOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NEW: AI Quick Log Panel */}
      <Card className="border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/10 to-transparent shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center space-x-2">
          <div className="p-1.5 bg-indigo-500 rounded-md text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">AI Quick Log</CardTitle>
            <CardDescription className="text-xs">Type what you spent in plain English to automatically categorize and log it.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAiQuickLog} className="relative flex items-center">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={isAiLoading}
              placeholder='e.g., "Paid $24.50 for a burger and drinks with friends at Olive Garden"'
              className="w-full h-10 pl-3 pr-12 rounded-lg border border-gray-200 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground"
              required
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiPrompt.trim()}
              className="absolute right-1.5 p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-md text-white transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 pl-1">
            ⚡ Quick suggestions: "Gas station fill up cost me 45 dollars" • "Paid utility electric bill for 120"
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{format(currentMonthDate, "MMMM yyyy")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium transition-colors ${remaining < 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
              {budgetCardTitle}
            </CardTitle>
            <TrendingDown className={`h-4 w-4 transition-colors ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
              ${absoluteRemainingAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {budgetCardSubtitle}
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

      {/* Recent Transactions with Month headers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length > 0 ? (
            <div className="flex flex-col gap-1">
              {recentExpenses.map((e, index) => {
                const cat = CATEGORIES.find((c) => c.value === e.category);
                const currentExpenseDate = parseISO(e.date);
                
                const showMonthHeader =
                  index === 0 ||
                  format(parseISO(recentExpenses[index - 1].date), "yyyy-MM") !== format(currentExpenseDate, "yyyy-MM");

                return (
                  <div key={e.id}>
                    {showMonthHeader && (
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2.5 py-1 rounded w-fit mt-4 mb-2 first:mt-0">
                        {format(currentExpenseDate, "MMMM yyyy")}
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2 border-b border-muted/40 last:border-0 hover:bg-muted/10 px-1 rounded transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0">{cat?.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{e.description || cat?.label}</p>
                          <p className="text-xs text-muted-foreground">{format(currentExpenseDate, "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm text-foreground">-${e.amount.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No expenses recorded yet. Add one to get started!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;