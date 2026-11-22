export interface RelayerAnchorParams {
  certHash: `0x${string}`;
  ipfsCid: string;
  courseTitle: string;
  recipientName: string;
  finalGradeScore: number;
  certKind?: string;
  points?: number;
  studentAddress?: string | null;
}

export interface RelayerAnchorResult {
  txHash: string;
  certHash: `0x${string}`;
  sbtContractAddress: `0x${string}`;
  relayerAddress: string;
  proofType: "onchain-tx";
}

/**
 * Anchors a certificate onto Base Sepolia via the server-sponsored SBT relayer
 * so non-wallet and zero-gas users receive permanent on-chain verification.
 */
export async function anchorCertificateViaRelayer(
  params: RelayerAnchorParams
): Promise<RelayerAnchorResult | null> {
  try {
    const res = await fetch("/api/certificates/anchor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        certHash: params.certHash,
        ipfsCid: params.ipfsCid,
        courseTitle: params.courseTitle,
        recipientName: params.recipientName,
        finalGradeScore: params.finalGradeScore,
        certKind: params.certKind || "COURSE_PASS",
        points: params.points ?? 0,
        studentAddress: params.studentAddress || undefined,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.ok && typeof data?.txHash === "string" && data.txHash.startsWith("0x")) {
      return {
        txHash: data.txHash,
        certHash: data.certHash || params.certHash,
        sbtContractAddress: data.sbtContractAddress,
        relayerAddress: data.relayerAddress || "0x23eC82058985E357FB95B5D356793DE51138B7f5",
        proofType: "onchain-tx",
      };
    }
    return null;
  } catch {
    return null;
  }
}
