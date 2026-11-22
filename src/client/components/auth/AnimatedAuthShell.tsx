"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useLanguage } from "@/client/context/LanguageContext";

type AuthMode = "login" | "register";

interface AnimatedAuthShellProps {
  initialMode: AuthMode;
}

export function AnimatedAuthShell({ initialMode }: AnimatedAuthShellProps) {
  const router = useRouter();
  const { isConnected, isConnecting, openConnectModal } = useWeb3();
  const { user } = useAuth();
  const { copy } = useLanguage();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [entered, setEntered] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const isRegister = mode === "register";

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (isConnected || user) {
      router.replace("/");
    }
  }, [isConnected, user, router]);

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setMode(nextMode);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        nextMode === "register" ? "/register" : "/login"
      );
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        "Supabase belum terkonfigurasi. Cek NEXT_PUBLIC_SUPABASE_URL di .env.local."
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (regPassword.length < 6) {
      setErrorMsg("Password minimal harus 6 karakter.");
      return;
    }

    if (regPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        "Supabase belum terkonfigurasi. Cek NEXT_PUBLIC_SUPABASE_URL di .env.local."
      );
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setInfoMsg(
        "Akun berhasil dibuat! Jika konfirmasi email aktif, cek inbox kamu lalu masuk lewat tab Login."
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat membuat akun."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderLoginHero = (showMobileFooterToggle = false) => (
    <div className="h-full p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#F5B700]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#262626]/30 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-sm tracking-tight text-[#FEF3C7]">
            Sy
          </span>
          <span className="text-xl font-bold tracking-tight">Syllaba</span>
        </Link>

        <div className="mt-9">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-[#FEF3C7]">
            <Sparkles className="w-3.5 h-3.5 text-[#F5B700]" />
            AI Study Planner
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">
            Turn dense syllabi into calm daily momentum.
          </h1>
          <p className="mt-3 text-sm text-[#E5E5E0] leading-relaxed">
            Sign in with your email or connect your e-wallet to sync your study
            plans, reading links, and progress proofs.
          </p>
        </div>

        <div className="mt-7 space-y-3">
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

      <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center justify-between gap-3 text-xs text-[#E5E5E0]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#F5B700] shrink-0" />
          <span>Flexible login with Email or Web3 E-Wallet</span>
        </div>
        {!showMobileFooterToggle && (
          <button
            type="button"
            onClick={() => switchMode("register")}
            className="shrink-0 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-[#FEF3C7] transition cursor-pointer"
          >
            Sign Up →
          </button>
        )}
      </div>
    </div>
  );

  const renderRegisterHero = (showMobileFooterToggle = false) => (
    <div className="h-full p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#F5B700]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#262626]/30 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-sm tracking-tight text-[#FEF3C7]">
            Sy
          </span>
          <span className="text-xl font-bold tracking-tight">Syllaba</span>
        </Link>

        <div className="mt-9">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-[#FEF3C7]">
            <Sparkles className="w-3.5 h-3.5 text-[#F5B700]" />
            Anti-Burnout Study OS
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">
            Build your personalized semester blueprint in seconds.
          </h1>
          <p className="mt-3 text-sm text-[#E5E5E0] leading-relaxed">
            Upload any PDF, Word doc, or slide deck to generate daily study
            steps with curated references and progress tracking.
          </p>
        </div>

        <div className="mt-7 space-y-3">
          {[
            {
              title: "Zero Decision Paralysis",
              desc: "Bite-sized 15–30 minute daily tasks with rest days.",
              badge: "bg-[#FEF3C7] text-[#111111]",
            },
            {
              title: "Instant Reading Links",
              desc: "Free open-access articles matched to each topic.",
              badge: "bg-[#E9E9FD] text-[#4A4DC7]",
            },
            {
              title: "Email or E-Wallet Ready",
              desc: "Sync plans with your preferred account method.",
              badge: "bg-[#F6EDCA] text-[#8B6B15]",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-3.5 flex items-start gap-3"
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.badge}`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-[#E5E5E0] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center justify-between gap-3 text-xs text-[#E5E5E0]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#F5B700] shrink-0" />
          <span>Free for students &amp; academic teams</span>
        </div>
        {!showMobileFooterToggle && (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="shrink-0 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-[#FEF3C7] transition cursor-pointer"
          >
            ← Sign In
          </button>
        )}
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="max-w-md w-full mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
        Welcome back
      </h2>
      <p className="mt-2 text-sm text-[#666660]">
        Choose how you want to enter your Syllaba workspace.
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={openConnectModal}
          disabled={isConnecting || loading}
          className="w-full rounded-xl bg-[#0A0A0A] hover:bg-[#192D23] disabled:opacity-60 text-white font-semibold py-3.5 px-5 text-sm shadow-sm flex items-center justify-center gap-2.5 transition cursor-pointer"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#F5B700]" />
              {copy.connectWallet}...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 text-[#F5B700]" />
              {copy.connectWallet}
            </>
          )}
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E5E5E0]" />
        <span className="text-xs font-medium text-[#666660]">
          or sign in with email
        </span>
        <div className="h-px flex-1 bg-[#E5E5E0]" />
      </div>

      {errorMsg && !isRegister && (
        <div className="mb-5 rounded-xl bg-[#F4E0E6]/70 border border-[#D9386A]/25 px-4 py-3 text-sm text-[#9B1C44]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
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
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@gmail.com"
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
              type={showLoginPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-[#E5E5E0] bg-[#F7F7F5]/60 pl-10 pr-11 py-3 text-sm text-[#111111] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition"
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666660] hover:text-[#111111] p-1 cursor-pointer"
              aria-label={showLoginPassword ? "Hide password" : "Show password"}
            >
              {showLoginPassword ? (
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
          className="w-full rounded-xl bg-[#111111] hover:bg-[#262626] disabled:opacity-60 text-white font-semibold py-3.5 px-5 text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in with Email
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-sm text-[#666660]">
        New to Syllaba?{" "}
        <button
          type="button"
          onClick={() => switchMode("register")}
          className="font-semibold text-[#111111] hover:text-[#262626] underline-offset-4 hover:underline cursor-pointer"
        >
          Create an account
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-[#E5E5E0] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#666660]">
          <CheckCircle2 className="w-4 h-4 text-[#F5B700]" />
          <span>Just exploring?</span>
        </div>
        <Link
          href="/"
          className="text-xs font-semibold text-[#111111] hover:text-[#111111] px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E0] transition"
        >
          Continue as Guest →
        </Link>
      </div>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="max-w-md w-full mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
        Create your account
      </h2>
      <p className="mt-2 text-sm text-[#666660]">
        Start instantly with your e-wallet, or register with email.
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={openConnectModal}
          disabled={isConnecting || loading}
          className="w-full rounded-xl bg-[#0A0A0A] hover:bg-[#192D23] disabled:opacity-60 text-white font-semibold py-3.5 px-5 text-sm shadow-sm flex items-center justify-center gap-2.5 transition cursor-pointer"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#F5B700]" />
              {copy.connectWallet}...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 text-[#F5B700]" />
              {copy.connectWallet}
            </>
          )}
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E5E5E0]" />
        <span className="text-xs font-medium text-[#666660]">
          or sign up with email
        </span>
        <div className="h-px flex-1 bg-[#E5E5E0]" />
      </div>

      {errorMsg && isRegister && (
        <div className="mb-4 rounded-xl bg-[#F4E0E6]/70 border border-[#D9386A]/25 px-4 py-3 text-sm text-[#9B1C44]">
          {errorMsg}
        </div>
      )}

      {infoMsg && isRegister && (
        <div className="mb-4 rounded-xl bg-[#FEF3C7] border border-[#F5B700]/40 px-4 py-3 text-sm text-[#111111]">
          {infoMsg}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-3.5">
        <div>
          <label
            htmlFor="reg-name"
            className="block text-xs font-semibold uppercase tracking-wider text-[#666660] mb-1.5"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#666660] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="reg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-[#E5E5E0] bg-[#F7F7F5]/60 pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-xs font-semibold uppercase tracking-wider text-[#666660] mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#666660] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full rounded-xl border border-[#E5E5E0] bg-[#F7F7F5]/60 pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="block text-xs font-semibold uppercase tracking-wider text-[#666660] mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#666660] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="reg-password"
              type={showRegPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-[#E5E5E0] bg-[#F7F7F5]/60 pl-10 pr-11 py-3 text-sm text-[#111111] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition"
            />
            <button
              type="button"
              onClick={() => setShowRegPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666660] hover:text-[#111111] p-1 cursor-pointer"
              aria-label={showRegPassword ? "Hide password" : "Show password"}
            >
              {showRegPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-confirm"
            className="block text-xs font-semibold uppercase tracking-wider text-[#666660] mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#666660] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="reg-confirm"
              type={showRegPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-xl border border-[#E5E5E0] bg-[#F7F7F5]/60 pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-1 rounded-xl bg-[#111111] hover:bg-[#262626] disabled:opacity-60 text-white font-semibold py-3.5 px-5 text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account with Email
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 text-sm text-[#666660]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="font-semibold text-[#111111] hover:text-[#262626] underline-offset-4 hover:underline cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div
        className={`w-full max-w-5xl bg-white rounded-[28px] border border-[#E5E5E0] shadow-[0_20px_60px_-24px_rgba(13,25,19,0.14)] overflow-hidden transition-all duration-500 ease-out ${
          entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Desktop Split Sliding Curtain Card (matches reference sliding animation, zero UI/UX changes) */}
        <div className="hidden lg:grid lg:grid-cols-2 relative min-h-[670px]">
          {/* Left Form Slot: Sign Up */}
          <div
            aria-hidden={!isRegister}
            className={`p-10 xl:p-12 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              isRegister
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 translate-x-10 pointer-events-none"
            }`}
          >
            {renderRegisterForm()}
          </div>

          {/* Right Form Slot: Sign In */}
          <div
            aria-hidden={isRegister}
            className={`p-10 xl:p-12 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              !isRegister
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 -translate-x-10 pointer-events-none"
            }`}
          >
            {renderLoginForm()}
          </div>

          {/* Sliding Emerald Overlay Panel */}
          <div
            className={`absolute inset-y-0 left-0 w-1/2 z-20 bg-emerald-bento text-white overflow-hidden shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] will-change-transform ${
              isRegister ? "translate-x-full" : "translate-x-0"
            }`}
          >
            <div
              className={`w-[200%] h-full flex transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] will-change-transform ${
                isRegister ? "-translate-x-1/2" : "translate-x-0"
              }`}
            >
              <div className="w-1/2 h-full shrink-0">{renderLoginHero(false)}</div>
              <div className="w-1/2 h-full shrink-0">{renderRegisterHero(false)}</div>
            </div>
          </div>
        </div>

        {/* Mobile Stacked View with smooth crossfade */}
        <div className="lg:hidden grid grid-cols-1">
          <div className="bg-emerald-bento text-white transition-all duration-500">
            {isRegister ? renderRegisterHero(true) : renderLoginHero(true)}
          </div>
          <div className="p-8 sm:p-10 transition-all duration-500">
            {isRegister ? renderRegisterForm() : renderLoginForm()}
          </div>
        </div>
      </div>
    </div>
  );
}
