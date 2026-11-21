"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        "Supabase belum terkonfigurasi. Cek NEXT_PUBLIC_SUPABASE_URL di .env.local."
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan saat masuk."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl bg-white rounded-[28px] border border-[#E5E5E0] shadow-[0_20px_60px_-24px_rgba(13,25,19,0.14)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 bg-emerald-bento text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#F5B700]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#262626]/30 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-sm tracking-tight text-[#FEF3C7]">
                Sy
              </span>
              <span className="text-xl font-bold tracking-tight">Syllaba</span>
            </Link>

            <div className="mt-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-[#FEF3C7]">
                <Sparkles className="w-3.5 h-3.5 text-[#F5B700]" />
                Multi-Agent Academic Pacing
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">
                Turn dense syllabi into calm daily momentum.
              </h1>
              <p className="mt-3 text-sm text-[#E5E5E0] leading-relaxed">
                Decompose semester workloads with 5 autonomous agents, curate
                open-access papers, and anchor study milestones on-chain.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
                <div className="flex items-center justify-between text-xs text-[#E5E5E0]">
                  <span>Today&apos;s Pacing Efficiency</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#111111] font-semibold">
                    93% On Track
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#FEF3C7] text-[#111111] p-2.5">
                    <p className="text-[10px] font-medium text-[#111111]">
                      Completed
                    </p>
                    <p className="text-base font-bold mt-0.5">18</p>
                  </div>
                  <div className="rounded-xl bg-[#E9E9FD] text-[#111111] p-2.5">
                    <p className="text-[10px] font-medium text-[#4A4DC7]">
                      In Progress
                    </p>
                    <p className="text-base font-bold mt-0.5">4</p>
                  </div>
                  <div className="rounded-xl bg-[#F6EDCA] text-[#111111] p-2.5">
                    <p className="text-[10px] font-medium text-[#8B6B15]">
                      Proofs
                    </p>
                    <p className="text-base font-bold mt-0.5">6</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center gap-2 text-xs text-[#E5E5E0]">
            <ShieldCheck className="w-4 h-4 text-[#F5B700] shrink-0" />
            <span>Synced with Supabase &amp; Base Sepolia Proof Vault</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-[#666660]">
              Sign in to access your AI study roadmaps, curated papers, and
              on-chain proofs.
            </p>

            {errorMsg && (
              <div className="mt-5 rounded-xl bg-[#F4E0E6]/70 border border-[#D9386A]/25 px-4 py-3 text-sm text-[#9B1C44]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#666660] mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666660] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full rounded-xl border border-[#E5E5E0] bg-[#F7F7F5]/60 pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#666660] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#666660] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#E5E5E0] bg-[#F7F7F5]/60 pl-10 pr-11 py-3 text-sm text-[#111111] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666660] hover:text-[#111111] p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#111111] hover:bg-[#262626] disabled:opacity-60 text-white font-semibold py-3.5 px-5 text-sm shadow-sm flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to Workspace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-sm text-[#666660]">
              New to Syllaba?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#111111] hover:text-[#262626] underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E5E0] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#666660]">
                <CheckCircle2 className="w-4 h-4 text-[#F5B700]" />
                <span>Exploring for demo?</span>
              </div>
              <Link
                href="/"
                className="text-xs font-semibold text-[#111111] hover:text-[#111111] px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E0] transition"
              >
                Continue to Workspace →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
