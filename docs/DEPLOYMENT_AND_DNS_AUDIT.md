# Syllaba: Pre-Deployment Security Audit, Environment Matrix & `.xyz` DNS Guide

## 1. Repository Secret & Build Audit

- **`.gitignore` Verification**:
  - Blocks all `.env`, `.env.*`, `*.env`, `*.env.local`, `*.pem`, `*.key`, `HANDOFF_*.md`, and `.vercel` directories while allowing `.env.example`.
  - `DEPLOYER_PRIVATE_KEY` and `GEMINI_API_KEY` are server/CLI-only variables and are never prefixed with `NEXT_PUBLIC_`.
- **Static & Production Build Verification**:
  - `npx tsc --noEmit`: 0 TypeScript errors.
  - `npm run build`: Next.js 15.5.24 production build succeeds across all static pages and dynamic API routes (`/api/agents/extract`, `/api/agents/plan`, `/api/agents/curate`, `/api/ipfs/snapshot`, `/api/proofs`, `/api/roadmap/generate`, `/api/roadmap/reschedule`).

---

## 2. Vercel Environment Variables Matrix (Production & Preview)

| Variable Name | Scope | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server Only (`Encrypted`) | Authenticates Gemini Multi-Agent Pipeline (`gemini-3.5-flash` with fallback chain) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server (`Config`) | Active Supabase project URL (`https://yyqrgwsbyrnmvdtqutnm.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server (`Config`) | Supabase publishable anonymous key for `roadmaps`, `curated_resources`, and `onchain_proofs` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Client (`Config`) | Optional WalletConnect identifier |
| `NEXT_PUBLIC_SYLLABA_VAULT_ADDRESS` | Client (`Config`) | Optional pre-configured Base Sepolia `SyllabaProofVault.sol` contract address (`0x...`) |
| `PINATA_JWT` | Server Only (`Encrypted`) | Optional Pinata JWT for IPFS JSON pinning (automatically falls back to deterministic content-addressed CID) |

---

## 3. Base Sepolia Smart Contract Setup (`SyllabaProofVault.sol`)

### Option A: 1-Click In-App Deployment (Recommended)
1. Open the live Syllaba production app and click **Connect Wallet**.
2. Connect MetaMask on **Base Sepolia** (`Chain ID: 84532`, RPC `https://sepolia.base.org`) or import a funded Base Sepolia testnet private key in the Connect Wallet Modal.
3. Open any roadmap -> **On-Chain Proofs** tab -> click **1-Click Deploy Vault (Base Sepolia)**.
4. The app broadcasts the compiled `solc@0.8.20` bytecode from `src/shared/contracts/syllabaVault.ts`, polls `eth_getTransactionReceipt`, and stores the deployed `contractAddress`.

### Option B: CLI Deployment via `viem`
```bash
DEPLOYER_PRIVATE_KEY=0xYourBaseSepoliaTestnetKey node scripts/deploy-vault.mjs
```

### Base Sepolia Testnet Faucets
- Coinbase CDP Base Sepolia Faucet: `https://portal.cdp.coinbase.com/products/faucet`
- Alchemy Base Sepolia Faucet: `https://www.alchemy.com/faucets/base-sepolia`
- Superchain Faucet: `https://app.optimism.io/faucet`

---

## 4. Custom Domain `syllaba.xyz` DNS Configuration (Gen.xyz -> Vercel)

Both `syllaba.xyz` and `www.syllaba.xyz` are attached to the Vercel project `syllaba` (`prj_ZR1ftSz4IukmGsULF10DDFjZOcGL`).

### Method 1: Custom Nameservers in Gen.xyz (Recommended)
1. Log into `https://gen.xyz/account/clientarea.php?action=domains`.
2. Select `syllaba.xyz` -> **Manage Domain** -> **Nameservers**.
3. Choose **Use custom nameservers** and replace `parking1.gen.xyz` / `parking2.gen.xyz` with:
   - **Nameserver 1**: `ns1.vercel-dns.com`
   - **Nameserver 2**: `ns2.vercel-dns.com`
4. Run verification:
   ```bash
   vercel domains verify syllaba.xyz --scope prince-salman-s-projects
   ```

### Method 2: DNS Records (If Keeping Default Nameservers)
- **A Record**: Host `@` -> Value `76.76.21.21`
- **CNAME Record**: Host `www` -> Value `cname.vercel-dns.com`
