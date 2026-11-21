# Syllaba: End-to-End QA Checklist & 2m45s 1080p Demo Video Shot List

## Part 1: Automated Smoke Test Commands

Run the automated verification scripts locally at any time:

```bash
# 1. Verify Smart Contract bytecode, ABI selectors, and keccak256 calldata encoding
node scripts/test-vault.mjs

# 2. Verify Agent 3 OpenAlex (is_oa:true) & Wikipedia HTTP 200, Agent 2/4 15-30m bounds, and keccak256 digest
node scripts/smoke-test.mjs

# 3. Verify TypeScript strict types and Next.js 15 production build
npx tsc --noEmit
npm run build
```

---

## Part 2: Manual E2E Verification Checklist (Desktop & Mobile 375px)

- [x] **1. Hero & Quick Presets (Desktop 1440px & Mobile 375px)**:
  - Open `https://testtt-peach.vercel.app` (or `https://syllaba.xyz`).
  - Confirm asymmetric 2-column hero renders cleanly on desktop and stacks vertically with zero horizontal overflow at `375px` viewport width.
  - Click one of the 3 academic syllabus presets (`Distributed Systems`, `Machine Learning`, `Cognitive Psychology`) or upload a `.pdf` / `.txt` syllabus.
- [x] **2. Live Multi-Agent Pipeline Execution**:
  - Click **Generate Verified Roadmap**.
  - Confirm the 3 live progress cards animate sequentially:
    - `Agent 1: Syllabus Extractor`
    - `Agent 2 & 4: Micro-Task Planner & Deterministic Validator`
    - `Agent 3: Open-Access Scholarly Curator`
- [x] **3. Workspace Tabs & Micro-Task Sizing (15-30 Minutes)**:
  - In **Daily Micro-Tasks**, verify every task badge displays a duration between `15m` and `30m`, cognitive load pill (`light`, `moderate`, `deep`), and expandable subtasks.
  - Launch the **25m Focus Timer** on any task and toggle task completion to watch the right-rail progress bar update immediately.
  - Switch to **Curated Literature** and click an OpenAlex (`is_oa:true`) or Wikipedia link to verify it opens a real, non-paywalled scholarly page.
- [x] **4. Web3 Connect Wallet Modal & On-Chain Proof Anchoring**:
  - Click **Connect Wallet** in the top navigation bar.
  - Verify the **Connect Wallet Modal** opens immediately in the center of the screen, showing:
    - Browser Wallet Extensions (MetaMask / EIP-6963 detected wallets + Force Account Picker option).
    - **Instant Base Sepolia Wallet (1-Click)** embedded cryptographic `secp256k1` wallet.
    - Optional Base Sepolia Testnet Private Key import.
  - Switch to the **On-Chain Proofs** tab:
    - Verify the `keccak256 Roadmap Digest` is displayed.
    - If using MetaMask with Base Sepolia ETH, click **1-Click Deploy Vault (Base Sepolia)** to deploy `SyllabaProofVault.sol`, then click **Commit Study Plan On-Chain**, **Verify Milestone**, and **Claim Study Credential**.
    - Or click **Snapshot & Sign Study Proof** to sign an immediate zero-gas EIP-191 cryptographic commitment and see the new record appear in the **Verification Ledger** table (persisted to Supabase `public.onchain_proofs`).
- [x] **5. Adaptive Rescheduler & Calendar Export**:
  - Click **I'm Falling Behind** in the top workspace toolbar.
  - Confirm Agent 5 redistributes remaining tasks across surviving days and updates the Burnout Risk Meter.
  - Click **Export .ics** to download the calendar file.

---

## Part 3: 2-Minute 45-Second Backup Video Recording Shot List (1080p, 60fps)

- **Shot 1 (`0:00 - 0:25`) - Split Hero & Wallet Connection**:
  - Start on the Syllaba landing page (`1920x1080`, 100% zoom).
  - Click **Connect Wallet** in the top-right header to showcase the Connect Wallet Modal.
  - Connect via **MetaMask (Base Sepolia)** or **Instant Base Sepolia Wallet (1-Click)** so the green `Base Sepolia` badge and `0x...` address appear in the header.
- **Shot 2 (`0:25 - 0:55`) - Syllabus Input & Live 3-Stage Multi-Agent Generation**:
  - Click the **Distributed Systems** or **Machine Learning** preset chip in the Agent Console card (or drop a syllabus PDF).
  - Set daily study cap to `2h / day` and click **Generate Verified Roadmap**.
  - Keep the camera focused on the 3 live agent step cards (`Extractor` -> `Planner & Validator` -> `Open-Access Curator`) completing in real time.
- **Shot 3 (`0:55 - 1:30`) - Micro-Tasks, Pomodoro Timer & Open-Access Literature**:
  - Expand Day 1 in the **Daily Micro-Tasks** tab, check off two subtasks, and click the **Focus Timer** button on a 25-minute micro-task to show the live countdown.
  - Click the **Curated Literature** tab and hover/click one OpenAlex Open-Access paper link to prove real scholarly curation.
- **Shot 4 (`1:30 - 2:15`) - On-Chain Proof Vault & Verification Ledger**:
  - Switch to the **On-Chain Proofs** tab.
  - Highlight the `keccak256 Roadmap Digest`.
  - Click **1-Click Deploy Vault (Base Sepolia)** / **Commit Study Plan On-Chain** (or **Snapshot & Sign Study Proof**), approve the wallet prompt, and show the new verified entry in the **Verification Ledger** along with the clickable **BaseScan** / **IPFS** links.
  - Click **Verify Milestone** to record milestone completion in the ledger.
- **Shot 5 (`2:15 - 2:45`) - Adaptive Rescheduler & `.ics` Calendar Export**:
  - Return to **Daily Micro-Tasks**, click **I'm Falling Behind** to trigger Agent 5 adaptive rescheduling, highlight the updated **Burnout Risk Analysis** rail on the right, and click **Export .ics** to finish cleanly.
