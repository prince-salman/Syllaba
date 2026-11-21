import fs from "node:fs";
import path from "node:path";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const rawKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!rawKey) {
  console.error("Missing DEPLOYER_PRIVATE_KEY environment variable.");
  console.error("Usage (PowerShell): $env:DEPLOYER_PRIVATE_KEY='0x...'; node scripts/deploy-all.mjs");
  process.exit(1);
}

const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
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

function extractBytecode(filePath, constName) {
  const content = fs.readFileSync(path.resolve(filePath), "utf8");
  const match = content.match(
    new RegExp(`${constName}:\\s*\`0x\\$\\{string\\}\`\\s*=\\s*"(0x[0-9a-fA-F]+)"`)
  );
  if (!match) {
    throw new Error(`Could not extract ${constName} from ${filePath}`);
  }
  return match[1];
}

const balance = await publicClient.getBalance({ address: account.address });
console.log(`Deployer: ${account.address}`);
console.log(`Base Sepolia Balance: ${formatEther(balance)} ETH`);
if (balance === 0n) {
  console.error("Zero Base Sepolia ETH balance! Fund this burner wallet via faucet first.");
  process.exit(1);
}

const targets = [
  {
    name: "SyllabaProofVault",
    envKey: "NEXT_PUBLIC_SYLLABA_VAULT_ADDRESS",
    bytecode: extractBytecode("src/shared/contracts/syllabaVault.ts", "SYLLABA_VAULT_BYTECODE"),
  },
  {
    name: "SyllabaCoin ($SYL ERC-20)",
    envKey: "NEXT_PUBLIC_SYLLABA_COIN_ADDRESS",
    bytecode: extractBytecode("src/shared/contracts/syllabaCoin.ts", "SYLLABA_COIN_BYTECODE"),
  },
  {
    name: "SyllabaCertificateSBT (ERC-721)",
    envKey: "NEXT_PUBLIC_SYLLABA_SBT_ADDRESS",
    bytecode: extractBytecode("src/shared/contracts/syllabaCertificateSbt.ts", "SYLLABA_SBT_BYTECODE"),
  },
];

const deployedEnv = {};
for (const item of targets) {
  console.log(`\nDeploying ${item.name}...`);
  const txHash = await walletClient.sendTransaction({ data: item.bytecode });
  console.log(`TX: https://sepolia.basescan.org/tx/${txHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`Address: ${receipt.contractAddress}`);
  console.log(`Explorer: https://sepolia.basescan.org/address/${receipt.contractAddress}`);
  deployedEnv[item.envKey] = receipt.contractAddress;
}

console.log("\n=== Add these to Vercel Environment Variables & .env.local ===");
for (const [k, v] of Object.entries(deployedEnv)) {
  console.log(`${k}=${v}`);
}
