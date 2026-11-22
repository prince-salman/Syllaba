import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  keccak256,
  parseAbi,
  stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { SYLLABA_SBT_ADDRESS } from "@/shared/contracts/syllabaCertificateSbt";

const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";
const LEGACY_PROOF_CONTRACT: `0x${string}` =
  "0xe55a108Ba1E3EE56d64d55F96C7144302400f808";

const SBT_RELAY_ABI = parseAbi([
  "function tokenByDigest(bytes32 certDigest) view returns (uint256)",
  "function mintCertificate(bytes32 certDigest, string certKind, string courseTitle, string recipientName, uint256 points, uint256 finalGrade, string ipfsCid) returns (uint256)",
  "function mintCertificateFor(address recipient, bytes32 certDigest, string certKind, string courseTitle, string recipientName, uint256 points, uint256 finalGrade, string ipfsCid) returns (uint256)",
]);

const LEGACY_PROOF_ABI = parseAbi([
  "function issueCertificate(address recipient, bytes32 certHash) external",
]);

function normalizeHexKey(rawKey: string): `0x${string}` {
  const trimmed = rawKey.trim();
  return (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as `0x${string}`;
}

function resolveBytes32Digest(
  rawHash: unknown,
  fallbackSeed: string
): `0x${string}` {
  if (typeof rawHash === "string" && /^0x[0-9a-fA-F]{64}$/.test(rawHash)) {
    return rawHash as `0x${string}`;
  }
  return keccak256(stringToHex(fallbackSeed));
}

export async function POST(req: NextRequest) {
  try {
    const rawRelayerKey = process.env.SYL_OWNER_PRIVATE_KEY || "";
    if (!rawRelayerKey.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server relayer key (SYL_OWNER_PRIVATE_KEY) is not configured.",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const courseTitleRaw =
      typeof body.courseTitle === "string" && body.courseTitle.trim()
        ? body.courseTitle.trim()
        : "Syllaba Academic Course";
    const recipientNameRaw =
      typeof body.recipientName === "string" && body.recipientName.trim()
        ? body.recipientName.trim()
        : "Scholar";
    const certKindRaw =
      typeof body.certKind === "string" && body.certKind.trim()
        ? body.certKind.trim()
        : "COURSE_PASS";
    const pointsNum =
      typeof body.points === "number" && Number.isFinite(body.points)
        ? Math.max(0, Math.round(body.points))
        : 0;
    const gradeNum =
      typeof body.finalGradeScore === "number" &&
      Number.isFinite(body.finalGradeScore)
        ? Math.max(0, Math.min(100, Math.round(body.finalGradeScore)))
        : 100;
    const ipfsCidRaw =
      typeof body.ipfsCid === "string" && body.ipfsCid.trim()
        ? body.ipfsCid.trim()
        : "canonical-digest";
    const studentAddress =
      typeof body.studentAddress === "string" && isAddress(body.studentAddress)
        ? (body.studentAddress as `0x${string}`)
        : null;

    const account = privateKeyToAccount(normalizeHexKey(rawRelayerKey));
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BASE_SEPOLIA_RPC_URL),
    });
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(BASE_SEPOLIA_RPC_URL),
    });

    let mintedDigest = resolveBytes32Digest(
      body.certHash,
      `SYLLABA_CERT:${courseTitleRaw}:${recipientNameRaw}:${gradeNum}:${Date.now()}`
    );

    // Ensure bytes32 certDigest is unique on-chain even for re-issues or shared non-wallet digests
    try {
      const existingTokenId = await publicClient.readContract({
        address: SYLLABA_SBT_ADDRESS,
        abi: SBT_RELAY_ABI,
        functionName: "tokenByDigest",
        args: [mintedDigest],
      });
      if (existingTokenId > BigInt(0)) {
        mintedDigest = keccak256(
          stringToHex(
            `${mintedDigest}:${studentAddress || "non-wallet"}:${Date.now()}:${Math.random()
              .toString(36)
              .slice(2, 8)}`
          )
        );
      }
    } catch {
      // Proceed with resolved digest if view check is temporarily unavailable
    }

    const certArgs = [
      mintedDigest,
      certKindRaw.slice(0, 32),
      courseTitleRaw.slice(0, 80),
      recipientNameRaw.slice(0, 48),
      BigInt(pointsNum),
      BigInt(gradeNum),
      ipfsCidRaw.slice(0, 80),
    ] as const;

    const txHash = studentAddress
      ? await walletClient.writeContract({
          address: SYLLABA_SBT_ADDRESS,
          abi: SBT_RELAY_ABI,
          functionName: "mintCertificateFor",
          args: [studentAddress, ...certArgs],
        })
      : await walletClient.writeContract({
          address: SYLLABA_SBT_ADDRESS,
          abi: SBT_RELAY_ABI,
          functionName: "mintCertificate",
          args: certArgs,
        });

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Optional secondary mirror to legacy SyllabaCertificateProof if its owner key is configured
    let proofContractTxHash: `0x${string}` | undefined;
    const legacyOwnerKey = (process.env.CERT_PROOF_OWNER_KEY || "").trim();
    if (legacyOwnerKey) {
      try {
        const legacyAccount = privateKeyToAccount(
          normalizeHexKey(legacyOwnerKey)
        );
        const legacyClient = createWalletClient({
          account: legacyAccount,
          chain: baseSepolia,
          transport: http(BASE_SEPOLIA_RPC_URL),
        });
        proofContractTxHash = await legacyClient.writeContract({
          address: LEGACY_PROOF_CONTRACT,
          abi: LEGACY_PROOF_ABI,
          functionName: "issueCertificate",
          args: [studentAddress || account.address, mintedDigest],
        });
      } catch {
        // Non-blocking mirror: primary SBT anchoring already confirmed on Base Sepolia
      }
    }

    return NextResponse.json({
      ok: true,
      txHash,
      certHash: mintedDigest,
      sbtContractAddress: SYLLABA_SBT_ADDRESS,
      relayerAddress: account.address,
      recipientAddress: studentAddress || account.address,
      proofType: "onchain-tx" as const,
      chainId: 84532,
      proofContractTxHash,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to anchor certificate on-chain";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
