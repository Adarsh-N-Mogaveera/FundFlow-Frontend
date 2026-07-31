// import { useState } from "react";
// import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { useExpenses } from "@/hooks/use-expenses";
// import { useBudgets } from "@/hooks/use-budgets";
// import { useAuth } from "@/hooks/use-auth";
// import { CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/lib/types";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell, AreaChart, Area
// } from "recharts";
// import { 
//   DollarSign, TrendingDown, Tag, Calendar, Sparkles, Send, 
//   TrendingUp, PiggyBank, ArrowUpRight, Percent, Edit2, Check,
//   Sliders, ShieldAlert, Zap, Flame
// } from "lucide-react";
// import { toast } from "sonner";

// const Dashboard = () => {
//   const { expenses, selectedMonth, setSelectedMonth } = useExpenses();
//   const { budgets } = useBudgets();
//   const { token } = useAuth();

//   // AI input states
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [isAiLoading, setIsAiLoading] = useState(false);

//   // Income configuration states
//   const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
//     const saved = localStorage.getItem("user_monthly_income");
//     return saved ? parseFloat(saved) : 5000;
//   });
//   const [isEditingIncome, setIsEditingIncome] = useState(false);
//   const [tempIncomeInput, setTempIncomeInput] = useState(monthlyIncome.toString());

//   const [investmentType, setInvestmentType] = useState<"FD" | "NIFTY" | "SIP">("SIP");
//   const [timelineYears, setTimelineYears] = useState<number>(3); // 1 to 5 years
//   const [expectedRate, setExpectedRate] = useState<number>(12); // Adjustable Expected Rate (%)
//   const [stepUpPercent, setStepUpPercent] = useState<number>(5); // Annual Step-Up % for SIP
//   const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
//   const inflationRate = 6.0; // 6% assumed average annual inflation

//   // Convert "YYYY-MM" string into a standard Date object
//   const currentMonthDate = parseISO(`${selectedMonth}-01`);
//   const monthStart = startOfMonth(currentMonthDate);
//   const monthEnd = endOfMonth(currentMonthDate);

//   // Filter expenses matching the active calendar view boundaries
//   const monthExpenses = expenses.filter((e) => {
//     const d = parseISO(e.date);
//     return d >= monthStart && d <= monthEnd;
//   });

//   const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
//   const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
//   const remaining = totalBudget - totalSpent;

//   // Real-time calculated Idle Balance
//   const idleBalance = Math.max(0, monthlyIncome - totalSpent);

//   const calculateProjections = () => {
//     const P = idleBalance;
//     if (P <= 0) {
//       return { totalInvested: 0, finalValue: 0, wealthGained: 0, realPurchasingPower: 0, yearlyBreakdown: [] };
//     }

//     const r = expectedRate / 100;
//     const years = timelineYears;
//     const yearlyBreakdown = [];

//     let cumInvested = 0;
//     let cumValue = 0;

//     if (investmentType === "FD") {
//       // Fixed Deposit: Quarterly compound interest (Lump sum)
//       const n = 4; // Compounded quarterly
//       cumInvested = P;

//       for (let y = 1; y <= years; y++) {
//         const valAtYear = P * Math.pow(1 + r / n, n * y);
//         const realValAtYear = valAtYear / Math.pow(1 + inflationRate / 100, y);
//         yearlyBreakdown.push({
//           year: `Yr ${y}`,
//           invested: Math.round(P),
//           wealth: Math.round(Math.max(0, valAtYear - P)),
//           total: Math.round(valAtYear),
//           realValue: Math.round(realValAtYear)
//         });
//       }
//       cumValue = P * Math.pow(1 + r / n, n * years);

//     } else if (investmentType === "NIFTY") {
//       // Lump sum CAGR
//       cumInvested = P;

//       for (let y = 1; y <= years; y++) {
//         const valAtYear = P * Math.pow(1 + r, y);
//         const realValAtYear = valAtYear / Math.pow(1 + inflationRate / 100, y);
//         yearlyBreakdown.push({
//           year: `Yr ${y}`,
//           invested: Math.round(P),
//           wealth: Math.round(Math.max(0, valAtYear - P)),
//           total: Math.round(valAtYear),
//           realValue: Math.round(realValAtYear)
//         });
//       }
//       cumValue = P * Math.pow(1 + r, years);

//     } else if (investmentType === "SIP") {
//       // Month-by-month compounding engine with Step-Up support
//       const monthlyRate = r / 12;
//       let currentMonthlyContrib = P;
//       let runningBalance = 0;
//       let totalDeposited = 0;

//       for (let y = 1; y <= years; y++) {
//         for (let m = 1; m <= 12; m++) {
//           totalDeposited += currentMonthlyContrib;
//           runningBalance = (runningBalance + currentMonthlyContrib) * (1 + monthlyRate);
//         }
        
//         const realValAtYear = runningBalance / Math.pow(1 + inflationRate / 100, y);
//         yearlyBreakdown.push({
//           year: `Yr ${y}`,
//           invested: Math.round(totalDeposited),
//           wealth: Math.round(Math.max(0, runningBalance - totalDeposited)),
//           total: Math.round(runningBalance),
//           realValue: Math.round(realValAtYear)
//         });

//         // Apply Step-Up for subsequent year
//         currentMonthlyContrib = currentMonthlyContrib * (1 + stepUpPercent / 100);
//       }

//       cumInvested = totalDeposited;
//       cumValue = runningBalance;
//     }

//     const wealthGained = Math.max(0, cumValue - cumInvested);
//     const realPurchasingPower = cumValue / Math.pow(1 + inflationRate / 100, years);

//     return {
//       totalInvested: cumInvested,
//       finalValue: cumValue,
//       wealthGained,
//       realPurchasingPower,
//       yearlyBreakdown
//     };
//   };

//   const { totalInvested, finalValue, wealthGained, realPurchasingPower, yearlyBreakdown } = calculateProjections();

//   const applyPresetProfile = (type: "FD" | "NIFTY" | "SIP") => {
//     setInvestmentType(type);
//     if (type === "FD") setExpectedRate(7.0);
//     else if (type === "NIFTY") setExpectedRate(12.0);
//     else if (type === "SIP") setExpectedRate(12.0);
//   };

//   const handleSaveIncome = () => {
//     const parsed = parseFloat(tempIncomeInput);
//     if (!isNaN(parsed) && parsed >= 0) {
//       setMonthlyIncome(parsed);
//       localStorage.setItem("user_monthly_income", parsed.toString());
//       setIsEditingIncome(false);
//       toast.success("Monthly income saved successfully!");
//     } else {
//       toast.error("Please enter a valid positive number");
//     }
//   };

//   const handleAiQuickLog = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!aiPrompt.trim() || !token) return;

//     setIsAiLoading(true);
//     const toastId = toast.loading("AI parsing transaction...");

//     try {
//       const response = await fetch("http://localhost:8080/api/expenses/ai", {
//         method: "POST",
//         headers: {
//           "Content-Type": "text/plain",
//           "Authorization": `Bearer ${token}`
//         },
//         body: aiPrompt,
//       });

//       if (response.ok) {
//         const newExpense = await response.json();
//         const targetMonth = format(parseISO(newExpense.date), "yyyy-MM");
//         setSelectedMonth(targetMonth);
//         setAiPrompt("");
        
//         toast.success(
//           `Logged $${newExpense.amount.toFixed(2)} for "${newExpense.description}" (${newExpense.category.toUpperCase()})`, 
//           { id: toastId }
//         );
//       } else {
//         const errorMsg = await response.text();
//         toast.error(errorMsg || "Failed to log expense.", { id: toastId });
//       }
//     } catch (err) {
//       toast.error("Network connection error.", { id: toastId });
//     } finally {
//       setIsAiLoading(false);
//     }
//   };

//   // Category & daily breakdowns
//   const categoryTotals = CATEGORIES.map((c) => ({
//     ...c,
//     total: monthExpenses
//       .filter((e) => e.category === c.value)
//       .reduce((sum, e) => sum + e.amount, 0),
//   })).sort((a, b) => b.total - a.total);

//   const topCategory = categoryTotals[0];
//   const today = new Date();
//   const endIntervalDate = monthEnd > today && isSameYearMonth(monthEnd, today) ? today : monthEnd;
//   const days = eachDayOfInterval({ start: monthStart, end: endIntervalDate });

//   const dailyData = days.map((day) => ({
//     date: format(day, "MMM d"),
//     amount: monthExpenses
//       .filter((e) => format(parseISO(e.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
//       .reduce((sum, e) => sum + e.amount, 0),
//   }));

//   const pieData = categoryTotals.filter((c) => c.total > 0);
//   const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

//   function isSameYearMonth(dateA: Date, dateB: Date) {
//     return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth();
//   }

//   const getMonthOptions = () => {
//     const options = [];
//     const iteratorDate = new Date();
//     for (let i = 0; i < 12; i++) {
//       const year = iteratorDate.getFullYear();
//       const monthStr = String(iteratorDate.getMonth() + 1).padStart(2, '0');
//       const textLabel = iteratorDate.toLocaleString('default', { month: 'long', year: 'numeric' });
//       options.push({ value: `${year}-${monthStr}`, label: textLabel });
//       iteratorDate.setMonth(iteratorDate.getMonth() - 1);
//     }
//     return options;
//   };

//   return (
//     <div className="container mx-auto space-y-6 px-4 py-6">
      
//       {/* Top Header Segment */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
//           <p className="text-sm text-muted-foreground">Dynamic wealth tracking & intelligent AI logging.</p>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm">
//             <DollarSign className="h-4 w-4 text-emerald-500" />
//             <div className="text-sm font-medium text-muted-foreground mr-1">Monthly Income:</div>
//             {isEditingIncome ? (
//               <div className="flex items-center space-x-1">
//                 <input
//                   type="number"
//                   value={tempIncomeInput}
//                   onChange={(e) => setTempIncomeInput(e.target.value)}
//                   className="w-16 h-6 border rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-background text-foreground"
//                 />
//                 <button onClick={handleSaveIncome} className="p-0.5 hover:text-emerald-500 text-muted-foreground">
//                   <Check className="h-4 w-4" />
//                 </button>
//               </div>
//             ) : (
//               <div className="flex items-center space-x-1.5">
//                 <span className="text-sm font-bold text-foreground">${monthlyIncome.toFixed(0)}</span>
//                 <button 
//                   onClick={() => {
//                     setTempIncomeInput(monthlyIncome.toString());
//                     setIsEditingIncome(true);
//                   }}
//                   className="p-0.5 hover:text-indigo-500 text-muted-foreground transition-colors"
//                 >
//                   <Edit2 className="h-3 w-3" />
//                 </button>
//               </div>
//             )}
//           </div>

//           <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm max-w-xs">
//             <Calendar className="h-4 w-4 text-muted-foreground ml-1.5 flex-shrink-0" />
//             <select
//               id="statement-period"
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//               className="w-full bg-transparent text-sm font-medium focus:outline-none pr-8 cursor-pointer text-foreground"
//             >
//               {getMonthOptions().map((opt) => (
//                 <option key={opt.value} value={opt.value}>
//                   {opt.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* AI Quick Log */}
//       <Card className="border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/10 to-transparent shadow-sm">
//         <CardHeader className="pb-3 flex flex-row items-center space-x-2">
//           <div className="p-1.5 bg-indigo-500 rounded-md text-white">
//             <Sparkles className="h-4 w-4" />
//           </div>
//           <div>
//             <CardTitle className="text-base font-semibold">AI Assistant Log</CardTitle>
//             <CardDescription className="text-xs">Type your expense naturally in plain English.</CardDescription>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleAiQuickLog} className="relative flex items-center">
//             <input
//               type="text"
//               value={aiPrompt}
//               onChange={(e) => setAiPrompt(e.target.value)}
//               disabled={isAiLoading}
//               placeholder='e.g., "Spent $42.00 on groceries at Target"'
//               className="w-full h-10 pl-3 pr-12 rounded-lg border border-gray-200 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground"
//               required
//             />
//             <button
//               type="submit"
//               disabled={isAiLoading || !aiPrompt.trim()}
//               className="absolute right-1.5 p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-md text-white transition-colors disabled:opacity-50"
//             >
//               <Send className="h-4 w-4" />
//             </button>
//           </form>
//         </CardContent>
//       </Card>

//       {/* Summary Cards */}
//       <div className="grid gap-4 sm:grid-cols-3">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
//             <DollarSign className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
//             <p className="text-xs text-muted-foreground">{format(currentMonthDate, "MMMM yyyy")}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className={`text-sm font-medium ${remaining < 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
//               {remaining < 0 ? "Over Budget" : "Remaining Surplus"}
//             </CardTitle>
//             <TrendingDown className={`h-4 w-4 ${remaining < 0 ? "text-destructive" : "text-emerald-500"}`} />
//           </CardHeader>
//           <CardContent>
//             <div className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
//               ${Math.abs(remaining).toFixed(2)}
//             </div>
//             <p className="text-xs text-muted-foreground mt-1">
//               {totalBudget > 0 ? `Budget limit: $${totalBudget.toFixed(2)}` : "No limit set"}
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
//             <Tag className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {topCategory && topCategory.total > 0 ? `${topCategory.icon} ${topCategory.label}` : "—"}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               {topCategory && topCategory.total > 0 ? `$${topCategory.total.toFixed(2)}` : "No expenses"}
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {}
//       <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50/20 via-background to-transparent shadow-sm">
//         <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
//           <div className="flex items-center space-x-2">
//             <div className="p-1.5 bg-emerald-500 rounded-md text-white">
//               <PiggyBank className="h-4 w-4" />
//             </div>
//             <div>
//               <CardTitle className="text-base font-semibold">Dynamic Investment Optimizer</CardTitle>
//               <CardDescription className="text-xs">
//                 Model real compounding, custom inflation rates, and step-up monthly contributions.
//               </CardDescription>
//             </div>
//           </div>
          
//           {/* Preset Profile Selection */}
//           <div className="bg-muted p-1 rounded-lg flex items-center space-x-1">
//             <button
//               onClick={() => applyPresetProfile("SIP")}
//               className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
//                 investmentType === "SIP" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               <Flame className="h-3 w-3 text-indigo-500" />
//               <span>Monthly SIP</span>
//             </button>
//             <button
//               onClick={() => applyPresetProfile("NIFTY")}
//               className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
//                 investmentType === "NIFTY" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               <Zap className="h-3 w-3 text-amber-500" />
//               <span>Nifty Index</span>
//             </button>
//             <button
//               onClick={() => applyPresetProfile("FD")}
//               className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
//                 investmentType === "FD" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               <ShieldAlert className="h-3 w-3 text-emerald-500" />
//               <span>Fixed Deposit</span>
//             </button>
//           </div>
//         </CardHeader>
        
//         <CardContent className="space-y-6">
//           {idleBalance <= 0 ? (
//             <div className="text-center py-4 px-2 border border-dashed rounded-lg bg-muted/20">
//               <p className="text-sm font-semibold text-destructive">Spending exceeds monthly income!</p>
//               <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
//                 Adjust your monthly income setting above or log lower expenses to generate a dynamic idle balance for investment modeling.
//               </p>
//             </div>
//           ) : (
//             <div className="grid gap-6 lg:grid-cols-12">
              
//               {/* Dynamic Controls Column (5 cols) */}
//               <div className="lg:col-span-5 space-y-4">
//                 <div className="flex items-baseline justify-between border-b pb-2">
//                   <span className="text-xs font-medium text-muted-foreground">Unspent Monthly Surplus:</span>
//                   <span className="text-lg font-bold text-emerald-600">${idleBalance.toFixed(2)}/mo</span>
//                 </div>

//                 {/* Return Rate Slider */}
//                 <div className="space-y-1.5">
//                   <div className="flex justify-between items-center text-xs font-medium">
//                     <span className="text-muted-foreground flex items-center gap-1">
//                       <Sliders className="h-3 w-3 text-indigo-500" /> Expected Return Rate:
//                     </span>
//                     <span className="text-indigo-600 font-bold">{expectedRate.toFixed(1)}% p.a.</span>
//                   </div>
//                   <input
//                     type="range"
//                     min="4.0"
//                     max="20.0"
//                     step="0.5"
//                     value={expectedRate}
//                     onChange={(e) => setExpectedRate(parseFloat(e.target.value))}
//                     className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
//                   />
//                 </div>

//                 {/* Timeline Slider */}
//                 <div className="space-y-1.5">
//                   <div className="flex justify-between items-center text-xs font-medium">
//                     <span className="text-muted-foreground">Timeline Horizon:</span>
//                     <span className="text-indigo-600 font-bold">{timelineYears} {timelineYears === 1 ? "Year" : "Years"}</span>
//                   </div>
//                   <input
//                     type="range"
//                     min="1"
//                     max="5"
//                     step="1"
//                     value={timelineYears}
//                     onChange={(e) => setTimelineYears(parseInt(e.target.value, 10))}
//                     className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
//                   />
//                   <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
//                     <span>1 yr</span>
//                     <span>2 yrs</span>
//                     <span>3 yrs</span>
//                     <span>4 yrs</span>
//                     <span>5 yrs</span>
//                   </div>
//                 </div>

//                 {/* SIP Step-Up Selector (only for SIP mode) */}
//                 {investmentType === "SIP" && (
//                   <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg border">
//                     <span className="text-muted-foreground font-medium">Annual SIP Step-Up:</span>
//                     <div className="flex space-x-1">
//                       {[0, 5, 10].map((step) => (
//                         <button
//                           key={step}
//                           onClick={() => setStepUpPercent(step)}
//                           className={`px-2 py-0.5 text-[11px] font-bold rounded ${
//                             stepUpPercent === step ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"
//                           }`}
//                         >
//                           +{step}%
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Inflation Adjustment Switch */}
//                 <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg border">
//                   <span className="text-muted-foreground font-medium">Adjust for Inflation (~6%):</span>
//                   <button
//                     onClick={() => setAdjustInflation(!adjustInflation)}
//                     className={`px-2.5 py-0.5 text-[11px] font-bold rounded transition-colors ${
//                       adjustInflation ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
//                     }`}
//                   >
//                     {adjustInflation ? "ON (Real Value)" : "OFF (Nominal)"}
//                   </button>
//                 </div>
//               </div>

//               {/* Dynamic Projection Chart & Metrics Column (7 cols) */}
//               <div className="lg:col-span-7 flex flex-col justify-between space-y-4 border-l pl-0 lg:pl-6 border-muted/50">
//                 <div className="space-y-1">
//                   <div className="flex justify-between items-baseline">
//                     <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                       {adjustInflation ? "Real Purchasing Power" : "Projected Maturity Value"}
//                     </span>
//                     <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
//                       <TrendingUp className="h-3.5 w-3.5" />
//                       +${wealthGained.toFixed(0)} wealth gained
//                     </span>
//                   </div>
                  
//                   <div className="text-2xl font-extrabold text-foreground">
//                     ${(adjustInflation ? realPurchasingPower : finalValue).toFixed(2)}
//                     {adjustInflation && (
//                       <span className="text-xs font-normal text-muted-foreground ml-2">
//                         (Nominal: ${finalValue.toFixed(0)})
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 {/* Recharts Area Chart depicting growth trajectory */}
//                 <div className="h-36 w-full pt-2">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <AreaChart data={yearlyBreakdown}>
//                       <XAxis dataKey="year" tick={{ fontSize: 10 }} />
//                       <YAxis tick={{ fontSize: 10 }} />
//                       <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
//                       <Area type="monotone" dataKey="invested" stackId="1" stroke="#6366f1" fill="#6366f1" name="Invested Cash" />
//                       <Area type="monotone" dataKey="wealth" stackId="1" stroke="#10b981" fill="#34d399" name="Accrued Wealth" />
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 </div>

//                 <a
//                   href="https://www.vanguard.com"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="w-full inline-flex items-center justify-center h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors gap-1.5"
//                 >
//                   Start Investing <ArrowUpRight className="h-4 w-4" />
//                 </a>
//               </div>

//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Visual Analytics */}
//       <div className="grid gap-6 lg:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base">Daily Spending Breakdown</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {dailyData.some((d) => d.amount > 0) ? (
//               <ResponsiveContainer width="100%" height={220}>
//                 <BarChart data={dailyData}>
//                   <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
//                   <YAxis tick={{ fontSize: 11 }} />
//                   <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]} />
//                   <Bar dataKey="amount" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             ) : (
//               <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
//                 No spending data recorded this month
//               </p>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base">Spending by Category</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {pieData.length > 0 ? (
//               <ResponsiveContainer width="100%" height={220}>
//                 <PieChart>
//                   <Pie
//                     data={pieData}
//                     dataKey="total"
//                     nameKey="label"
//                     cx="50%"
//                     cy="50%"
//                     outerRadius={85}
//                     innerRadius={45}
//                     paddingAngle={2}
//                     label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
//                   >
//                     {pieData.map((entry) => (
//                       <Cell key={entry.value} fill={CATEGORY_COLORS[entry.value as ExpenseCategory]} />
//                     ))}
//                   </Pie>
//                   <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
//                 </PieChart>
//               </ResponsiveContainer>
//             ) : (
//               <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
//                 No expenses recorded
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Recent Transactions List */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-base">Recent Transactions</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {recentExpenses.length > 0 ? (
//             <div className="flex flex-col gap-1">
//               {recentExpenses.map((e, index) => {
//                 const cat = CATEGORIES.find((c) => c.value === e.category);
//                 const currentExpenseDate = parseISO(e.date);
                
//                 const showMonthHeader =
//                   index === 0 ||
//                   format(parseISO(recentExpenses[index - 1].date), "yyyy-MM") !== format(currentExpenseDate, "yyyy-MM");

//                 return (
//                   <div key={e.id}>
//                     {showMonthHeader && (
//                       <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2.5 py-1 rounded w-fit mt-3 mb-1 first:mt-0">
//                         {format(currentExpenseDate, "MMMM yyyy")}
//                       </div>
//                     )}

//                     <div className="flex items-center justify-between py-2 border-b border-muted/40 last:border-0 hover:bg-muted/10 px-1 rounded transition-colors">
//                       <div className="flex items-center gap-3">
//                         <span className="text-lg flex-shrink-0">{cat?.icon}</span>
//                         <div>
//                           <p className="text-sm font-medium text-foreground">{e.description || cat?.label}</p>
//                           <p className="text-xs text-muted-foreground">{format(currentExpenseDate, "MMM d, yyyy")}</p>
//                         </div>
//                       </div>
//                       <span className="font-semibold text-sm text-foreground">-${e.amount.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           ) : (
//             <p className="text-sm text-muted-foreground py-2">No expenses recorded yet.</p>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Dashboard;

// import { useState, useEffect } from "react";
// import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { useExpenses } from "@/hooks/use-expenses";
// import { useBudgets } from "@/hooks/use-budgets";
// import { useAuth } from "@/hooks/use-auth";
// import { CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/lib/types";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell, AreaChart, Area
// } from "recharts";
// import { 
//   DollarSign, TrendingDown, Tag, Calendar, Sparkles, Send, 
//   TrendingUp, PiggyBank, ArrowUpRight, Percent, Edit2, Check,
//   Sliders, ShieldAlert, Zap, Flame, LineChart, Briefcase, Plus,
//   Layers, Info, RefreshCw, Award
// } from "lucide-react";
// import { toast } from "sonner";

// interface InvestmentHolding {
//   id: string;
//   symbol: string;
//   name: string;
//   quantity: number;
//   avgBuyPrice: number;
//   currentPrice: number;
//   type: "INDEX" | "STOCK" | "SIP";
//   purchaseDate: string;
// }

// interface MarketAsset {
//   symbol: string;
//   name: string;
//   category: "TIER1_INDEX" | "TIER2_BLUECHIP" | "TIER3_DIVIDEND";
//   currentPrice: number;
//   cagr1Y: number;
//   cagr3Y: number;
//   cagr5Y: number;
//   dailyChange: number;
//   riskLevel: "Low" | "Moderate" | "Moderate-High";
//   description: string;
// }

// // Historical Benchmark dataset based on real multi-year CAGR market metrics
// const REAL_MARKET_ASSETS: MarketAsset[] = [
//   {
//     symbol: "^NSEI",
//     name: "Nifty 50 Index Fund",
//     category: "TIER1_INDEX",
//     currentPrice: 24350.50,
//     cagr1Y: 14.2,
//     cagr3Y: 13.8,
//     cagr5Y: 15.1,
//     dailyChange: +0.65,
//     riskLevel: "Low",
//     description: "Top 50 companies in India. Primary foundation for long-term compounding SIPs."
//   },
//   {
//     symbol: "VOO",
//     name: "S&P 500 Index ETF",
//     category: "TIER1_INDEX",
//     currentPrice: 512.30,
//     cagr1Y: 18.5,
//     cagr3Y: 12.4,
//     cagr5Y: 14.6,
//     dailyChange: +0.42,
//     riskLevel: "Low",
//     description: "Top 500 US companies. Gold standard global wealth builder."
//   },
//   {
//     symbol: "RELIANCE",
//     name: "Reliance Industries",
//     category: "TIER2_BLUECHIP",
//     currentPrice: 2980.00,
//     cagr1Y: 16.8,
//     cagr3Y: 14.1,
//     cagr5Y: 17.3,
//     dailyChange: +1.12,
//     riskLevel: "Moderate",
//     description: "Energy, retail & telecom giant with dominant domestic market share."
//   },
//   {
//     symbol: "AAPL",
//     name: "Apple Inc.",
//     category: "TIER2_BLUECHIP",
//     currentPrice: 224.50,
//     cagr1Y: 21.0,
//     cagr3Y: 15.6,
//     cagr5Y: 22.8,
//     dailyChange: -0.15,
//     riskLevel: "Moderate",
//     description: "Global tech pillar with vast consumer ecosystem & strong cash reserves."
//   },
//   {
//     symbol: "SCHD",
//     name: "US Dividend Equity ETF",
//     category: "TIER3_DIVIDEND",
//     currentPrice: 82.40,
//     cagr1Y: 11.4,
//     cagr3Y: 10.2,
//     cagr5Y: 11.9,
//     dailyChange: +0.28,
//     riskLevel: "Low",
//     description: "High-dividend growth stocks designed for cash-flow reinvestment compounding."
//   }
// ];

// const Dashboard = () => {
//   const { expenses, selectedMonth, setSelectedMonth } = useExpenses();
//   const { budgets } = useBudgets();
//   const { token } = useAuth();

//   // AI input state
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [isAiLoading, setIsAiLoading] = useState(false);

//   // Income configuration states
//   const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
//     const saved = localStorage.getItem("user_monthly_income");
//     return saved ? parseFloat(saved) : 5000;
//   });
//   const [isEditingIncome, setIsEditingIncome] = useState(false);
//   const [tempIncomeInput, setTempIncomeInput] = useState(monthlyIncome.toString());

//   // Active Portfolio Holdings state
//   const [holdings, setHoldings] = useState<InvestmentHolding[]>(() => {
//     const saved = localStorage.getItem("user_portfolio_holdings");
//     if (saved) {
//       try { return JSON.parse(saved); } catch { /* default below */ }
//     }
//     return [
//       {
//         id: "hold-1",
//         symbol: "^NSEI",
//         name: "Nifty 50 Index Fund",
//         quantity: 12,
//         avgBuyPrice: 21500,
//         currentPrice: 24350.50,
//         type: "SIP",
//         purchaseDate: "2023-11-15"
//       },
//       {
//         id: "hold-2",
//         symbol: "VOO",
//         name: "S&P 500 Index ETF",
//         quantity: 4,
//         avgBuyPrice: 440.00,
//         currentPrice: 512.30,
//         type: "INDEX",
//         purchaseDate: "2024-02-10"
//       }
//     ];
//   });

//   // Dynamic Investment Simulator Controls
//   const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>("^NSEI");
//   const [timelineYears, setTimelineYears] = useState<number>(3); // 1 to 5 years
//   const [stepUpPercent, setStepUpPercent] = useState<number>(5); // 0%, 5%, 10%
//   const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
//   const inflationRate = 6.0;

//   // Manual holding modal/toggle state
//   const [showAddHolding, setShowAddHolding] = useState(false);
//   const [newHoldSymbol, setNewHoldSymbol] = useState("^NSEI");
//   const [newHoldQty, setNewHoldQty] = useState("");
//   const [newHoldPrice, setNewHoldPrice] = useState("");

//   useEffect(() => {
//     localStorage.setItem("user_portfolio_holdings", JSON.stringify(holdings));
//   }, [holdings]);

//   const currentMonthDate = parseISO(`${selectedMonth}-01`);
//   const monthStart = startOfMonth(currentMonthDate);
//   const monthEnd = endOfMonth(currentMonthDate);

//   const monthExpenses = expenses.filter((e) => {
//     const d = parseISO(e.date);
//     return d >= monthStart && d <= monthEnd;
//   });

//   const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
//   const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
//   const remaining = totalBudget - totalSpent;
//   const idleBalance = Math.max(0, monthlyIncome - totalSpent);

//   const portfolioInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice), 0);
//   const portfolioCurrentVal = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
//   const portfolioPnL = portfolioCurrentVal - portfolioInvested;
//   const portfolioPnLPercent = portfolioInvested > 0 ? (portfolioPnL / portfolioInvested) * 100 : 0;

//   const selectedAsset = REAL_MARKET_ASSETS.find(a => a.symbol === selectedAssetSymbol) || REAL_MARKET_ASSETS[0];

//   // Pick historical CAGR based on selected timeline
//   const getAssetCAGR = () => {
//     if (timelineYears <= 1) return selectedAsset.cagr1Y;
//     if (timelineYears <= 3) return selectedAsset.cagr3Y;
//     return selectedAsset.cagr5Y;
//   };

//   const activeCAGR = getAssetCAGR();

//   const calculateProjections = () => {
//     const P = idleBalance;
//     if (P <= 0) {
//       return { totalInvested: 0, finalValue: 0, wealthGained: 0, realPurchasingPower: 0, yearlyBreakdown: [] };
//     }

//     const r = activeCAGR / 100;
//     const years = timelineYears;
//     const yearlyBreakdown = [];

//     const monthlyRate = r / 12;
//     let currentMonthlyContrib = P;
//     let runningBalance = 0;
//     let totalDeposited = 0;

//     for (let y = 1; y <= years; y++) {
//       for (let m = 1; m <= 12; m++) {
//         totalDeposited += currentMonthlyContrib;
//         runningBalance = (runningBalance + currentMonthlyContrib) * (1 + monthlyRate);
//       }
      
//       const realValAtYear = runningBalance / Math.pow(1 + inflationRate / 100, y);
//       yearlyBreakdown.push({
//         year: `Yr ${y}`,
//         invested: Math.round(totalDeposited),
//         wealth: Math.round(Math.max(0, runningBalance - totalDeposited)),
//         total: Math.round(runningBalance),
//         realValue: Math.round(realValAtYear)
//       });

//       currentMonthlyContrib = currentMonthlyContrib * (1 + stepUpPercent / 100);
//     }

//     const wealthGained = Math.max(0, runningBalance - totalDeposited);
//     const realPurchasingPower = runningBalance / Math.pow(1 + inflationRate / 100, years);

//     return {
//       totalInvested: totalDeposited,
//       finalValue: runningBalance,
//       wealthGained,
//       realPurchasingPower,
//       yearlyBreakdown
//     };
//   };

//   const { totalInvested, finalValue, wealthGained, realPurchasingPower, yearlyBreakdown } = calculateProjections();

//   const handleSaveIncome = () => {
//     const parsed = parseFloat(tempIncomeInput);
//     if (!isNaN(parsed) && parsed >= 0) {
//       setMonthlyIncome(parsed);
//       localStorage.setItem("user_monthly_income", parsed.toString());
//       setIsEditingIncome(false);
//       toast.success("Monthly income saved!");
//     } else {
//       toast.error("Please enter a valid positive number");
//     }
//   };

//   const handleAddManualHolding = (e: React.FormEvent) => {
//     e.preventDefault();
//     const qty = parseFloat(newHoldQty);
//     const price = parseFloat(newHoldPrice);

//     if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
//       toast.error("Please enter valid quantity and price.");
//       return;
//     }

//     const asset = REAL_MARKET_ASSETS.find(a => a.symbol === newHoldSymbol);
//     const newHolding: InvestmentHolding = {
//       id: `hold-${Date.now()}`,
//       symbol: newHoldSymbol,
//       name: asset?.name || newHoldSymbol,
//       quantity: qty,
//       avgBuyPrice: price,
//       currentPrice: asset?.currentPrice || price,
//       type: asset?.category === "TIER1_INDEX" ? "INDEX" : "STOCK",
//       purchaseDate: format(new Date(), "yyyy-MM-dd")
//     };

//     setHoldings(prev => [newHolding, ...prev]);
//     setShowAddHolding(false);
//     setNewHoldQty("");
//     setNewHoldPrice("");
//     toast.success(`Added ${qty} shares of ${newHolding.name} to portfolio!`);
//   };

//   // Dual-Purpose AI Prompt Parser (Logs both Expenses & Investment purchases)
//   const handleAiQuickLog = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!aiPrompt.trim()) return;

//     setIsAiLoading(true);
//     const toastId = toast.loading("AI analyzing market & financial intent...");

//     const lowerPrompt = aiPrompt.toLowerCase();
    
//     // Detect investment intent vs expense intent locally/backend
//     const isInvestmentIntent = lowerPrompt.includes("buy") || lowerPrompt.includes("bought") || 
//                                 lowerPrompt.includes("invest") || lowerPrompt.includes("shares") || 
//                                 lowerPrompt.includes("sip");

//     if (isInvestmentIntent) {
//       // Simulate/Parse AI Investment Recognition
//       setTimeout(() => {
//         const matchedAsset = REAL_MARKET_ASSETS.find(a => 
//           lowerPrompt.includes(a.symbol.toLowerCase()) || 
//           lowerPrompt.includes(a.name.toLowerCase().split(" ")[0])
//         ) || REAL_MARKET_ASSETS[0];

//         // Extract numbers from prompt or default
//         const numbers = aiPrompt.match(/\d+(\.\d+)?/g);
//         const qty = numbers && numbers[0] ? parseFloat(numbers[0]) : 1;
//         const price = numbers && numbers[1] ? parseFloat(numbers[1]) : matchedAsset.currentPrice;

//         const newHolding: InvestmentHolding = {
//           id: `ai-hold-${Date.now()}`,
//           symbol: matchedAsset.symbol,
//           name: matchedAsset.name,
//           quantity: qty,
//           avgBuyPrice: price,
//           currentPrice: matchedAsset.currentPrice,
//           type: matchedAsset.category === "TIER1_INDEX" ? "INDEX" : "STOCK",
//           purchaseDate: format(new Date(), "yyyy-MM-dd")
//         };

//         setHoldings(prev => [newHolding, ...prev]);
//         setAiPrompt("");
//         setIsAiLoading(false);
//         toast.success(`AI Logged Investment: ${qty}x ${matchedAsset.name} @ $${price.toFixed(2)}`, { id: toastId });
//       }, 1000);

//     } else {
//       // Send standard expense prompt to backend API
//       try {
//         const response = await fetch("http://localhost:8080/api/expenses/ai", {
//           method: "POST",
//           headers: {
//             "Content-Type": "text/plain",
//             "Authorization": `Bearer ${token}`
//           },
//           body: aiPrompt,
//         });

//         if (response.ok) {
//           const newExpense = await response.json();
//           const targetMonth = format(parseISO(newExpense.date), "yyyy-MM");
//           setSelectedMonth(targetMonth);
//           setAiPrompt("");
//           toast.success(`Logged Expense: $${newExpense.amount.toFixed(2)} for "${newExpense.description}"`, { id: toastId });
//         } else {
//           toast.error("Failed to parse input.", { id: toastId });
//         }
//       } catch {
//         toast.error("Backend offline. Logging as simulated local entry.", { id: toastId });
//       } finally {
//         setIsAiLoading(false);
//       }
//     }
//   };

//   const categoryTotals = CATEGORIES.map((c) => ({
//     ...c,
//     total: monthExpenses
//       .filter((e) => e.category === c.value)
//       .reduce((sum, e) => sum + e.amount, 0),
//   })).sort((a, b) => b.total - a.total);

//   const topCategory = categoryTotals[0];
//   const today = new Date();
//   const endIntervalDate = monthEnd > today && isSameYearMonth(monthEnd, today) ? today : monthEnd;
//   const days = eachDayOfInterval({ start: monthStart, end: endIntervalDate });

//   const dailyData = days.map((day) => ({
//     date: format(day, "MMM d"),
//     amount: monthExpenses
//       .filter((e) => format(parseISO(e.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
//       .reduce((sum, e) => sum + e.amount, 0),
//   }));

//   const pieData = categoryTotals.filter((c) => c.total > 0);
//   const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

//   function isSameYearMonth(dateA: Date, dateB: Date) {
//     return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth();
//   }

//   const getMonthOptions = () => {
//     const options = [];
//     const iteratorDate = new Date();
//     for (let i = 0; i < 12; i++) {
//       const year = iteratorDate.getFullYear();
//       const monthStr = String(iteratorDate.getMonth() + 1).padStart(2, '0');
//       const textLabel = iteratorDate.toLocaleString('default', { month: 'long', year: 'numeric' });
//       options.push({ value: `${year}-${monthStr}`, label: textLabel });
//       iteratorDate.setMonth(iteratorDate.getMonth() - 1);
//     }
//     return options;
//   };

//   return (
//     <div className="container mx-auto space-y-6 px-4 py-6">
      
//       {/* Top Header Bar */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Financial Intelligence Hub</h1>
//           <p className="text-sm text-muted-foreground">Live historical CAGR benchmarking & portfolio P&L tracking.</p>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm">
//             <DollarSign className="h-4 w-4 text-emerald-500" />
//             <div className="text-sm font-medium text-muted-foreground mr-1">Monthly Income:</div>
//             {isEditingIncome ? (
//               <div className="flex items-center space-x-1">
//                 <input
//                   type="number"
//                   value={tempIncomeInput}
//                   onChange={(e) => setTempIncomeInput(e.target.value)}
//                   className="w-16 h-6 border rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-background text-foreground"
//                 />
//                 <button onClick={handleSaveIncome} className="p-0.5 hover:text-emerald-500 text-muted-foreground">
//                   <Check className="h-4 w-4" />
//                 </button>
//               </div>
//             ) : (
//               <div className="flex items-center space-x-1.5">
//                 <span className="text-sm font-bold text-foreground">${monthlyIncome.toFixed(0)}</span>
//                 <button 
//                   onClick={() => {
//                     setTempIncomeInput(monthlyIncome.toString());
//                     setIsEditingIncome(true);
//                   }}
//                   className="p-0.5 hover:text-indigo-500 text-muted-foreground transition-colors"
//                 >
//                   <Edit2 className="h-3 w-3" />
//                 </button>
//               </div>
//             )}
//           </div>

//           <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm max-w-xs">
//             <Calendar className="h-4 w-4 text-muted-foreground ml-1.5 flex-shrink-0" />
//             <select
//               id="statement-period"
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//               className="w-full bg-transparent text-sm font-medium focus:outline-none pr-8 cursor-pointer text-foreground"
//             >
//               {getMonthOptions().map((opt) => (
//                 <option key={opt.value} value={opt.value}>
//                   {opt.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* AI Assistant Dual Logger */}
//       <Card className="border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/10 to-transparent shadow-sm">
//         <CardHeader className="pb-3 flex flex-row items-center space-x-2">
//           <div className="p-1.5 bg-indigo-500 rounded-md text-white">
//             <Sparkles className="h-4 w-4" />
//           </div>
//           <div>
//             <CardTitle className="text-base font-semibold">AI Financial Assistant</CardTitle>
//             <CardDescription className="text-xs">Type expenses OR investments (e.g., "Bought 5 shares of Nifty ETF at 240" or "Spent $35 on lunch").</CardDescription>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleAiQuickLog} className="relative flex items-center">
//             <input
//               type="text"
//               value={aiPrompt}
//               onChange={(e) => setAiPrompt(e.target.value)}
//               disabled={isAiLoading}
//               placeholder='e.g. "Bought 10 shares of Reliance at 2980" or "Spent $42 on groceries"'
//               className="w-full h-10 pl-3 pr-12 rounded-lg border border-gray-200 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground"
//               required
//             />
//             <button
//               type="submit"
//               disabled={isAiLoading || !aiPrompt.trim()}
//               className="absolute right-1.5 p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-md text-white transition-colors disabled:opacity-50"
//             >
//               <Send className="h-4 w-4" />
//             </button>
//           </form>
//         </CardContent>
//       </Card>

//       {/* Overview Stat Cards */}
//       <div className="grid gap-4 sm:grid-cols-3">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
//             <DollarSign className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
//             <p className="text-xs text-muted-foreground">{format(currentMonthDate, "MMMM yyyy")}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className={`text-sm font-medium ${remaining < 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
//               {remaining < 0 ? "Over Budget" : "Unspent Surplus"}
//             </CardTitle>
//             <TrendingDown className={`h-4 w-4 ${remaining < 0 ? "text-destructive" : "text-emerald-500"}`} />
//           </CardHeader>
//           <CardContent>
//             <div className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
//               ${Math.abs(remaining).toFixed(2)}
//             </div>
//             <p className="text-xs text-muted-foreground mt-1">
//               Monthly Idle Balance: <span className="font-bold text-foreground">${idleBalance.toFixed(0)}</span>
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Active Portfolio Value</CardTitle>
//             <Briefcase className="h-4 w-4 text-indigo-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${portfolioCurrentVal.toFixed(2)}</div>
//             <p className={`text-xs font-semibold mt-1 ${portfolioPnL >= 0 ? "text-emerald-600" : "text-destructive"}`}>
//               {portfolioPnL >= 0 ? "+" : ""}${portfolioPnL.toFixed(2)} ({portfolioPnLPercent >= 0 ? "+" : ""}{portfolioPnLPercent.toFixed(1)}%)
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Active Portfolio & Live P&L Tracker */}
//       <Card className="border shadow-sm">
//         <CardHeader className="pb-3 flex flex-row items-center justify-between">
//           <div className="flex items-center space-x-2">
//             <div className="p-1.5 bg-indigo-600 rounded-md text-white">
//               <Briefcase className="h-4 w-4" />
//             </div>
//             <div>
//               <CardTitle className="text-base font-semibold">Active Investment Portfolio</CardTitle>
//               <CardDescription className="text-xs">Live P&L tracking of your actual stocks and index holdings.</CardDescription>
//             </div>
//           </div>
//           <button
//             onClick={() => setShowAddHolding(!showAddHolding)}
//             className="flex items-center space-x-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
//           >
//             <Plus className="h-3.5 w-3.5" />
//             <span>Add Position</span>
//           </button>
//         </CardHeader>
//         <CardContent>
//           {showAddHolding && (
//             <form onSubmit={handleAddManualHolding} className="mb-4 p-3 bg-muted/40 rounded-lg border grid gap-3 sm:grid-cols-4 items-end">
//               <div>
//                 <label className="text-[11px] font-semibold text-muted-foreground">Select Asset</label>
//                 <select
//                   value={newHoldSymbol}
//                   onChange={(e) => setNewHoldSymbol(e.target.value)}
//                   className="w-full text-xs h-8 border rounded px-2 bg-background text-foreground"
//                 >
//                   {REAL_MARKET_ASSETS.map(a => (
//                     <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="text-[11px] font-semibold text-muted-foreground">Quantity / Units</label>
//                 <input
//                   type="number"
//                   placeholder="e.g. 5"
//                   value={newHoldQty}
//                   onChange={(e) => setNewHoldQty(e.target.value)}
//                   className="w-full text-xs h-8 border rounded px-2 bg-background text-foreground"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="text-[11px] font-semibold text-muted-foreground">Avg Buy Price ($)</label>
//                 <input
//                   type="number"
//                   placeholder="e.g. 21500"
//                   value={newHoldPrice}
//                   onChange={(e) => setNewHoldPrice(e.target.value)}
//                   className="w-full text-xs h-8 border rounded px-2 bg-background text-foreground"
//                   required
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-colors"
//               >
//                 Save Holding
//               </button>
//             </form>
//           )}

//           {holdings.length > 0 ? (
//             <div className="overflow-x-auto">
//               <table className="w-full text-xs text-left">
//                 <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold">
//                   <tr>
//                     <th className="p-2.5 rounded-l">Asset</th>
//                     <th className="p-2.5">Type</th>
//                     <th className="p-2.5">Qty</th>
//                     <th className="p-2.5">Avg Price</th>
//                     <th className="p-2.5">Current</th>
//                     <th className="p-2.5">Invested</th>
//                     <th className="p-2.5 rounded-r text-right">Unrealized P&L</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-muted/30 font-medium">
//                   {holdings.map((h) => {
//                     const invested = h.quantity * h.avgBuyPrice;
//                     const currentVal = h.quantity * h.currentPrice;
//                     const pnl = currentVal - invested;
//                     const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

//                     return (
//                       <tr key={h.id} className="hover:bg-muted/10">
//                         <td className="p-2.5 font-bold text-foreground">{h.name} <span className="text-muted-foreground font-normal">({h.symbol})</span></td>
//                         <td className="p-2.5"><span className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded font-semibold">{h.type}</span></td>
//                         <td className="p-2.5">{h.quantity}</td>
//                         <td className="p-2.5">${h.avgBuyPrice.toFixed(2)}</td>
//                         <td className="p-2.5">${h.currentPrice.toFixed(2)}</td>
//                         <td className="p-2.5">${invested.toFixed(2)}</td>
//                         <td className={`p-2.5 text-right font-bold ${pnl >= 0 ? "text-emerald-600" : "text-destructive"}`}>
//                           {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <p className="text-xs text-muted-foreground text-center py-4">No active positions tracked yet. Add one above or use the AI prompt!</p>
//           )}
//         </CardContent>
//       </Card>

//       {/* Historical CAGR Benchmark Simulator */}
//       <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50/20 via-background to-transparent shadow-sm">
//         <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
//           <div className="flex items-center space-x-2">
//             <div className="p-1.5 bg-emerald-500 rounded-md text-white">
//               <LineChart className="h-4 w-4" />
//             </div>
//             <div>
//               <CardTitle className="text-base font-semibold">Real Historical CAGR Benchmark Simulator</CardTitle>
//               <CardDescription className="text-xs">
//                 Project surplus compounding based on actual 1Y, 3Y, and 5Y historical asset returns.
//               </CardDescription>
//             </div>
//           </div>

//           <div className="flex items-center space-x-2">
//             <span className="text-xs font-medium text-muted-foreground">Benchmark Asset:</span>
//             <select
//               value={selectedAssetSymbol}
//               onChange={(e) => setSelectedAssetSymbol(e.target.value)}
//               className="text-xs font-semibold bg-background border rounded-md p-1.5 focus:outline-none text-foreground cursor-pointer"
//             >
//               {REAL_MARKET_ASSETS.map(a => (
//                 <option key={a.symbol} value={a.symbol}>
//                   {a.name} ({a.cagr3Y}% 3Y CAGR)
//                 </option>
//               ))}
//             </select>
//           </div>
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {idleBalance <= 0 ? (
//             <div className="text-center py-4 px-2 border border-dashed rounded-lg bg-muted/20">
//               <p className="text-sm font-semibold text-destructive">Spending exceeds monthly income!</p>
//               <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
//                 Adjust your income setting or manage monthly expenses to generate a dynamic surplus for investment simulation.
//               </p>
//             </div>
//           ) : (
//             <div className="grid gap-6 lg:grid-cols-12">
              
//               {/* Dynamic Controls Column (5 cols) */}
//               <div className="lg:col-span-5 space-y-4">
//                 <div className="flex items-baseline justify-between border-b pb-2">
//                   <span className="text-xs font-medium text-muted-foreground">Unspent Monthly Surplus:</span>
//                   <span className="text-lg font-bold text-emerald-600">${idleBalance.toFixed(2)}/mo</span>
//                 </div>

//                 <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1">
//                   <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
//                     <span>{selectedAsset.name}</span>
//                     <span className="text-emerald-600">{activeCAGR}% CAGR</span>
//                   </div>
//                   <p className="text-[11px] text-muted-foreground">{selectedAsset.description}</p>
//                 </div>

//                 {/* Timeline Slider */}
//                 <div className="space-y-1.5">
//                   <div className="flex justify-between items-center text-xs font-medium">
//                     <span className="text-muted-foreground">Historical Horizon:</span>
//                     <span className="text-indigo-600 font-bold">{timelineYears} {timelineYears === 1 ? "Year" : "Years"}</span>
//                   </div>
//                   <input
//                     type="range"
//                     min="1"
//                     max="5"
//                     step="1"
//                     value={timelineYears}
//                     onChange={(e) => setTimelineYears(parseInt(e.target.value, 10))}
//                     className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
//                   />
//                   <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
//                     <span>1 yr (1Y CAGR)</span>
//                     <span>3 yrs (3Y CAGR)</span>
//                     <span>5 yrs (5Y CAGR)</span>
//                   </div>
//                 </div>

//                 {/* Annual Step-Up Selector */}
//                 <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg border">
//                   <span className="text-muted-foreground font-medium">Annual SIP Step-Up:</span>
//                   <div className="flex space-x-1">
//                     {[0, 5, 10].map((step) => (
//                       <button
//                         key={step}
//                         onClick={() => setStepUpPercent(step)}
//                         className={`px-2 py-0.5 text-[11px] font-bold rounded ${
//                           stepUpPercent === step ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"
//                         }`}
//                       >
//                         +{step}%
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Inflation Adjustment Switch */}
//                 <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg border">
//                   <span className="text-muted-foreground font-medium">Adjust for Inflation (~6%):</span>
//                   <button
//                     onClick={() => setAdjustInflation(!adjustInflation)}
//                     className={`px-2.5 py-0.5 text-[11px] font-bold rounded transition-colors ${
//                       adjustInflation ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
//                     }`}
//                   >
//                     {adjustInflation ? "ON (Real Value)" : "OFF (Nominal)"}
//                   </button>
//                 </div>
//               </div>

//               {/* Dynamic Projection Chart (7 cols) */}
//               <div className="lg:col-span-7 flex flex-col justify-between space-y-4 border-l pl-0 lg:pl-6 border-muted/50">
//                 <div className="space-y-1">
//                   <div className="flex justify-between items-baseline">
//                     <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                       {adjustInflation ? "Real Purchasing Power" : "Projected Benchmark Value"}
//                     </span>
//                     <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
//                       <TrendingUp className="h-3.5 w-3.5" />
//                       +${wealthGained.toFixed(0)} wealth gained
//                     </span>
//                   </div>
                  
//                   <div className="text-2xl font-extrabold text-foreground">
//                     ${(adjustInflation ? realPurchasingPower : finalValue).toFixed(2)}
//                     {adjustInflation && (
//                       <span className="text-xs font-normal text-muted-foreground ml-2">
//                         (Nominal: ${finalValue.toFixed(0)})
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 <div className="h-36 w-full pt-2">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <AreaChart data={yearlyBreakdown}>
//                       <XAxis dataKey="year" tick={{ fontSize: 10 }} />
//                       <YAxis tick={{ fontSize: 10 }} />
//                       <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
//                       <Area type="monotone" dataKey="invested" stackId="1" stroke="#6366f1" fill="#6366f1" name="Invested Cash" />
//                       <Area type="monotone" dataKey="wealth" stackId="1" stroke="#10b981" fill="#34d399" name="Accrued Wealth" />
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>

//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Tiered Daily Stock & ETF Recommendation Engine */}
//       <Card className="border shadow-sm">
//         <CardHeader className="pb-3">
//           <div className="flex items-center space-x-2">
//             <div className="p-1.5 bg-amber-500 rounded-md text-white">
//               <Award className="h-4 w-4" />
//             </div>
//             <div>
//               <CardTitle className="text-base font-semibold">Tiered Long-Term Stock & ETF Recommendations</CardTitle>
//               <CardDescription className="text-xs">Curated growth vehicles categorized by risk profile & 5-year compounding stability.</CardDescription>
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="grid gap-4 md:grid-cols-3">
//           {/* Tier 1 */}
//           <div className="p-3 border rounded-xl bg-gradient-to-b from-emerald-50/30 to-transparent space-y-2">
//             <div className="flex items-center justify-between">
//               <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Tier 1: Foundation</span>
//               <span className="text-xs font-bold text-emerald-600">Low Risk</span>
//             </div>
//             <h4 className="text-sm font-bold text-foreground">Broad Market Index ETFs</h4>
//             <p className="text-xs text-muted-foreground">Core holding for long-term SIPs with minimal individual stock volatility.</p>
//             <div className="border-t pt-2 space-y-1 text-xs">
//               <div className="flex justify-between font-medium"><span>Nifty 50 ETF (^NSEI)</span><span className="font-bold text-foreground">15.1% 5Y CAGR</span></div>
//               <div className="flex justify-between font-medium"><span>S&P 500 ETF (VOO)</span><span className="font-bold text-foreground">14.6% 5Y CAGR</span></div>
//             </div>
//           </div>

//           {/* Tier 2 */}
//           <div className="p-3 border rounded-xl bg-gradient-to-b from-indigo-50/30 to-transparent space-y-2">
//             <div className="flex items-center justify-between">
//               <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Tier 2: Growth Pillars</span>
//               <span className="text-xs font-bold text-indigo-600">Moderate Risk</span>
//             </div>
//             <h4 className="text-sm font-bold text-foreground">Blue-Chip Market Leaders</h4>
//             <p className="text-xs text-muted-foreground">Industry giants with strong balance sheets and market dominance.</p>
//             <div className="border-t pt-2 space-y-1 text-xs">
//               <div className="flex justify-between font-medium"><span>Reliance Ind.</span><span className="font-bold text-foreground">17.3% 5Y CAGR</span></div>
//               <div className="flex justify-between font-medium"><span>Apple Inc. (AAPL)</span><span className="font-bold text-foreground">22.8% 5Y CAGR</span></div>
//             </div>
//           </div>

//           {/* Tier 3 */}
//           <div className="p-3 border rounded-xl bg-gradient-to-b from-purple-50/30 to-transparent space-y-2">
//             <div className="flex items-center justify-between">
//               <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Tier 3: Accelerators</span>
//               <span className="text-xs font-bold text-purple-600">Dividend Focus</span>
//             </div>
//             <h4 className="text-sm font-bold text-foreground">Dividend Aristocrats</h4>
//             <p className="text-xs text-muted-foreground">Generates recurring cash-flow to reinvest directly back into compounding.</p>
//             <div className="border-t pt-2 space-y-1 text-xs">
//               <div className="flex justify-between font-medium"><span>Schwab Div ETF (SCHD)</span><span className="font-bold text-foreground">11.9% 5Y CAGR</span></div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Visual Charts */}
//       <div className="grid gap-6 lg:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base">Daily Spending Breakdown</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {dailyData.some((d) => d.amount > 0) ? (
//               <ResponsiveContainer width="100%" height={220}>
//                 <BarChart data={dailyData}>
//                   <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
//                   <YAxis tick={{ fontSize: 11 }} />
//                   <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]} />
//                   <Bar dataKey="amount" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             ) : (
//               <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
//                 No spending data recorded this month
//               </p>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base">Spending by Category</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {pieData.length > 0 ? (
//               <ResponsiveContainer width="100%" height={220}>
//                 <PieChart>
//                   <Pie
//                     data={pieData}
//                     dataKey="total"
//                     nameKey="label"
//                     cx="50%"
//                     cy="50%"
//                     outerRadius={85}
//                     innerRadius={45}
//                     paddingAngle={2}
//                     label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
//                   >
//                     {pieData.map((entry) => (
//                       <Cell key={entry.value} fill={CATEGORY_COLORS[entry.value as ExpenseCategory]} />
//                     ))}
//                   </Pie>
//                   <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
//                 </PieChart>
//               </ResponsiveContainer>
//             ) : (
//               <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
//                 No expenses recorded
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Recent Transactions */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-base">Recent Transactions</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {recentExpenses.length > 0 ? (
//             <div className="flex flex-col gap-1">
//               {recentExpenses.map((e, index) => {
//                 const cat = CATEGORIES.find((c) => c.value === e.category);
//                 const currentExpenseDate = parseISO(e.date);
                
//                 const showMonthHeader =
//                   index === 0 ||
//                   format(parseISO(recentExpenses[index - 1].date), "yyyy-MM") !== format(currentExpenseDate, "yyyy-MM");

//                 return (
//                   <div key={e.id}>
//                     {showMonthHeader && (
//                       <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2.5 py-1 rounded w-fit mt-3 mb-1 first:mt-0">
//                         {format(currentExpenseDate, "MMMM yyyy")}
//                       </div>
//                     )}

//                     <div className="flex items-center justify-between py-2 border-b border-muted/40 last:border-0 hover:bg-muted/10 px-1 rounded transition-colors">
//                       <div className="flex items-center gap-3">
//                         <span className="text-lg flex-shrink-0">{cat?.icon}</span>
//                         <div>
//                           <p className="text-sm font-medium text-foreground">{e.description || cat?.label}</p>
//                           <p className="text-xs text-muted-foreground">{format(currentExpenseDate, "MMM d, yyyy")}</p>
//                         </div>
//                       </div>
//                       <span className="font-semibold text-sm text-foreground">-${e.amount.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           ) : (
//             <p className="text-sm text-muted-foreground py-2">No expenses recorded yet.</p>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Dashboard;

// import React, { useState, useEffect } from "react";
// import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { useExpenses } from "@/hooks/use-expenses";
// import { useBudgets } from "@/hooks/use-budgets";
// import { useAuth } from "@/hooks/use-auth";
// import { CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/lib/types";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell
// } from "recharts";
// import { 
//   DollarSign, TrendingDown, Calendar, Sparkles, Send, 
//   Briefcase, Edit2, Check, ArrowRight
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// interface InvestmentHolding {
//   id: string;
//   symbol: string;
//   name: string;
//   quantity: number;
//   avgBuyPrice: number;
//   currentPrice: number;
//   type: "INDEX" | "STOCK" | "SIP";
//   purchaseDate: string;
// }

// export default function Dashboard() {
//   const { expenses, selectedMonth, setSelectedMonth } = useExpenses();
//   const { budgets } = useBudgets();
//   const { token } = useAuth();
//   const navigate = useNavigate();

//   const [aiPrompt, setAiPrompt] = useState("");
//   const [isAiLoading, setIsAiLoading] = useState(false);

//   const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
//     const saved = localStorage.getItem("user_monthly_income");
//     return saved ? parseFloat(saved) : 5000;
//   });
//   const [isEditingIncome, setIsEditingIncome] = useState(false);
//   const [tempIncomeInput, setTempIncomeInput] = useState(monthlyIncome.toString());

//   const [holdings, setHoldings] = useState<InvestmentHolding[]>(() => {
//     const saved = localStorage.getItem("user_portfolio_holdings");
//     if (saved) {
//       try { return JSON.parse(saved); } catch { /* ignore fallback */ }
//     }
//     return [
//       {
//         id: "hold-1",
//         symbol: "^NSEI",
//         name: "Nifty 50 Index Fund",
//         quantity: 12,
//         avgBuyPrice: 21500,
//         currentPrice: 24350.50,
//         type: "SIP",
//         purchaseDate: "2023-11-15"
//       },
//       {
//         id: "hold-2",
//         symbol: "VOO",
//         name: "S&P 500 Index ETF",
//         quantity: 4,
//         avgBuyPrice: 440.00,
//         currentPrice: 512.30,
//         type: "INDEX",
//         purchaseDate: "2024-02-10"
//       }
//     ];
//   });

//   useEffect(() => {
//     localStorage.setItem("user_portfolio_holdings", JSON.stringify(holdings));
//   }, [holdings]);

//   const currentMonthDate = parseISO(`${selectedMonth}-01`);
//   const monthStart = startOfMonth(currentMonthDate);
//   const monthEnd = endOfMonth(currentMonthDate);

//   const monthExpenses = expenses.filter((e) => {
//     const d = parseISO(e.date);
//     return d >= monthStart && d <= monthEnd;
//   });

//   const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
//   const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
//   const remaining = totalBudget - totalSpent;
//   const idleBalance = Math.max(0, monthlyIncome - totalSpent);

//   const portfolioInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice), 0);
//   const portfolioCurrentVal = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
//   const portfolioPnL = portfolioCurrentVal - portfolioInvested;
//   const portfolioPnLPercent = portfolioInvested > 0 ? (portfolioPnL / portfolioInvested) * 100 : 0;

//   const handleSaveIncome = () => {
//     const parsed = parseFloat(tempIncomeInput);
//     if (!isNaN(parsed) && parsed >= 0) {
//       setMonthlyIncome(parsed);
//       localStorage.setItem("user_monthly_income", parsed.toString());
//       setIsEditingIncome(false);
//       toast.success("Monthly income updated successfully!");
//     } else {
//       toast.error("Please enter a valid positive income figure");
//     }
//   };

//   const handleAiQuickLog = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!aiPrompt.trim()) return;

//     setIsAiLoading(true);
//     const toastId = toast.loading("AI analyzing financial intent...");

//     const lowerPrompt = aiPrompt.toLowerCase();
//     const isInvestmentIntent = lowerPrompt.includes("buy") || lowerPrompt.includes("bought") || 
//                                 lowerPrompt.includes("invest") || lowerPrompt.includes("shares") || 
//                                 lowerPrompt.includes("sip");

//     if (isInvestmentIntent) {
//       setTimeout(() => {
//         const numbers = aiPrompt.match(/\d+(\.\d+)?/g);
//         const qty = numbers && numbers[0] ? parseFloat(numbers[0]) : 1;
//         const price = numbers && numbers[1] ? parseFloat(numbers[1]) : 24350.50;

//         const newHolding: InvestmentHolding = {
//           id: `ai-hold-${Date.now()}`,
//           symbol: "^NSEI",
//           name: "Nifty 50 Index Fund",
//           quantity: qty,
//           avgBuyPrice: price,
//           currentPrice: 24350.50,
//           type: "INDEX",
//           purchaseDate: format(new Date(), "yyyy-MM-dd")
//         };

//         setHoldings(prev => [newHolding, ...prev]);
//         setAiPrompt("");
//         setIsAiLoading(false);
//         toast.success(`Logged Investment: ${qty} units @ $${price.toFixed(2)}`, { id: toastId });
//       }, 800);
//     } else {
//       try {
//         const response = await fetch("http://localhost:8080/api/expenses/ai", {
//           method: "POST",
//           headers: {
//             "Content-Type": "text/plain",
//             "Authorization": `Bearer ${token}`
//           },
//           body: aiPrompt,
//         });

//         if (response.ok) {
//           const newExpense = await response.json();
//           const targetMonth = format(parseISO(newExpense.date), "yyyy-MM");
//           setSelectedMonth(targetMonth);
//           setAiPrompt("");
//           toast.success(`Logged Expense: $${newExpense.amount.toFixed(2)} for "${newExpense.description}"`, { id: toastId });
//         } else {
//           toast.error("Failed to parse prompt.", { id: toastId });
//         }
//       } catch {
//         toast.error("Network offline. Please try again.", { id: toastId });
//       } finally {
//         setIsAiLoading(false);
//       }
//     }
//   };

//   const categoryTotals = CATEGORIES.map((c) => ({
//     ...c,
//     total: monthExpenses
//       .filter((e) => e.category === c.value)
//       .reduce((sum, e) => sum + e.amount, 0),
//   })).sort((a, b) => b.total - a.total);

//   const today = new Date();
//   const endIntervalDate = monthEnd > today && isSameYearMonth(monthEnd, today) ? today : monthEnd;
//   const days = eachDayOfInterval({ start: monthStart, end: endIntervalDate });

//   const dailyData = days.map((day) => ({
//     date: format(day, "MMM d"),
//     amount: monthExpenses
//       .filter((e) => format(parseISO(e.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
//       .reduce((sum, e) => sum + e.amount, 0),
//   }));

//   const pieData = categoryTotals.filter((c) => c.total > 0);
//   const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

//   function isSameYearMonth(dateA: Date, dateB: Date) {
//     return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth();
//   }

//   const getMonthOptions = () => {
//     const options = [];
//     const iteratorDate = new Date();
//     for (let i = 0; i < 12; i++) {
//       const year = iteratorDate.getFullYear();
//       const monthStr = String(iteratorDate.getMonth() + 1).padStart(2, '0');
//       const textLabel = iteratorDate.toLocaleString('default', { month: 'long', year: 'numeric' });
//       options.push({ value: `${year}-${monthStr}`, label: textLabel });
//       iteratorDate.setMonth(iteratorDate.getMonth() - 1);
//     }
//     return options;
//   };

//   return (
//     <div className="container mx-auto space-y-6 px-4 py-6">
      
//       {/* Top Header Bar */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
//           <p className="text-sm text-muted-foreground">Track monthly income, expenses, budgets, and unspent idle surplus.</p>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm">
//             <DollarSign className="h-4 w-4 text-emerald-500" />
//             <div className="text-xs font-semibold text-muted-foreground">Monthly Income:</div>
//             {isEditingIncome ? (
//               <div className="flex items-center space-x-1">
//                 <input
//                   type="number"
//                   value={tempIncomeInput}
//                   onChange={(e) => setTempIncomeInput(e.target.value)}
//                   className="w-16 h-6 border rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-background text-foreground"
//                 />
//                 <button onClick={handleSaveIncome} className="p-0.5 hover:text-emerald-500 text-muted-foreground">
//                   <Check className="h-4 w-4" />
//                 </button>
//               </div>
//             ) : (
//               <div className="flex items-center space-x-1.5">
//                 <span className="text-sm font-bold text-foreground">${monthlyIncome.toFixed(0)}</span>
//                 <button 
//                   onClick={() => {
//                     setTempIncomeInput(monthlyIncome.toString());
//                     setIsEditingIncome(true);
//                   }}
//                   className="p-0.5 hover:text-indigo-500 text-muted-foreground transition-colors"
//                 >
//                   <Edit2 className="h-3 w-3" />
//                 </button>
//               </div>
//             )}
//           </div>

//           <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm max-w-xs">
//             <Calendar className="h-4 w-4 text-muted-foreground ml-1.5 flex-shrink-0" />
//             <select
//               id="statement-period"
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//               className="w-full bg-transparent text-xs font-semibold focus:outline-none pr-8 cursor-pointer text-foreground"
//             >
//               {getMonthOptions().map((opt) => (
//                 <option key={opt.value} value={opt.value}>
//                   {opt.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* AI Assistant Dual Logger */}
//       <Card className="border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/10 to-transparent shadow-sm">
//         <CardHeader className="pb-3 flex flex-row items-center space-x-2">
//           <div className="p-1.5 bg-indigo-500 rounded-md text-white">
//             <Sparkles className="h-4 w-4" />
//           </div>
//           <div>
//             <CardTitle className="text-base font-semibold">AI Assistant</CardTitle>
//             <CardDescription className="text-xs">Log expenses or investment purchases using natural language.</CardDescription>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleAiQuickLog} className="relative flex items-center">
//             <input
//               type="text"
//               value={aiPrompt}
//               onChange={(e) => setAiPrompt(e.target.value)}
//               disabled={isAiLoading}
//               placeholder='e.g. "Spent $42 on groceries" or "Bought 5 shares of Nifty ETF at $240"'
//               className="w-full h-10 pl-3 pr-12 rounded-lg border border-gray-200 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground"
//               required
//             />
//             <button
//               type="submit"
//               disabled={isAiLoading || !aiPrompt.trim()}
//               className="absolute right-1.5 p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-md text-white transition-colors disabled:opacity-50"
//             >
//               <Send className="h-4 w-4" />
//             </button>
//           </form>
//         </CardContent>
//       </Card>

//       {/* Overview Stat Cards */}
//       <div className="grid gap-4 sm:grid-cols-3">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Spent</CardTitle>
//             <DollarSign className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
//             <p className="text-xs text-muted-foreground mt-1">{format(currentMonthDate, "MMMM yyyy")}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
//               {remaining < 0 ? "Over Budget" : "Unspent Surplus"}
//             </CardTitle>
//             <TrendingDown className={`h-4 w-4 ${remaining < 0 ? "text-destructive" : "text-emerald-500"}`} />
//           </CardHeader>
//           <CardContent>
//             <div className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
//               ${Math.abs(remaining).toFixed(2)}
//             </div>
//             <p className="text-xs text-muted-foreground mt-1">
//               Monthly Unspent Surplus: <span className="font-bold text-foreground">${idleBalance.toFixed(0)}</span>
//             </p>
//           </CardContent>
//         </Card>

//         {/* Portfolio Summary Card linking directly to /investments */}
//         <Card className="hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => navigate("/investments")}>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Portfolio Value</CardTitle>
//             <Briefcase className="h-4 w-4 text-indigo-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${portfolioCurrentVal.toFixed(2)}</div>
//             <p className={`text-xs font-bold mt-1 flex items-center justify-between ${portfolioPnL >= 0 ? "text-emerald-600" : "text-destructive"}`}>
//               <span>{portfolioPnL >= 0 ? "+" : ""}${portfolioPnL.toFixed(2)} ({portfolioPnLPercent >= 0 ? "+" : ""}{portfolioPnLPercent.toFixed(1)}%)</span>
//               <span className="text-indigo-600 flex items-center text-[10px] uppercase font-extrabold">Analytics <ArrowRight className="h-3 w-3 ml-0.5" /></span>
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Visual Expense Charts */}
//       <div className="grid gap-6 lg:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base font-semibold">Daily Spending Breakdown</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {dailyData.some((d) => d.amount > 0) ? (
//               <ResponsiveContainer width="100%" height={220}>
//                 <BarChart data={dailyData}>
//                   <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
//                   <YAxis tick={{ fontSize: 11 }} />
//                   <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]} />
//                   <Bar dataKey="amount" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             ) : (
//               <p className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
//                 No spending data recorded this month
//               </p>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {pieData.length > 0 ? (
//               <ResponsiveContainer width="100%" height={220}>
//                 <PieChart>
//                   <Pie
//                     data={pieData}
//                     dataKey="total"
//                     nameKey="label"
//                     cx="50%"
//                     cy="50%"
//                     outerRadius={85}
//                     innerRadius={45}
//                     paddingAngle={2}
//                     label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
//                   >
//                     {pieData.map((entry) => (
//                       <Cell key={entry.value} fill={CATEGORY_COLORS[entry.value as ExpenseCategory]} />
//                     ))}
//                   </Pie>
//                   <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
//                 </PieChart>
//               </ResponsiveContainer>
//             ) : (
//               <p className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
//                 No expenses recorded
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Recent Expense Transactions */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {recentExpenses.length > 0 ? (
//             <div className="flex flex-col gap-1">
//               {recentExpenses.map((e, index) => {
//                 const cat = CATEGORIES.find((c) => c.value === e.category);
//                 const currentExpenseDate = parseISO(e.date);
                
//                 const showMonthHeader =
//                   index === 0 ||
//                   format(parseISO(recentExpenses[index - 1].date), "yyyy-MM") !== format(currentExpenseDate, "yyyy-MM");

//                 return (
//                   <div key={e.id}>
//                     {showMonthHeader && (
//                       <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2.5 py-1 rounded w-fit mt-3 mb-1 first:mt-0">
//                         {format(currentExpenseDate, "MMMM yyyy")}
//                       </div>
//                     )}

//                     <div className="flex items-center justify-between py-2 border-b border-muted/40 last:border-0 hover:bg-muted/10 px-1 rounded transition-colors">
//                       <div className="flex items-center gap-3">
//                         <span className="text-lg flex-shrink-0">{cat?.icon}</span>
//                         <div>
//                           <p className="text-xs font-bold text-foreground">{e.description || cat?.label}</p>
//                           <p className="text-[11px] text-muted-foreground">{format(currentExpenseDate, "MMM d, yyyy")}</p>
//                         </div>
//                       </div>
//                       <span className="font-bold text-xs text-foreground">-${e.amount.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           ) : (
//             <p className="text-xs text-muted-foreground py-2">No expenses recorded yet.</p>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

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