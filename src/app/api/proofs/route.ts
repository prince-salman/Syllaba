import { NextRequest, NextResponse } from "next/server";
import { getOnChainProofsFromDb, saveOnChainProofToDb } from "@/server/db/proofs.repo";
import { OnChainProofRecord } from "@/shared/types/roadmap";
import { generateId } from "@/shared/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roadmapId = searchParams.get("roadmapId") || undefined;
    const walletAddress = searchParams.get("walletAddress") || undefined;

    const proofs = await getOnChainProofsFromDb({ roadmapId, walletAddress });
    return NextResponse.json({ proofs });
  } catch {
    return NextResponse.json({ proofs: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.roadmapId || !body.walletAddress || !body.roadmapHash || !body.txHash) {
      return NextResponse.json({ error: "Missing required proof fields." }, { status: 400 });
    }

    const record: OnChainProofRecord = {
      id: typeof body.id === "string" ? body.id : generateId("proof"),
      roadmapId: String(body.roadmapId),
      walletAddress: String(body.walletAddress),
      roadmapHash: String(body.roadmapHash),
      ipfsCid: body.ipfsCid ? String(body.ipfsCid) : undefined,
      txHash: String(body.txHash),
      chainId: typeof body.chainId === "number" ? body.chainId : 84532,
      status: typeof body.status === "string" ? body.status : "confirmed",
      createdAt: new Date().toISOString(),
    };

    await saveOnChainProofToDb(record);
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Failed to persist on-chain proof." }, { status: 500 });
  }
}
