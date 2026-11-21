import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import {
  OFFICIAL_SYL_MODULE_REWARD,
  SYLLABA_COIN_ABI,
  SYLLABA_COIN_ADDRESS,
} from "@/shared/contracts/syllabaCoin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studentAddress = typeof body?.studentAddress === "string" ? body.studentAddress.trim() : "";

    if (!isAddress(studentAddress)) {
      return NextResponse.json(
        { ok: false, error: "Invalid recipient wallet address." },
        { status: 400 }
      );
    }

    const rawOwnerKey =
      process.env.SYL_OWNER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

    if (!rawOwnerKey) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          contractAddress: SYLLABA_COIN_ADDRESS,
          amountSyl: OFFICIAL_SYL_MODULE_REWARD,
          error:
            "SYL_OWNER_PRIVATE_KEY is not configured on the server. Connect the contract owner wallet directly to mint 0.25 SYL via rewardCompletedModule().",
        },
        { status: 200 }
      );
    }

    const formattedKey = rawOwnerKey.startsWith("0x")
      ? (rawOwnerKey as `0x${string}`)
      : (`0x${rawOwnerKey}` as `0x${string}`);

    const account = privateKeyToAccount(formattedKey);
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const txHash = await walletClient.writeContract({
      address: SYLLABA_COIN_ADDRESS,
      abi: SYLLABA_COIN_ABI,
      functionName: "rewardCompletedModule",
      args: [studentAddress],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      ok: true,
      configured: true,
      txHash,
      amountSyl: OFFICIAL_SYL_MODULE_REWARD,
      contractAddress: SYLLABA_COIN_ADDRESS,
      recipient: studentAddress,
    });
  } catch (error) {
    console.error("Failed to distribute 0.25 SYL module reward:", error);
    return NextResponse.json(
      {
        ok: false,
        configured: Boolean(
          process.env.SYL_OWNER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY
        ),
        error: "Failed to execute rewardCompletedModule on Base Sepolia.",
      },
      { status: 500 }
    );
  }
}
