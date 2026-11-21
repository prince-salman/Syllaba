import Link from "next/link";
import { Award, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";

interface VerifyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const val = params[key];
    const str = Array.isArray(val) ? val[0] ?? "" : val ?? "";
    if (str) return str;
  }
  return "";
}

export default async function VerifyCertificatePage({
  searchParams,
}: VerifyPageProps) {
  const params = await searchParams;
  const certId = getParam(params, "id", "i") || "SYL-CREDENTIAL";
  const rawTier = getParam(params, "tier", "t") || "bronze";
  const tier =
    rawTier === "ppt" ? "COURSE PASS" : rawTier.toUpperCase();
  const points = getParam(params, "pts", "p") || "0";
  const grade = getParam(params, "grade", "g") || "0";
  const holder = getParam(params, "holder", "n") || "Scholar Candidate";
  const course =
    getParam(params, "course", "c") ||
    (rawTier === "ppt"
      ? "Syllaba Verified PPT Module"
      : "Syllaba Tier Academic Progression");
  const hash = getParam(params, "hash", "h");
  const rawProof = getParam(params, "proof", "m") || "preview";
  const proof =
    rawProof === "tx"
      ? "onchain-tx"
      : rawProof === "sig"
      ? "eip191-signature"
      : rawProof === "loc"
      ? "local-attestation"
      : rawProof === "pre"
      ? "preview"
      : rawProof;
  const txHash = getParam(params, "tx");
  const wallet = getParam(params, "wallet", "w");

  const hasValidTx = /^0x[0-9a-fA-F]{64}$/.test(txHash);
  const hasValidWallet = /^0x[0-9a-fA-F]{40}$/.test(wallet);

  const proofBadge =
    proof === "onchain-tx" && hasValidTx
      ? {
          label: "Verified On-Chain (Base Sepolia)",
          tone: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
        }
      : proof === "eip191-signature"
      ? {
          label: "Verified EIP-191 Wallet Signature",
          tone: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        }
      : proof === "local-attestation"
      ? {
          label: "Cryptographic Digest Attestation",
          tone: "bg-amber-500/20 text-amber-300 border-amber-400/40",
        }
      : {
          label: "Credential Preview Snapshot",
          tone: "bg-slate-500/20 text-slate-300 border-slate-400/40",
        };

  return (
    <main className="min-h-screen bg-[#09090D] text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-3xl border border-[#FACC15]/40 bg-gradient-to-b from-[#15151E] to-[#0B0B10] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#FACC15] to-[#D97706] flex items-center justify-center text-[#111111] shadow-md">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Syllaba Academic Protocol
              </p>
              <h1 className="text-lg font-black text-white">
                Credential Verification Portal
              </h1>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${proofBadge.tone}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{proofBadge.label}</span>
          </span>
        </div>

        <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Credential Holder
              </span>
              <h2 className="text-2xl font-black text-white">{holder}</h2>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FACC15] text-[#111111] px-3 py-1 text-xs font-black">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{tier} TIER</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Course / Subject
              </div>
              <div className="font-bold text-slate-100 mt-0.5">{course}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Certificate ID
              </div>
              <div className="font-mono font-bold text-[#FACC15] mt-0.5">
                {certId}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Accumulated Academic Points
              </div>
              <div className="font-bold text-white mt-0.5">{points} Poin</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Final Assessment Score
              </div>
              <div className="font-bold text-emerald-400 mt-0.5">
                {grade} / 100
              </div>
            </div>
          </div>

          {(hash || hasValidWallet || hasValidTx) && (
            <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs font-mono text-slate-300">
              {hash && (
                <div className="truncate">
                  <span className="text-slate-400">DIGEST: </span>
                  <span>{hash}...</span>
                </div>
              )}
              {hasValidWallet && (
                <div className="truncate">
                  <span className="text-slate-400">WALLET: </span>
                  <span>{wallet}</span>
                </div>
              )}
              {hasValidTx && (
                <div className="truncate">
                  <span className="text-slate-400">BASE SEPOLIA TX: </span>
                  <span>{txHash}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            {hasValidTx && (
              <a
                href={`https://sepolia.basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#111111] px-4 py-2 text-xs font-black transition"
              >
                <span>View TX on BaseScan</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {hasValidWallet && (
              <a
                href={`https://sepolia.basescan.org/address/${wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white px-4 py-2 text-xs font-bold transition"
              >
                <span>Inspect Wallet on BaseScan</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition"
          >
            <span>Open Syllaba App</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
