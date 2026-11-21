# Syllaba - Multi-Agent Academic Pacing & On-Chain Study Proof

Syllaba transforms overwhelming university syllabi and assignment rubrics into validated 15-30 minute daily micro-tasks with curated open-access scholarly literature and verifiable on-chain study commitments.

Built by **Team ITSPIRIT** for **COMPSPHERE 12 / HACKSPHERE 2026 International Web3 Hackathon (Phase 2 Top 30 Finalists)**.

## Live Production

- **Application**: https://syllaba-prince-salman-s-projects.vercel.app

## Core Architecture

### 1. Modular Multi-Agent Pipeline (Next.js App Router)
Designed to execute cleanly under serverless latency limits:
- **Agent 1 (`POST /api/agents/extract`)**: Extracts course metadata, modules, grading weights, and hard deadlines using `gemini-2.5-flash` with deterministic fallback.
- **Agent 2 & 4 (`POST /api/agents/plan`)**: Decomposes modules into 15-30 minute micro-tasks and runs deterministic TypeScript validation capping daily workload at 150 minutes with periodic recovery days.
- **Agent 3 (`POST /api/agents/curate`)**: Fetches legal Open-Access scholarly papers from **OpenAlex API** and conceptual summaries from **Wikipedia API** in parallel, archiving results in Supabase.
- **Agent 5 (`POST /api/roadmap/reschedule`)**: Adaptive rescheduler shifting remaining sessions smoothly without backlog panic.

### 2. Web3 Commitment & Proof Vault (`contracts/SyllabaProofVault.sol`)
- Solidity `^0.8.20` smart contract designed for **Base Sepolia (Chain ID 84532)**.
- `commitStudyPlan`: Anchors `keccak256` roadmap digest + IPFS snapshot CID on-chain with optional micro-stake.
- `verifyMilestone`: Logs cryptographic proof of completed study milestones.
- `claimStudyCredential`: Releases stake and records completion credential when all milestones are verified.
- Wallet connectivity powered by **RainbowKit + Wagmi + Viem** with Supabase proof ledger sync (`POST /api/proofs`) and **Pinata IPFS Snapshot** (`POST /api/ipfs/snapshot`).

### 3. Database Schema (`supabase/migrations/`)
- `public.roadmaps`: Full JSON study roadmaps synced with resilient client/server persistence.
- `public.curated_resources`: OpenAlex OA papers and Wikipedia links indexed per roadmap.
- `public.onchain_proofs`: Wallet signatures, Base Sepolia TX hashes, `keccak256` digests, and snapshot CIDs.

## Directory Structure

- `contracts/` &mdash; Solidity smart contracts (`SyllabaProofVault.sol`)
- `supabase/migrations/` &mdash; Idempotent PostgreSQL schema + RLS policies
- `src/client/` &mdash; Mobbin-referenced React UI components, RainbowKit header, tabbed workspace, focus timer, and proof panels
- `src/server/` &mdash; Multi-agent orchestration (`agents.service.ts`), pacing validator (`pacing.service.ts`), and Supabase repositories (`proofs.repo.ts`)
- `src/shared/` &mdash; TypeScript contracts (`roadmap.ts`), `syllabaVault.ts` ABI, and shared utilities
- `src/app/api/` &mdash; Modular Next.js API route handlers

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Production Build

```bash
npm run build
npm start
```
