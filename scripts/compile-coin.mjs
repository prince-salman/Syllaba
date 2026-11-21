import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const outDir = path.resolve(".solc_out");
fs.mkdirSync(outDir, { recursive: true });

execSync(
  "npx --yes solc --bin --abi --optimize -o .solc_out contracts/SyllabaCoin.sol",
  { stdio: "inherit" }
);

const abiPath = path.join(outDir, "contracts_SyllabaCoin_sol_SyllabaCoin.abi");
const binPath = path.join(outDir, "contracts_SyllabaCoin_sol_SyllabaCoin.bin");

const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
const bytecode = `0x${fs.readFileSync(binPath, "utf8").trim()}`;

const tsOut = `export const SYLLABA_COIN_ADDRESS =
  (process.env.NEXT_PUBLIC_SYLLABA_COIN_ADDRESS as \`0x\${string}\` | undefined) || undefined;

export const SYLLABA_COIN_BYTECODE: \`0x\${string}\` =
  "${bytecode}";

export const SYLLABA_COIN_ABI = ${JSON.stringify(abi, null, 2)} as const;
`;

fs.writeFileSync(path.resolve("src/shared/contracts/syllabaCoin.ts"), tsOut, "utf8");
fs.rmSync(outDir, { recursive: true, force: true });

console.log(
  "Generated src/shared/contracts/syllabaCoin.ts successfully. Bytecode chars:",
  bytecode.length,
  "ABI entries:",
  abi.length
);
