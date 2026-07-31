import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  TrendingUp, 
  Wallet, 
  LogOut, 
  ChevronDown, 
  Shield, 
  User, 
  Sparkles 
} from "lucide-react";
import { toast } from "sonner";

export default function Header() {
  const auth = useAuth() as any;
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const username =
    auth?.user?.username ||
    auth?.username ||
    localStorage.getItem("spend_app_user") ||
    "User";

  const isAuthenticated =
    auth?.isAuthenticated ??
    Boolean(auth?.token || localStorage.getItem("spend_app_token"));

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Expenses", path: "/expenses", icon: Receipt },
    { label: "Budget", path: "/budget", icon: PiggyBank },
    { label: "Investments", path: "/investments", icon: TrendingUp },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    if (typeof auth?.logout === "function") {
      auth.logout();
    } else {
      localStorage.removeItem("spend_app_token");
      localStorage.removeItem("spend_app_user");
    }
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        
        {/* Brand & Navigation Group */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Simple<span className="text-primary">Spend</span>
            </span>
          </div>

          {/* Navigation Links inside Header */}
          {isAuthenticated && (
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* User Session & Profile Dropdown */}
        {isAuthenticated ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-full border bg-background p-1 pr-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block max-w-[120px] truncate text-foreground font-semibold">
                {username}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center gap-3 px-2 py-2 border-b border-border/50 mb-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-sm">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-foreground truncate">
                      {username}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Shield className="h-2.5 w-2.5 text-emerald-500" /> Active Session
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 text-xs font-medium">
                  <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-default transition-colors">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>AI Assistant Active</span>
                  </div>
                </div>

                <div className="my-1 border-t border-border/50" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <User className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}