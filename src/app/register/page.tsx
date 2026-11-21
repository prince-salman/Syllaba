"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl bg-white rounded-[28px] border border-[#E5ECE8] shadow-[0_20px_60px_-24px_rgba(13,25,19,0.14)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 bg-emerald-bento text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#52B788]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#1F7A4F]/30 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-sm tracking-tight text-[#DDF1E4]">
                Sy
              </span>
              <span className="text-xl font-bold tracking-tight">Syllaba</span>
            </Link>

            <div className="mt-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-[#DDF1E4]">
                <Sparkles className="w-3.5 h-3.5 text-[#52B788]" />
                Anti-Burnout Study OS
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">
                Build your personalized semester blueprint in seconds.
              </h1>
              <p className="mt-3 text-sm text-[#CBE3D6] leading-relaxed">
                Upload any syllabus PDF or brief. Our multi-agent pipeline maps
                daily tasks, curates references, and verifies completion.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {[
                {
                  title: "Zero Decision Paralysis",
                  desc: "Daily micro-tasks balanced by cognitive load.",
                  badge: "bg-[#DDF1E4] text-[#125B3A]",
                },
                {
                  title: "Open-Access Curation",
                  desc: "Auto-matched papers & reading links per topic.",
                  badge: "bg-[#E9E9FD] text-[#4A4DC7]",
                },
                {
                  title: "Verifiable On-Chain Proofs",
                  desc: "Snapshot milestones to IPFS and Base Sepolia.",
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
                    <p className="text-xs text-[#CBE3D6] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center gap-2 text-xs text-[#CBE3D6]">
            <BookOpen className="w-4 h-4 text-[#52B788] shrink-0" />
            <span>Free for students &amp; academic teams</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111815] tracking-tight">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-[#6B7872]">
              Start organizing courses with calmer focus and verifiable progress.
            </p>

            {errorMsg && (
              <div className="mt-5 rounded-xl bg-[#F4E0E6]/70 border border-[#D9386A]/25 px-4 py-3 text-sm text-[#9B1C44]">
                {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div className="mt-5 rounded-xl bg-[#DDF1E4] border border-[#52B788]/40 px-4 py-3 text-sm text-[#125B3A]">
                {infoMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B7872] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6B7872] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Immanuel Elvando"
                    className="w-full rounded-xl border border-[#E5ECE8] bg-[#F4F7F5]/60 pl-10 pr-4 py-3 text-sm text-[#111815] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#125B3A]/20 focus:border-[#125B3A] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B7872] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7872] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full rounded-xl border border-[#E5ECE8] bg-[#F4F7F5]/60 pl-10 pr-4 py-3 text-sm text-[#111815] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#125B3A]/20 focus:border-[#125B3A] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B7872] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7872] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-[#E5ECE8] bg-[#F4F7F5]/60 pl-10 pr-11 py-3 text-sm text-[#111815] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#125B3A]/20 focus:border-[#125B3A] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7872] hover:text-[#111815] p-1"
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
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B7872] mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7872] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-[#E5ECE8] bg-[#F4F7F5]/60 pl-10 pr-4 py-3 text-sm text-[#111815] placeholder:text-[#96A39C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#125B3A]/20 focus:border-[#125B3A] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-[#125B3A] hover:bg-[#1F7A4F] disabled:opacity-60 text-white font-semibold py-3.5 px-5 text-sm shadow-sm flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-sm text-[#6B7872]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#125B3A] hover:text-[#1F7A4F] underline-offset-4 hover:underline"
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
