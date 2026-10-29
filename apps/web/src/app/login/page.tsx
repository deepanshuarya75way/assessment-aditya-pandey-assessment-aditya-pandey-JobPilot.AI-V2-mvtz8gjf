"use client";
// ADDED useEffect to the import
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // NEW: Instantly redirect if they are already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    if (!email || !password) return;

    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.access_token);
      
      // FIX: Use replace instead of push so the back button doesn't trap them
      router.replace("/"); 
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-3xl shadow-2xl max-w-md w-full transform hover:scale-[1.01] transition-all duration-500">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight">JobPilot<span className="text-indigo-400">.AI</span></h1>
          <p className="text-indigo-200 mt-2 font-medium">Welcome back, future builder.</p>
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl mb-6 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-indigo-100 text-sm font-bold mb-2">Email Address</label>
            <input 
              name="email" type="email" placeholder="you@example.com" required 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-indigo-100 text-sm font-bold mb-2">Password</label>
            <input 
              name="password" type="password" placeholder="••••••••" required 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>
          
          <button 
            type="submit" disabled={isLoading} 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl font-black tracking-wide shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
        
        <p className="mt-8 text-center text-indigo-200 font-medium">
          Don't have an account? <Link href="/register" className="text-white font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}