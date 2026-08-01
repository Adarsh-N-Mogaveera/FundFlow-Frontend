import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useExpenses } from "@/hooks/use-expenses";
import { useBudgets } from "@/hooks/use-budgets";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  DollarSign, TrendingDown, Calendar, Sparkles, Send, 
  Briefcase, Edit2, Check, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface InvestmentHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  type: "INDEX" | "STOCK" | "SIP";
  purchaseDate: string;
}

export default function Dashboard() {
  const { expenses, selectedMonth, setSelectedMonth } = useExpenses();
  const { budgets } = useBudgets();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
    const saved = localStorage.getItem("user_monthly_income");
    return saved ? parseFloat(saved) : 5000;
  });
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempIncomeInput, setTempIncomeInput] = useState(monthlyIncome.toString());

  const [holdings, setHoldings] = useState<InvestmentHolding[]>(() => {
    const saved = localStorage.getItem("user_portfolio_holdings");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore fallback */ }
    }
    return [
      {
        id: "hold-1",
        symbol: "^NSEI",
        name: "Nifty 50 Index Fund",
        quantity: 12,
        avgBuyPrice: 21500,
        currentPrice: 24350.50,
        type: "SIP",
        purchaseDate: "2023-11-15"
      },
      {
        id: "hold-2",
        symbol: "VOO",
        name: "S&P 500 Index ETF",
        quantity: 4,
        avgBuyPrice: 440.00,
        currentPrice: 512.30,
        type: "INDEX",
        purchaseDate: "2024-02-10"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("user_portfolio_holdings", JSON.stringify(holdings));
  }, [holdings]);

  const currentMonthDate = parseISO(`${selectedMonth}-01`);
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);

  const monthExpenses = expenses.filter((e) => {
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const remaining = totalBudget - totalSpent;
  const idleBalance = Math.max(0, monthlyIncome - totalSpent);

  const portfolioInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice), 0);
  const portfolioCurrentVal = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
  const portfolioPnL = portfolioCurrentVal - portfolioInvested;
  const portfolioPnLPercent = portfolioInvested > 0 ? (portfolioPnL / portfolioInvested) * 100 : 0;

  const handleSaveIncome = () => {
    const parsed = parseFloat(tempIncomeInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setMonthlyIncome(parsed);
      localStorage.setItem("user_monthly_income", parsed.toString());
      setIsEditingIncome(false);
      toast.success("Monthly income updated successfully!");
    } else {
      toast.error("Please enter a valid positive income figure");
    }
  };

  const handleAiQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    const toastId = toast.loading("AI analyzing financial intent...");

    const lowerPrompt = aiPrompt.toLowerCase();
    const isInvestmentIntent = lowerPrompt.includes("buy") || lowerPrompt.includes("bought") || 
                                lowerPrompt.includes("invest") || lowerPrompt.includes("shares") || 
                                lowerPrompt.includes("sip");

    if (isInvestmentIntent) {
      setTimeout(() => {
        const numbers = aiPrompt.match(/\d+(\.\d+)?/g);
        const qty = numbers && numbers[0] ? parseFloat(numbers[0]) : 1;
        const price = numbers && numbers[1] ? parseFloat(numbers[1]) : 24350.50;

        const newHolding: InvestmentHolding = {
          id: `ai-hold-${Date.now()}`,
          symbol: "^NSEI",
          name: "Nifty 50 Index Fund",
          quantity: qty,
          avgBuyPrice: price,
          currentPrice: 24350.50,
          type: "INDEX",
          purchaseDate: format(new Date(), "yyyy-MM-dd")
        };

        setHoldings(prev => [newHolding, ...prev]);
        setAiPrompt("");
        setIsAiLoading(false);
        toast.success(`Logged Investment: ${qty} units @ $${price.toFixed(2)}`, { id: toastId });
      }, 800);
    } else {
      try { 
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/ai`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "Authorization": `Bearer ${token}`
          },
          body: aiPrompt,
        });

        if (response.ok) {
          const newExpense = await response.json();
          const targetMonth = format(parseISO(newExpense.date), "yyyy-MM");
          setSelectedMonth(targetMonth);
          setAiPrompt("");
          toast.success(`Logged Expense: $${newExpense.amount.toFixed(2)} for "${newExpense.description}"`, { id: toastId });
        } else {
          toast.error("Failed to parse prompt.", { id: toastId });
        }
      } catch {
        toast.error("Network offline. Please try again.", { id: toastId });
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const categoryTotals = CATEGORIES.map((c) => ({
    ...c,
    total: monthExpenses
      .filter((e) => e.category === c.value)
      .reduce((sum, e) => sum + e.amount, 0),
  })).sort((a, b) => b.total - a.total);

  const today = new Date();
  const endIntervalDate = monthEnd > today && isSameYearMonth(monthEnd, today) ? today : monthEnd;
  const days = eachDayOfInterval({ start: monthStart, end: endIntervalDate });

  const dailyData = days.map((day) => ({
    date: format(day, "MMM d"),
    amount: monthExpenses
      .filter((e) => format(parseISO(e.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  const pieData = categoryTotals.filter((c) => c.total > 0);
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  function isSameYearMonth(dateA: Date, dateB: Date) {
    return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth();
  }

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

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-sm text-muted-foreground">Track monthly income, expenses, budgets, and unspent idle surplus.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <div className="text-xs font-semibold text-muted-foreground">Monthly Income:</div>
            {isEditingIncome ? (
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={tempIncomeInput}
                  onChange={(e) => setTempIncomeInput(e.target.value)}
                  className="w-16 h-6 border rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-background text-foreground"
                />
                <button onClick={handleSaveIncome} className="p-0.5 hover:text-emerald-500 text-muted-foreground">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-bold text-foreground">${monthlyIncome.toFixed(0)}</span>
                <button 
                  onClick={() => {
                    setTempIncomeInput(monthlyIncome.toString());
                    setIsEditingIncome(true);
                  }}
                  className="p-0.5 hover:text-indigo-500 text-muted-foreground transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm max-w-xs">
            <Calendar className="h-4 w-4 text-muted-foreground ml-1.5 flex-shrink-0" />
            <select
              id="statement-period"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold focus:outline-none pr-8 cursor-pointer text-foreground"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AI Assistant Dual Logger */}
      <Card className="border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/10 to-transparent shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center space-x-2">
          <div className="p-1.5 bg-indigo-500 rounded-md text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">AI Assistant</CardTitle>
            <CardDescription className="text-xs">Log expenses or investment purchases using natural language.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAiQuickLog} className="relative flex items-center">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={isAiLoading}
              placeholder='e.g. "Spent $42 on groceries" or "Bought 5 shares of Nifty ETF at $240"'
              className="w-full h-10 pl-3 pr-12 rounded-lg border border-gray-200 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground"
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
        </CardContent>
      </Card>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{format(currentMonthDate, "MMMM yyyy")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {remaining < 0 ? "Over Budget" : "Unspent Surplus"}
            </CardTitle>
            <TrendingDown className={`h-4 w-4 ${remaining < 0 ? "text-destructive" : "text-emerald-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
              ${Math.abs(remaining).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly Unspent Surplus: <span className="font-bold text-foreground">${idleBalance.toFixed(0)}</span>
            </p>
          </CardContent>
        </Card>

        {/* Portfolio Summary Card linking directly to /investments */}
        <Card className="hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => navigate("/investments")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Portfolio Value</CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioCurrentVal.toFixed(2)}</div>
            <p className={`text-xs font-bold mt-1 flex items-center justify-between ${portfolioPnL >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              <span>{portfolioPnL >= 0 ? "+" : ""}${portfolioPnL.toFixed(2)} ({portfolioPnLPercent >= 0 ? "+" : ""}{portfolioPnLPercent.toFixed(1)}%)</span>
              <span className="text-indigo-600 flex items-center text-[10px] uppercase font-extrabold">Analytics <ArrowRight className="h-3 w-3 ml-0.5" /></span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Expense Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Daily Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.some((d) => d.amount > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]} />
                  <Bar dataKey="amount" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
                No spending data recorded this month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="total"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
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
              <p className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
                No expenses recorded
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expense Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
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
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2.5 py-1 rounded w-fit mt-3 mb-1 first:mt-0">
                        {format(currentExpenseDate, "MMMM yyyy")}
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2 border-b border-muted/40 last:border-0 hover:bg-muted/10 px-1 rounded transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0">{cat?.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{e.description || cat?.label}</p>
                          <p className="text-[11px] text-muted-foreground">{format(currentExpenseDate, "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-foreground">-${e.amount.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">No expenses recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}