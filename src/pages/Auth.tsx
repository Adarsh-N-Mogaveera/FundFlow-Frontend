import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Format maps to backend AuthResponse payload contract
        login({ token: data.token, user: { id: data.userId, username: data.username } });
        toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
        navigate("/");
      } else {
        toast.error(data || "Authentication failed. Try again.");
      }
    } catch (err) {
      toast.error("Network connection error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{isLogin ? "Sign In" : "Register Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Enter your credentials to access your tracking database" : "Create a username and safe key code"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {isLoading ? "Validating data..." : isLogin ? "Sign In" : "Get Started"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            {isLogin ? "New user here?" : "Already registered?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-primary underline decoration-dotted underline-offset-2 ml-0.5"
            >
              {isLogin ? "Create an account" : "Log in to your profile"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}