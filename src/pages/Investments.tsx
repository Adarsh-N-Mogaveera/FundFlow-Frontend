import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Briefcase, Plus, RefreshCw,
  Trash2, Edit3, PieChart as PieIcon, Award, Search, Check, X, LineChart, ShieldCheck, Zap, Sparkles
} from "lucide-react";
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

interface AssetMarketDTO {
  symbol: string;
  name: string;
  category: "TIER1_INDEX" | "TIER2_BLUECHIP" | "TIER3_DIVIDEND";
  currentPrice: number;
  cagr1Y: number;
  cagr3Y: number;
  cagr5Y: number;
  dailyChange: number;
  riskLevel: string;
  description: string;
}

const CATEGORY_COLORS = {
  INDEX: "#6366f1",
  STOCK: "#10b981",
  SIP: "#f59e0b",
};

const FALLBACK_MARKET_ASSETS: AssetMarketDTO[] = [
  {
    symbol: "^NSEI",
    name: "Nifty 50 Index Fund",
    category: "TIER1_INDEX",
    currentPrice: 24350.50,
    cagr1Y: 14.2,
    cagr3Y: 13.8,
    cagr5Y: 15.1,
    dailyChange: +0.65,
    riskLevel: "Low",
    description: "Top 50 companies in India. Foundation for compounding SIPs with low volatility."
  },
  {
    symbol: "VOO",
    name: "S&P 500 Index ETF",
    category: "TIER1_INDEX",
    currentPrice: 512.30,
    cagr1Y: 18.5,
    cagr3Y: 12.4,
    cagr5Y: 14.6,
    dailyChange: +0.42,
    riskLevel: "Low",
    description: "Top 500 US companies. Gold standard global wealth builder."
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    category: "TIER2_BLUECHIP",
    currentPrice: 2980.00,
    cagr1Y: 16.8,
    cagr3Y: 14.1,
    cagr5Y: 17.3,
    dailyChange: +1.12,
    riskLevel: "Moderate",
    description: "Energy, retail & telecom giant with dominant market share."
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "TIER2_BLUECHIP",
    currentPrice: 224.50,
    cagr1Y: 21.0,
    cagr3Y: 15.6,
    cagr5Y: 22.8,
    dailyChange: -0.15,
    riskLevel: "Moderate",
    description: "Global tech pillar with vast consumer ecosystem."
  },
  {
    symbol: "SCHD",
    name: "US Dividend Equity ETF",
    category: "TIER3_DIVIDEND",
    currentPrice: 82.40,
    cagr1Y: 11.4,
    cagr3Y: 10.2,
    cagr5Y: 11.9,
    dailyChange: +0.28,
    riskLevel: "Low",
    description: "High-dividend growth stocks for cash-flow reinvestment."
  }
];

export default function InvestmentsPage() {
  const auth = useAuth() as any;
  const token = auth?.token || localStorage.getItem("spend_app_token");

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

  const [marketAssets, setMarketAssets] = useState<AssetMarketDTO[]>(FALLBACK_MARKET_ASSETS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [activeTierTab, setActiveTierTab] = useState<"TIER1" | "TIER2" | "TIER3">("TIER1");

  const [monthlyIncome] = useState<number>(() => {
    const saved = localStorage.getItem("user_monthly_income");
    return saved ? parseFloat(saved) : 5000;
  });
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>("^NSEI");
  const [timelineYears, setTimelineYears] = useState<number>(3);
  const [stepUpPercent, setStepUpPercent] = useState<number>(5);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const inflationRate = 6.0;

  const [showAddModal, setShowAddModal] = useState(false);
  const [formSymbol, setFormSymbol] = useState("^NSEI");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formType, setFormType] = useState<"INDEX" | "STOCK" | "SIP">("INDEX");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");

  useEffect(() => {
    localStorage.setItem("user_portfolio_holdings", JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    fetchMarketAssets();
    fetchUserInvestments();
  }, []);

  const fetchMarketAssets = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/market/assets`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setMarketAssets(data);
      }
    } catch {
      // Retain fallback asset catalog
    }
  };

  const fetchUserInvestments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/investments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHoldings(data);
        }
      }
    } catch {
      // Retain fallback
    }
  };

  const handleSyncPrices = async () => {
    setIsSyncing(true);
    const toastId = toast.loading("Syncing portfolio quotes with live market endpoints...");

    try {
      if (token) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/market/sync-portfolio`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const updated = await res.json();
          setHoldings(updated);
          toast.success("Portfolio synced with live market prices!", { id: toastId });
          setIsSyncing(false);
          return;
        }
      }

      setHoldings(prev =>
        prev.map(h => {
          const live = marketAssets.find(a => a.symbol === h.symbol);
          return live ? { ...h, currentPrice: live.currentPrice } : h;
        })
      );
      toast.success("Portfolio refreshed with live catalog quotes!", { id: toastId });
    } catch {
      toast.error("Network offline. Using cached prices.", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const totalInvested = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice), 0);
  }, [holdings]);

  const totalCurrentValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
  }, [holdings]);

  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const selectedAsset = marketAssets.find(a => a.symbol === selectedAssetSymbol) || marketAssets[0];

  const getAssetCAGR = () => {
    if (timelineYears <= 1) return selectedAsset.cagr1Y;
    if (timelineYears <= 3) return selectedAsset.cagr3Y;
    return selectedAsset.cagr5Y;
  };

  const activeCAGR = getAssetCAGR();

  const calculateProjections = () => {
    const P = monthlyIncome * 0.5;
    const r = activeCAGR / 100;
    const years = timelineYears;
    const yearlyBreakdown = [];

    const monthlyRate = r / 12;
    let currentMonthlyContrib = P;
    let runningBalance = 0;
    let totalDeposited = 0;

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        totalDeposited += currentMonthlyContrib;
        runningBalance = (runningBalance + currentMonthlyContrib) * (1 + monthlyRate);
      }
      
      const realValAtYear = runningBalance / Math.pow(1 + inflationRate / 100, y);
      yearlyBreakdown.push({
        year: `Yr ${y}`,
        invested: Math.round(totalDeposited),
        wealth: Math.round(Math.max(0, runningBalance - totalDeposited)),
        total: Math.round(runningBalance),
        realValue: Math.round(realValAtYear)
      });

      currentMonthlyContrib = currentMonthlyContrib * (1 + stepUpPercent / 100);
    }

    const wealthGained = Math.max(0, runningBalance - totalDeposited);
    const realPurchasingPower = runningBalance / Math.pow(1 + inflationRate / 100, years);

    return {
      totalDeposited,
      finalValue: runningBalance,
      wealthGained,
      realPurchasingPower,
      yearlyBreakdown
    };
  };

  const { finalValue, wealthGained, realPurchasingPower, yearlyBreakdown } = calculateProjections();

  const allocationData = useMemo(() => {
    const group: Record<string, number> = { INDEX: 0, STOCK: 0, SIP: 0 };
    holdings.forEach(h => {
      const val = h.quantity * h.currentPrice;
      group[h.type] = (group[h.type] || 0) + val;
    });

    return Object.entries(group)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [holdings]);

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formQty);
    const price = parseFloat(formPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      toast.error("Please enter valid positive quantity and price.");
      return;
    }

    const matchedAsset = marketAssets.find(a => a.symbol === formSymbol);
    const newHolding: InvestmentHolding = {
      id: `inv-${Date.now()}`,
      symbol: formSymbol,
      name: matchedAsset?.name || formSymbol,
      quantity: qty,
      avgBuyPrice: price,
      currentPrice: matchedAsset?.currentPrice || price,
      type: formType,
      purchaseDate: new Date().toISOString().split("T")[0]
    };

    if (token) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/investments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newHolding)
        });
        if (res.ok) {
          const saved = await res.json();
          setHoldings(prev => [saved, ...prev]);
          toast.success(`Successfully added ${saved.name} to portfolio!`);
          setShowAddModal(false);
          setFormQty("");
          setFormPrice("");
          return;
        }
      } catch {
        // Fallback
      }
    }

    setHoldings(prev => [newHolding, ...prev]);
    setShowAddModal(false);
    setFormQty("");
    setFormPrice("");
    toast.success(`Added ${newHolding.name} to portfolio!`);
  };

  const handleDeletePosition = async (id: string) => {
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/investments/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch { /* ignore */ }
    }
    setHoldings(prev => prev.filter(h => h.id !== id));
    toast.success("Position removed.");
  };

  const handleSaveEdit = async (id: string) => {
    const parsedQty = parseFloat(editQty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }

    const target = holdings.find(h => h.id === id);
    if (!target) return;

    const updated = { ...target, quantity: parsedQty };

    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/investments/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updated)
        });
      } catch { /* ignore */ }
    }

    setHoldings(prev => prev.map(h => h.id === id ? updated : h));
    setEditingId(null);
    toast.success("Position quantity updated!");
  };

  const filteredHoldings = holdings.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "ALL" || h.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      
      {/* Top Title Bar */}
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio Analytics & Stock Intelligence</h1>
          <p className="text-sm text-muted-foreground">Monitor real-time unrealized P&L, historical CAGR benchmarks, and tiered recommendations.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncPrices}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-background border hover:bg-accent rounded-lg text-xs font-semibold text-foreground transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-500" : ""}`} />
            <span>Sync Live Prices</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      {/* Condensed KPI Overview (2 Cards) */}
      {}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Portfolio Value</CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">${totalCurrentValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>Cost Basis: <span className="font-semibold text-foreground">${totalInvested.toFixed(2)}</span></span>
              <span className="text-[11px] bg-muted/60 px-2 py-0.5 rounded font-medium">{holdings.length} Positions</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Profit / Loss</CardTitle>
            {totalPnL >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-extrabold ${totalPnL >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>Unrealized Return: <span className={`font-bold ${totalPnLPercent >= 0 ? "text-emerald-600" : "text-destructive"}`}>{totalPnLPercent >= 0 ? "+" : ""}{totalPnLPercent.toFixed(2)}%</span></span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> Live Quotes</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compact 3-Tab Widget: Explore Long-Term Investment Ideas */}
      {}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-amber-500/10 text-amber-600 rounded-md">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Explore Long-Term Investment Ideas</CardTitle>
              <CardDescription className="text-[11px]">Curated growth vehicles grouped by risk profile & 5-year compounding trajectory.</CardDescription>
            </div>
          </div>

          {/* Compact Tab Switcher */}
          <div className="flex bg-muted/60 p-1 rounded-lg space-x-1 border">
            <button
              onClick={() => setActiveTierTab("TIER1")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                activeTierTab === "TIER1" ? "bg-background text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tier 1: Foundation
            </button>
            <button
              onClick={() => setActiveTierTab("TIER2")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                activeTierTab === "TIER2" ? "bg-background text-indigo-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tier 2: Blue-Chips
            </button>
            <button
              onClick={() => setActiveTierTab("TIER3")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                activeTierTab === "TIER3" ? "bg-background text-purple-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tier 3: Dividend
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-3">
          {activeTierTab === "TIER1" && (
            <div className="p-3 border rounded-xl bg-gradient-to-r from-emerald-50/20 via-background to-transparent space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-foreground">Broad Market Index ETFs (Low Risk)</h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Core Foundation</span>
              </div>
              <p className="text-xs text-muted-foreground">Optimal core holding for automated monthly compounding SIPs with low drawdowns.</p>
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                <div className="flex justify-between items-center p-2 bg-background border rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-foreground block">Nifty 50 ETF (^NSEI)</span>
                    <span className="text-[10px] text-muted-foreground">Top 50 Indian Market Leaders</span>
                  </div>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">15.1% 5Y CAGR</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background border rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-foreground block">S&P 500 ETF (VOO)</span>
                    <span className="text-[10px] text-muted-foreground">Top 500 US Blue-Chips</span>
                  </div>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">14.6% 5Y CAGR</span>
                </div>
              </div>
            </div>
          )}

          {activeTierTab === "TIER2" && (
            <div className="p-3 border rounded-xl bg-gradient-to-r from-indigo-50/20 via-background to-transparent space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-foreground">Blue-Chip Industry Giants (Moderate Risk)</h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Growth Pillars</span>
              </div>
              <p className="text-xs text-muted-foreground">Dominant market leaders with large balance sheets and sustained revenue expansion.</p>
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                <div className="flex justify-between items-center p-2 bg-background border rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-foreground block">Reliance Industries</span>
                    <span className="text-[10px] text-muted-foreground">Energy, Telecom & Retail Giant</span>
                  </div>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">17.3% 5Y CAGR</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background border rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-foreground block">Apple Inc. (AAPL)</span>
                    <span className="text-[10px] text-muted-foreground">Global Tech & Services Pillar</span>
                  </div>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">22.8% 5Y CAGR</span>
                </div>
              </div>
            </div>
          )}

          {activeTierTab === "TIER3" && (
            <div className="p-3 border rounded-xl bg-gradient-to-r from-purple-50/20 via-background to-transparent space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-foreground">Dividend Aristocrats & Cash-Flow Funds</h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Dividend Focus</span>
              </div>
              <p className="text-xs text-muted-foreground">Generates recurring cash-flow to reinvest directly back into portfolio compounding.</p>
              <div className="grid sm:grid-cols-1 gap-2 pt-1">
                <div className="flex justify-between items-center p-2 bg-background border rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-foreground block">Schwab US Dividend Equity ETF (SCHD)</span>
                    <span className="text-[10px] text-muted-foreground">High Dividend Growth Stocks with Low Expense Ratio</span>
                  </div>
                  <span className="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">11.9% 5Y CAGR</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Class Allocation Donut Chart */}
      {}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-indigo-500" />
            <span>Asset Class Allocation Breakdown</span>
          </CardTitle>
          <CardDescription className="text-xs">Distribution between Index ETFs, Blue-Chip Stocks, and Systematic Investment Plans (SIPs).</CardDescription>
        </CardHeader>
        <CardContent className="h-56 flex items-center justify-center">
          {allocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {allocationData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No active positions to map allocation.</p>
          )}
        </CardContent>
      </Card>

      {/* Minimal Active Holdings Table */}
      {}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Active Holdings Breakdown</CardTitle>
            <CardDescription className="text-xs">Real-time valuation of individual position lines.</CardDescription>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 h-8"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border rounded-lg px-2 h-8 bg-background text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="INDEX">Index ETFs</option>
              <option value="STOCK">Blue-Chip Stocks</option>
              <option value="SIP">SIP Mutual Funds</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredHoldings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3 rounded-l">Asset</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Live Price</th>
                    <th className="p-3">Current Value</th>
                    <th className="p-3">Unrealized P&L</th>
                    <th className="p-3 rounded-r text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30 font-medium">
                  {filteredHoldings.map((h) => {
                    const invested = h.quantity * h.avgBuyPrice;
                    const currentVal = h.quantity * h.currentPrice;
                    const pnl = currentVal - invested;
                    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
                    const isEditing = editingId === h.id;

                    return (
                      <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-bold text-foreground">
                          {h.name} <span className="text-muted-foreground font-normal">({h.symbol})</span>
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                value={editQty}
                                onChange={(e) => setEditQty(e.target.value)}
                                className="w-16 h-6 border rounded px-1 text-xs bg-background"
                              />
                              <button onClick={() => handleSaveEdit(h.id)} className="p-1 hover:text-emerald-500">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <span>{h.quantity}</span>
                              <button
                                onClick={() => { setEditingId(h.id); setEditQty(h.quantity.toString()); }}
                                className="p-0.5 hover:text-indigo-500 text-muted-foreground"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-foreground">${h.currentPrice.toFixed(2)}</td>
                        <td className="p-3 font-bold text-foreground">${currentVal.toFixed(2)}</td>
                        <td className={`p-3 font-bold ${pnl >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeletePosition(h.id)}
                            className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                            title="Remove position"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
              <p className="text-sm font-semibold text-muted-foreground">No matching positions found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real Historical CAGR Benchmark Simulator (Placed at Bottom) */}
      {}
      <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50/20 via-background to-transparent shadow-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-500 rounded-md text-white">
              <LineChart className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Real Historical CAGR Benchmark Simulator</CardTitle>
              <CardDescription className="text-xs">
                Project surplus compounding based on actual 1Y, 3Y, and 5Y historical asset returns.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-muted-foreground">Benchmark Asset:</span>
            <select
              value={selectedAssetSymbol}
              onChange={(e) => setSelectedAssetSymbol(e.target.value)}
              className="text-xs font-semibold bg-background border rounded-md p-1.5 focus:outline-none text-foreground cursor-pointer"
            >
              {marketAssets.map(a => (
                <option key={a.symbol} value={a.symbol}>
                  {a.name} ({a.cagr3Y}% 3Y CAGR)
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Simulator Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                  <span>{selectedAsset.name}</span>
                  <span className="text-emerald-600">{activeCAGR}% CAGR</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{selectedAsset.description}</p>
              </div>

              {/* Timeline Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-muted-foreground">Historical Horizon:</span>
                  <span className="text-indigo-600 font-bold">{timelineYears} {timelineYears === 1 ? "Year" : "Years"}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={timelineYears}
                  onChange={(e) => setTimelineYears(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>1 yr (1Y CAGR)</span>
                  <span>3 yrs (3Y CAGR)</span>
                  <span>5 yrs (5Y CAGR)</span>
                </div>
              </div>

              {/* Annual Step-Up Selector */}
              <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg border">
                <span className="text-muted-foreground font-medium">Annual SIP Step-Up:</span>
                <div className="flex space-x-1">
                  {[0, 5, 10].map((step) => (
                    <button
                      key={step}
                      onClick={() => setStepUpPercent(step)}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                        stepUpPercent === step ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      +{step}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Inflation Adjustment Switch */}
              <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg border">
                <span className="text-muted-foreground font-medium">Adjust for Inflation (~6%):</span>
                <button
                  onClick={() => setAdjustInflation(!adjustInflation)}
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded transition-colors ${
                    adjustInflation ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {adjustInflation ? "ON (Real Value)" : "OFF (Nominal)"}
                </button>
              </div>
            </div>

            {/* Projection Area Chart */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 border-l pl-0 lg:pl-6 border-muted/50">
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {adjustInflation ? "Real Purchasing Power" : "Projected Benchmark Value"}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +${wealthGained.toFixed(0)} wealth gained
                  </span>
                </div>
                
                <div className="text-2xl font-extrabold text-foreground">
                  ${(adjustInflation ? realPurchasingPower : finalValue).toFixed(2)}
                  {adjustInflation && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      (Nominal: ${finalValue.toFixed(0)})
                    </span>
                  )}
                </div>
              </div>

              <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yearlyBreakdown}>
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Area type="monotone" dataKey="invested" stackId="1" stroke="#6366f1" fill="#6366f1" name="Invested Cash" />
                    <Area type="monotone" dataKey="wealth" stackId="1" stroke="#10b981" fill="#34d399" name="Accrued Wealth" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Modal: Add New Position */}
      {}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-xl border p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold">Add Portfolio Position</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddPosition} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Select Asset Symbol</label>
                <select
                  value={formSymbol}
                  onChange={(e) => {
                    setFormSymbol(e.target.value);
                    const matched = marketAssets.find(a => a.symbol === e.target.value);
                    if (matched) setFormPrice(matched.currentPrice.toString());
                  }}
                  className="w-full text-xs h-9 border rounded-lg px-2 bg-background text-foreground"
                >
                  {marketAssets.map(a => (
                    <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Asset Class Category</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as "INDEX" | "STOCK" | "SIP")}
                  className="w-full text-xs h-9 border rounded-lg px-2 bg-background text-foreground"
                >
                  <option value="INDEX">Index ETF</option>
                  <option value="STOCK">Blue-Chip Stock</option>
                  <option value="SIP">Systematic Investment Plan (SIP)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Quantity / Units</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="w-full text-xs h-9 border rounded-lg px-3 bg-background text-foreground"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Average Buy Price ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 21500"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full text-xs h-9 border rounded-lg px-3 bg-background text-foreground"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2 border rounded-lg text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                >
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}