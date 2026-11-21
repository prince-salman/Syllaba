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
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useLanguage } from "@/client/context/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { isConnected, isConnecting, openConnectModal } = useWeb3();
  const { user } = useAuth();
  const { copy } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected || user) {
      router.replace("/");
    }
  }, [isConnected, user, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
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
        email: email.trim(),
        password,
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
        "Akun berhasil dibuat! Jika konfirmasi email aktif, cek inbox kamu lalu masuk lewat halaman Login."
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

            <div className="mt-8 space-y-3">
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
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#E5E5E0] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center gap-2 text-xs text-[#E5E5E0]">
            <BookOpen className="w-4 h-4 text-[#F5B700] shrink-0" />
            <span>Free for students &amp; academic teams</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-[#666660]">
              Start instantly with your e-wallet, or register with email.
            </p>

            {/* E-Wallet Registration Option */}
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

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-[#F4E0E6]/70 border border-[#D9386A]/25 px-4 py-3 text-sm text-[#9B1C44]">
                {errorMsg}
              </div>
            )}

            {infoMsg && (
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-[#E5E5E0] bg-[#F7F7F5]/60 pl-10 pr-11 py-3 text-sm text-[#111111] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666660] hover:text-[#111111] p-1 cursor-pointer"
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
                    type={showPassword ? "text" : "password"}
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
              <Link
                href="/login"
                className="font-semibold text-[#111111] hover:text-[#262626] underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
