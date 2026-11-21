import { NextRequest, NextResponse } from "next/server";
import { keccak256, stringToHex } from "viem";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roadmap = body.roadmap;

    if (!roadmap || !roadmap.id) {
      return NextResponse.json({ error: "Valid roadmap payload is required." }, { status: 400 });
    }

    const snapshotPayload = {
      schema: "syllaba-study-snapshot-v1",
      roadmapId: roadmap.id,
      courseTitle: roadmap.courseTitle,
      startDate: roadmap.startDate,
      targetEndDate: roadmap.targetEndDate,
      totalDays: roadmap.totalDays,
      totalTasks: roadmap.totalTasks,
      completedTasks: roadmap.completedTasks,
      burnoutMetrics: roadmap.burnoutMetrics,
      capturedAt: new Date().toISOString(),
    };

    const canonicalJson = JSON.stringify(snapshotPayload);
    const roadmapHash = keccak256(stringToHex(canonicalJson));
    const sha256Digest = createHash("sha256").update(canonicalJson).digest("hex");

    const pinataJwt = process.env.PINATA_JWT;
    let ipfsCid = `snapshot-${sha256Digest.slice(0, 32)}`;
    let storageMode: "pinata-ipfs" | "canonical-digest" = "canonical-digest";

    if (pinataJwt) {
      try {
        const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pinataJwt}`,
          },
          body: JSON.stringify({
            pinataMetadata: { name: `syllaba-${roadmap.id}` },
            pinataContent: snapshotPayload,
          }),
        });

        if (pinataRes.ok) {
          const pinataData = await pinataRes.json();
          if (pinataData.IpfsHash) {
            ipfsCid = String(pinataData.IpfsHash);
            storageMode = "pinata-ipfs";
          }
        }
      } catch {
        // Fallback to deterministic SHA-256 content digest if Pinata request fails
      }
    }

    return NextResponse.json({
      roadmapId: roadmap.id,
      roadmapHash,
      ipfsCid,
      storageMode,
      snapshot: snapshotPayload,
    });
  } catch {
    return NextResponse.json({ error: "Failed to build verifiable snapshot." }, { status: 500 });
  }
}
