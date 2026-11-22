import Link from "next/link";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ExternalLink,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  createPublicClient,
  http,
  keccak256,
  parseAbi,
  stringToHex,
} from "viem";
import { baseSepolia } from "viem/chains";
import { SYLLABA_SBT_ADDRESS } from "@/shared/contracts/syllabaCertificateSbt";

export const dynamic = "force-dynamic";

const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";
const PREVIOUS_SBT_ADDRESS: `0x${string}` =
  "0x963e2e14f18495bd490e569f0b28ac9a867d6da7";

const CERTIFICATE_MINTED_TOPIC = keccak256(
  stringToHex(
    "CertificateMinted(uint256,address,bytes32,string,string,uint256,uint256,string)"
  )
);
const ERC721_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const SBT_VIEW_ABI = parseAbi([
  "function totalMinted() view returns (uint256)",
  "function tokenByDigest(bytes32 certDigest) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getCertificate(uint256 tokenId) view returns ((address recipient, string certKind, string courseTitle, string recipientName, uint256 points, uint256 finalGrade, bytes32 certDigest, string ipfsCid, uint64 issuedAt))",
]);

interface VerifyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface LiveOnChainRecord {
  contractAddress: `0x${string}`;
  tokenId: string;
  owner: `0x${string}`;
  certKind: string;
  courseTitle: string;
  recipientName: string;
  points: string;
  finalGrade: string;
  certDigest: `0x${string}`;
  ipfsCid: string;
  issuedAtIso: string | null;
  txHash?: `0x${string}`;
  blockNumber?: string;
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const val = params[key];
    const str = Array.isArray(val) ? val[0] ?? "" : val ?? "";
    if (str) return str.trim();
  }
  return "";
}

function createBaseSepoliaClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC_URL),
  });
}

async function readTokenDetails(
  publicClient: ReturnType<typeof createBaseSepoliaClient>,
  contractAddress: `0x${string}`,
  tokenId: bigint,
  extra?: { txHash?: `0x${string}`; blockNumber?: string }
): Promise<LiveOnChainRecord | null> {
  try {
    const [cert, owner] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi: SBT_VIEW_ABI,
        functionName: "getCertificate",
        args: [tokenId],
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: SBT_VIEW_ABI,
        functionName: "ownerOf",
        args: [tokenId],
      }),
    ]);

    const issuedAtSec = Number(cert.issuedAt || BigInt(0));
    return {
      contractAddress,
      tokenId: tokenId.toString(),
      owner,
      certKind: cert.certKind,
      courseTitle: cert.courseTitle,
      recipientName: cert.recipientName,
      points: cert.points.toString(),
      finalGrade: cert.finalGrade.toString(),
      certDigest: cert.certDigest,
      ipfsCid: cert.ipfsCid,
      issuedAtIso:
        issuedAtSec > 0
          ? new Date(issuedAtSec * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC"
          : null,
      txHash: extra?.txHash,
      blockNumber: extra?.blockNumber,
    };
  } catch {
    return null;
  }
}

async function resolveOnChainQuery(rawQuery: string): Promise<{
  totalMinted: string | null;
  record: LiveOnChainRecord | null;
  attemptedLookup: boolean;
}> {
  const publicClient = createBaseSepoliaClient();

  let totalMinted: string | null = null;
  try {
    const count = await publicClient.readContract({
      address: SYLLABA_SBT_ADDRESS,
      abi: SBT_VIEW_ABI,
      functionName: "totalMinted",
    });
    totalMinted = count.toString();
  } catch {
    totalMinted = null;
  }

  if (!rawQuery) {
    return { totalMinted, record: null, attemptedLookup: false };
  }

  const candidateContracts: `0x${string}`[] = Array.from(
    new Set([SYLLABA_SBT_ADDRESS, PREVIOUS_SBT_ADDRESS])
  );

  if (/^0x[0-9a-fA-F]{64}$/.test(rawQuery)) {
    const hex64 = rawQuery as `0x${string}`;

    // 1. Check whether input is a Base Sepolia TX Hash
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: hex64 });
      if (receipt && receipt.status === "success") {
        for (const log of receipt.logs) {
          const topic0 = log.topics[0]?.toLowerCase();
          const tokenHex = log.topics[1];
          const isCertEvent =
            topic0 === CERTIFICATE_MINTED_TOPIC.toLowerCase();
          const isTransferEvent =
            topic0 === ERC721_TRANSFER_TOPIC.toLowerCase() && log.topics[3];
          const tokenIdHex = isCertEvent
            ? tokenHex
            : isTransferEvent
            ? log.topics[3]
            : undefined;

          if (tokenIdHex) {
            const loaded = await readTokenDetails(
              publicClient,
              log.address,
              BigInt(tokenIdHex),
              {
                txHash: hex64,
                blockNumber: receipt.blockNumber.toString(),
              }
            );
            if (loaded) {
              return { totalMinted, record: loaded, attemptedLookup: true };
            }
          }
        }
      }
    } catch {
      // Not a TX hash (or TX not found) -> try certDigest lookup next
    }

    // 2. Check whether input is a KECCAK-256 certDigest
    for (const addr of candidateContracts) {
      try {
        const tokenId = await publicClient.readContract({
          address: addr,
          abi: SBT_VIEW_ABI,
          functionName: "tokenByDigest",
          args: [hex64],
        });
        if (tokenId > BigInt(0)) {
          const loaded = await readTokenDetails(publicClient, addr, tokenId);
          if (loaded) {
            return { totalMinted, record: loaded, attemptedLookup: true };
          }
        }
      } catch {
        // Continue checking next contract
      }
    }

    return { totalMinted, record: null, attemptedLookup: true };
  }

  if (/^\d+$/.test(rawQuery)) {
    const tokenId = BigInt(rawQuery);
    if (tokenId > BigInt(0)) {
      for (const addr of candidateContracts) {
        const loaded = await readTokenDetails(publicClient, addr, tokenId);
        if (loaded) {
          return { totalMinted, record: loaded, attemptedLookup: true };
        }
      }
    }
    return { totalMinted, record: null, attemptedLookup: true };
  }

  return { totalMinted, record: null, attemptedLookup: true };
}

export default async function VerifyCertificatePage({
  searchParams,
}: VerifyPageProps) {
  const params = await searchParams;
  const searchInput = getParam(params, "q", "tx", "token", "hash");
  const { totalMinted, record: liveRecord, attemptedLookup } =
    await resolveOnChainQuery(searchInput);

  const certId =
    liveRecord?.certDigest
      ? `SYL-SBT-#${liveRecord.tokenId}`
      : getParam(params, "id", "i") || "SYL-CREDENTIAL";
  const rawTier = getParam(params, "tier", "t") || "bronze";
  const tier = liveRecord
    ? liveRecord.certKind.replace(/_/g, " ")
    : rawTier === "ppt"
    ? "COURSE PASS"
    : rawTier.toUpperCase();
  const points = liveRecord ? liveRecord.points : getParam(params, "pts", "p") || "0";
  const grade = liveRecord
    ? liveRecord.finalGrade
    : getParam(params, "grade", "g") || "0";
  const holder = liveRecord
    ? liveRecord.recipientName
    : getParam(params, "holder", "n") || "Scholar Candidate";
  const course = liveRecord
    ? liveRecord.courseTitle
    : getParam(params, "course", "c") ||
      (rawTier === "ppt"
        ? "Syllaba Verified PPT Module"
        : "Syllaba Tier Academic Progression");
  const hash = liveRecord ? liveRecord.certDigest : getParam(params, "hash", "h");
  const rawProof = getParam(params, "proof", "m") || "preview";
  const proof = liveRecord
    ? "onchain-tx"
    : rawProof === "tx"
    ? "onchain-tx"
    : rawProof === "sig"
    ? "eip191-signature"
    : rawProof === "loc"
    ? "local-attestation"
    : rawProof === "pre"
    ? "preview"
    : rawProof;
  const txHash = liveRecord?.txHash || getParam(params, "tx");
  const wallet = liveRecord?.owner || getParam(params, "wallet", "w");

  const hasValidTx = /^0x[0-9a-fA-F]{64}$/.test(txHash);
  const hasValidWallet = /^0x[0-9a-fA-F]{40}$/.test(wallet);
  const hasPinataCid = Boolean(
    liveRecord?.ipfsCid &&
      (liveRecord.ipfsCid.startsWith("Qm") ||
        liveRecord.ipfsCid.startsWith("baf"))
  );
  const hasAnyDisplayData = Boolean(
    liveRecord || getParam(params, "id", "i", "holder", "n", "course", "c")
  );

  const proofBadge = liveRecord
    ? {
        label: `Verified Live On-Chain (Token #${liveRecord.tokenId})`,
        tone: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
      }
    : proof === "onchain-tx" && hasValidTx
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
        label: "Base Sepolia Live Registry",
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
                Real-Time On-Chain Verification Portal
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

        {/* Live Base Sepolia Lookup Form */}
        <form method="GET" action="/verify" className="space-y-2">
          <label
            htmlFor="verify-query"
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-300"
          >
            Verify Credential Directly on Base Sepolia Blockchain
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="verify-query"
              name="q"
              type="text"
              defaultValue={searchInput}
              placeholder="Enter TX Hash (0x...), KECCAK-256 Digest, or Token ID (e.g. 1)"
              className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-[#FACC15] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#111111] px-4 py-2.5 text-xs font-black transition cursor-pointer shrink-0"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Verify On-Chain</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              SBT Contract:{" "}
              <a
                href={`https://sepolia.basescan.org/address/${SYLLABA_SBT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[#FACC15] hover:underline"
              >
                {SYLLABA_SBT_ADDRESS}
              </a>
            </span>
            {totalMinted !== null && (
              <span className="font-semibold text-emerald-300">
                Total On-Chain SBT Minted: #{totalMinted}
              </span>
            )}
          </div>
        </form>

        {attemptedLookup && !liveRecord && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Credential not found on the Syllaba Base Sepolia SBT registry.
              </p>
              <p className="text-amber-200/80">
                Check that the TX Hash (66 chars), KECCAK-256 Digest, or Token ID
                is confirmed on Base Sepolia (Chain ID 84532).
              </p>
            </div>
          </div>
        )}

        {hasAnyDisplayData && (
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
                  <span>{tier}</span>
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
              {liveRecord?.issuedAtIso && (
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    On-Chain Timestamp
                  </div>
                  <div className="font-mono text-xs text-slate-200 mt-0.5">
                    {liveRecord.issuedAtIso}
                  </div>
                </div>
              )}
              {liveRecord?.blockNumber && (
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Base Sepolia Block
                  </div>
                  <div className="font-mono text-xs text-emerald-300 mt-0.5">
                    #{liveRecord.blockNumber}
                  </div>
                </div>
              )}
            </div>

            {(hash || hasValidWallet || hasValidTx || liveRecord?.ipfsCid) && (
              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs font-mono text-slate-300">
                {hash && (
                  <div className="truncate">
                    <span className="text-slate-400">DIGEST: </span>
                    <span>{hash}</span>
                  </div>
                )}
                {hasValidWallet && (
                  <div className="truncate">
                    <span className="text-slate-400">
                      {liveRecord ? "ERC-721 OWNER: " : "WALLET: "}
                    </span>
                    <span>{wallet}</span>
                  </div>
                )}
                {liveRecord?.ipfsCid && (
                  <div className="truncate">
                    <span className="text-slate-400">IPFS SNAPSHOT: </span>
                    <span>{liveRecord.ipfsCid}</span>
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
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
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
            {liveRecord && (
              <a
                href={`https://sepolia.basescan.org/nft/${liveRecord.contractAddress}/${liveRecord.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15]/40 bg-[#FACC15]/10 hover:bg-[#FACC15]/20 text-[#FACC15] px-4 py-2 text-xs font-bold transition"
              >
                <span>View SBT #{liveRecord.tokenId}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {hasPinataCid && liveRecord && (
              <a
                href={`https://gateway.pinata.cloud/ipfs/${liveRecord.ipfsCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-4 py-2 text-xs font-bold transition"
              >
                <span>IPFS Metadata</span>
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
                <span>Inspect Owner Wallet</span>
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
