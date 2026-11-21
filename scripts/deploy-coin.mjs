import fs from "node:fs";
import path from "node:path";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const rawKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!rawKey) {
  console.error("Missing DEPLOYER_PRIVATE_KEY environment variable.");
  console.error("Usage: DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-coin.mjs");
  console.error("Or click 'Deploy $SYL ERC-20 Contract (Base Sepolia)' directly inside Syllaba UI.");
  process.exit(1);
}

const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
const account = privateKeyToAccount(formattedKey);

const tsContent = fs.readFileSync(path.resolve("src/shared/contracts/syllabaCoin.ts"), "utf8");
const bytecodeMatch = tsContent.match(/SYLLABA_COIN_BYTECODE:\s*`0x\$\{string\}`\s*=\s*"(0x[0-9a-fA-F]+)"/);

if (!bytecodeMatch) {
  console.error("Could not read SYLLABA_COIN_BYTECODE from src/shared/contracts/syllabaCoin.ts");
  process.exit(1);
}

const bytecode = bytecodeMatch[1];
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

console.log(`Deploying SyllabaCoin ($SYL ERC-20) to Base Sepolia (84532) from ${account.address}...`);
const txHash = await walletClient.sendTransaction({
  data: bytecode,
});

console.log(`Transaction broadcast: https://sepolia.basescan.org/tx/${txHash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
console.log(`SyllabaCoin ($SYL) deployed at: ${receipt.contractAddress}`);
console.log(`BaseScan Token Explorer: https://sepolia.basescan.org/token/${receipt.contractAddress}`);
