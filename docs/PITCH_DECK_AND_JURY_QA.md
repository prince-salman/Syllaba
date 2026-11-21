# Syllaba: COMPSPHERE 12 Championship Pitch Package (Team ITSPIRIT)

- **Competition**: COMPSPHERE 12 / HACKSPHERE 2026 International Web3 Hackathon (Phase 2 Finalist)
- **Team Name**: ITSPIRIT (President University)
  - **Team Leader**: Arbi Pratama (Web3, Smart Contract Architecture & Pitching)
  - **Member 1**: Immanuel Elvando Kenjam (Hybrid Storage, IPFS/Supabase, Open-Access Curation & QA)
  - **Member 2**: Muhamad Salman (Multi-Agent Gemini Pipeline, UI/UX Architecture & Cloud Deployment)
- **Product**: Syllaba (`https://syllaba.xyz` / `https://testtt-peach.vercel.app`)

---

## Part 1: 10-Slide Championship Pitch Deck Structure

### Slide 1: Title & Core Hook
- **Headline**: Syllaba: Turning Static University Syllabi into Verifiable On-Chain Study Commitments.
- **Sub-headline**: Multi-Agent AI Task Decomposition paired with Base L2 Accountability Vaults and Proof-of-Study Credentials.
- **Visual**: Live split-view of a raw 14-week syllabus PDF transforming into 15-30 minute daily micro-tasks and an anchored Base Sepolia transaction receipt.

### Slide 2: The Academic Execution Crisis (Empirical Urgency)
- **Core Message**: Students do not fail because they lack syllabi; they fail because static syllabi trigger cognitive overload and last-minute cramming.
- **Verified Data Points**:
  - **American College Health Association (JACH)**: Over 65% of university students report overwhelming academic stress directly tied to workload pacing and deadline clustering.
  - **American Psychological Association (APA)**: Between 80% and 95% of college students engage in chronic academic procrastination, with 75% identifying themselves as habitual procrastinators.
- **Root Cause**: A 16-week syllabus lists macro-exams and broad chapters without actionable daily execution boundaries or verifiable intermediate accountability.

### Slide 3: Why Legacy LMS and Generic AI Wrapper Tools Fail
- **Core Message**: Existing platforms either dump raw files or hallucinate unverified study schedules.
- **3 Structural Gaps**:
  1. **Passive LMS Platforms (Moodle, Canvas)**: Act as static file cabinets with zero adaptive pacing when a student falls behind.
  2. **Single-Prompt LLM Wrappers**: Hallucinate broken reference links, ignore daily cognitive fatigue caps, and time out on complex 14-week documents.
  3. **Zero Skin-in-the-Game or Verifiable Proof**: Completing self-study tasks produces no tamper-proof credential or accountability mechanism.

### Slide 4: The Syllaba Solution
- **Core Message**: An autonomous 5-agent academic execution engine backed by cryptographic proof on Base Sepolia.
- **3 Pillars**:
  1. **Micro-Task Decomposition (15-30 Minutes)**: Slices heavy academic modules into low-friction daily sprints capped at 150 minutes per day.
  2. **Verified Open-Access Scholarly Curation**: Queries OpenAlex (`is_oa:true`) and Wikipedia directly so every reading link is real, legal, and free to download.
  3. **On-Chain Study Commitment & Dynamic Recovery**: Anchors study plan hashes on Base Sepolia and dynamically recalculates schedules with 1 click when a student falls behind.

### Slide 5: Why Web3 Is Essential (Not Cosmetic)
- **Core Message**: Web3 solves the two hardest problems in self-directed education: **commitment enforcement** and **portable micro-credentialing**.
- **On-Chain Mechanics (`SyllabaProofVault.sol` on Base Sepolia, Chain ID `84532`)**:
  - `commitStudyPlan(bytes32 roadmapHash, string ipfsCid, uint256 totalMilestones, uint256 deadline)`: Locks the canonical `keccak256` study plan digest and optional micro-stake on-chain before study begins.
  - `verifyMilestone(bytes32 roadmapHash, uint256 milestoneIndex, bytes32 proofHash)`: Records immutable, timestamped progress checkpoints as daily modules are completed.
  - `claimStudyCredential(bytes32 roadmapHash)`: Enforces a `nonReentrant` check that all milestones were verified prior to the deadline, refunds the anti-procrastination micro-stake, and emits an on-chain Proof-of-Study credential event.

### Slide 6: System Architecture (5-Agent Modular Pipeline + Hybrid Web3 Storage)
- **Core Message**: Built to eliminate LLM hallucinations and survive strict serverless execution budgets.
- **Pipeline Flow**:
  - **Agent 1 (Syllabus Extractor - Gemini 3.5 Flash)**: Extracts structured modules, topics, weights, and hard deadlines (`POST /api/agents/extract`).
  - **Agent 2 (Micro-Task Decomposer - Gemini 3.5 Flash)**: Generates 15-30 minute daily tasks with cognitive load tags (`light`, `moderate`, `deep`).
  - **Agent 3 (Autonomous Material Curator)**: Queries OpenAlex Works API (`filter=is_oa:true`) and Wikipedia REST API in parallel with 5-second timeouts (`POST /api/agents/curate`).
  - **Agent 4 (Deterministic TypeScript Validator)**: Zero-token, zero-latency mathematical validator enforcing `15 <= task <= 30` minutes and `<= 150` minutes/day cognitive cap.
  - **Agent 5 (Adaptive Rescheduler)**: Re-distributes incomplete tasks across remaining days before the hard deadline (`POST /api/roadmap/reschedule`).
  - **Hybrid Persistence**: Supabase PostgreSQL (`roadmaps`, `curated_resources`, `onchain_proofs`) + IPFS Snapshot CID (`POST /api/ipfs/snapshot`) + Base Sepolia `SyllabaProofVault.sol`.

### Slide 7: Live Production Demo Walkthrough
- **Core Message**: Working end-to-end in production right now, not a mockup.
- **Demo Flow**:
  1. Click a 1-click syllabus preset or drop a real university PDF.
  2. Watch Agents 1, 2+4, and 3 execute live in under 4 seconds with verified Open-Access journal links.
  3. Open the Connect Wallet Modal (supports MetaMask EIP-6963 and 1-Click Instant Base Sepolia Embedded Wallet).
  4. Deploy/anchor the `keccak256` roadmap digest on Base Sepolia, verify a milestone, and inspect the live transaction hash on BaseScan Sepolia.
  5. Trigger **"I'm Falling Behind"** to demonstrate adaptive schedule recovery and `.ics` calendar export.

### Slide 8: Business Model & Go-To-Market
- **Core Message**: Dual B2C + B2B revenue flywheel with low customer acquisition cost.
- **Revenue Streams**:
  - **B2C Student Tier (Freemium / \$4.99 per Semester)**: Unlimited multi-syllabus roadmaps, Pomodoro telemetry, calendar sync, and zero-fee Proof-of-Study attestations.
  - **Accountability Vault Protocol Fee (1.5% on Forfeited Peer-Pool Stakes)**: Optional study cohort pools where disciplined students earn yield from forfeited procrastination stakes.
  - **B2B University & Bootcamp API (\$2,500 per Semester per Institution)**: White-label integration for university student-success centers to detect burnout risk early and verify independent study hours.

### Slide 9: Post-Hackathon Roadmap
- **Phase 1 (Q4 2026 - Hackathon MVP)**: 5-Agent Gemini pipeline, OpenAlex Open-Access curator, Supabase + IPFS snapshots, and `SyllabaProofVault.sol` on Base Sepolia.
- **Phase 2 (Q1 2027 - Base Mainnet & ERC-5192 Soulbound Tokens)**: Deploy audited vault on Base Mainnet with Paymaster gas sponsorship (ERC-4337) and non-transferable Soulbound study badges.
- **Phase 3 (Q2 2027 - University Pilot & Cohort Staking Pools)**: Launch pilot with 500+ computer science students at President University and introduce multiplayer cohort study vaults.

### Slide 10: Team ITSPIRIT & Closing Call
- **Team Members**:
  - **Arbi Pratama**: Smart Contract Architecture, Web3 Integration & Product Strategy.
  - **Immanuel Elvando Kenjam**: Data Engineering, Supabase/IPFS Hybrid Storage & Scholarly API Curation.
  - **Muhamad Salman**: Multi-Agent AI Engineering, Frontend Architecture & Cloud Infrastructure.
- **Closing Tagline**: Syllaba transforms academic intent into verifiable daily execution.

---

## Part 2: Exact 3-Minute Stage Presentation & Live Demo Script (English)

### `[0:00 - 0:30]` The Hook & Academic Crisis (Speaker: Ka Arbi)
"Good morning judges. Every semester, millions of university students receive a 15-page syllabus on day one, and by week four, they are already behind. Research from the American Psychological Association shows 80 to 95 percent of college students suffer from chronic academic procrastination, while over 65 percent report severe workload stress. Why? Because traditional LMS platforms like Moodle and Canvas are passive file cabinets, and generic AI chat wrappers hallucinate study plans with zero accountability. Today, Team ITSPIRIT presents **Syllaba**: the first multi-agent academic decomposition engine anchored by verifiable on-chain study commitments on Base."

### `[0:30 - 1:10]` Live Demo Part 1: 5-Agent Decomposition & Open-Access Curation (Speaker: Salman)
"Let us look at Syllaba running live in production. When a student uploads a syllabus PDF or selects a course preset, we do not run a single monolithic prompt that times out or hallucinates. Instead, our modular pipeline executes in three observable stages. First, Agent 1 extracts structured modules, weights, and hard deadlines using Gemini Flash. Second, Agent 2 decomposes every module into friction-free 15 to 30 minute daily micro-tasks, while Agent 4, our deterministic TypeScript validator, mathematically enforces a 150-minute daily cognitive cap and inserts mandatory rest days. Third, Agent 3 queries the OpenAlex and Wikipedia APIs in real time, attaching 100 percent legal Open-Access academic papers with zero hallucinated URLs."

### `[1:10 - 2:00]` Live Demo Part 2: Web3 Wallet Modal & Base Sepolia Study Vault (Speaker: Ka Arbi)
"Now, how do we turn a generated schedule into real execution? Clicking **Connect Wallet** opens our native multi-wallet engine, which supports both EIP-6963 browser extensions like MetaMask and a 1-click embedded Base Sepolia wallet for non-crypto students. In the **On-Chain Proofs** tab, Syllaba computes a canonical `keccak256` digest of the entire roadmap and generates a content-addressed IPFS snapshot CID. With one click on our `SyllabaProofVault` smart contract on Base Sepolia, the student commits their study plan on-chain, optionally locking a micro-stake. As they complete daily tasks and run the built-in Pomodoro timer, they verify milestones on-chain and claim their stake back along with a verifiable Proof-of-Study credential. Every transaction links directly to BaseScan Sepolia."

### `[2:00 - 2:30]` Live Demo Part 3: Dynamic Rescheduling & Burnout Prevention (Speaker: Elvan)
"Life happens, and students miss study days. Instead of abandoning the plan, the student clicks **I'm Falling Behind**. Agent 5 immediately recalculates all remaining micro-tasks across the surviving days before the hard deadline while keeping the Burnout Risk Meter within safe daily limits, and exports the updated schedule as a universal `.ics` calendar file."

### `[2:30 - 3:00]` Business Viability & Closing (Speaker: Ka Arbi)
"Syllaba combines a B2C freemium model for students with a B2B institutional dashboard for universities to reduce dropout and burnout rates. By pairing deterministic multi-agent AI with Base L2 smart contract accountability, Syllaba ensures no student is left overwhelmed by a static syllabus again. Thank you, and we are ready for your questions."

---

## Part 3: Top 10 Toughest Jury Q&A (Web3 & AI Defense)

1. **Q: Why does Syllaba need blockchain? Could you not store study progress in Supabase alone?**
   - **A**: A centralized database row can be edited or backdated by the user or platform administrator at any time, which means it holds zero evidentiary weight for external scholarships, bootcamps, or peer-staking pools. By anchoring the `keccak256` roadmap hash and milestone timestamps into `SyllabaProofVault.sol` on Base Sepolia, we enable trustless anti-procrastination micro-staking and portable, tamper-proof Proof-of-Study credentials.

2. **Q: How do you prevent LLM hallucinations when curating academic reading materials?**
   - **A**: We never allow the LLM to invent URLs or paper titles. Agent 1 only extracts clean academic topic keywords from the syllabus, and Agent 3 queries the real OpenAlex Works REST API (`filter=is_oa:true`) and Wikipedia API directly over HTTPS, returning only verified DOI/Open-Access links that exist in global scholarly indices.

3. **Q: What happens if a non-crypto student does not have MetaMask installed or does not have Base Sepolia ETH for gas?**
   - **A**: We engineered a dual-path onboarding flow inside our Connect Wallet Modal. Students with MetaMask or Coinbase Wallet connect via EIP-6963 discovery, while non-crypto students can activate an instant 1-click embedded `secp256k1` wallet in the browser and sign zero-gas EIP-191 cryptographic study attestations immediately.

4. **Q: How do you prevent your AI pipeline from hitting Vercel's 10-second serverless timeout on long syllabi?**
   - **A**: We decoupled the monolithic generation into three independent, sequentially orchestrated endpoints (`/api/agents/extract`, `/api/agents/plan`, and `/api/agents/curate`), each guarded by an 8-second `AbortController` timeout. If the LLM API experiences latency or quota pressure, our deterministic heuristic engine in `pacing.service.ts` takes over seamlessly in under 50 milliseconds.

5. **Q: Is `SyllabaProofVault.sol` vulnerable to reentrancy attacks when refunding a student's micro-stake?**
   - **A**: No. `claimStudyCredential` enforces both a custom `nonReentrant` mutex lock and strict Checks-Effects-Interactions (CEI) ordering: we verify that `completedMilestones == totalMilestones`, set `plan.claimed = true` and `plan.stakeAmount = 0` in storage first, and only then execute the external ETH transfer.

6. **Q: How do you verify that an AI-generated schedule actually prevents burnout rather than overloading the student?**
   - **A**: We do not trust the LLM to do arithmetic. Agent 4 (`validateAndNormalizeRoadmap`) is a deterministic TypeScript validator that runs after Agent 2, clamping every single micro-task to the 15-to-30 minute range, enforcing a strict 150-minute daily ceiling, and computing a quantitative Burnout Risk Score from active-day density and rest-day frequency.

7. **Q: What prevents a student from clicking all tasks as complete in 10 seconds just to claim their stake back?**
   - **A**: On the client and API layer, task completion integrates with our built-in 25-minute Pomodoro Focus Timer and subtask verification checklist, while each milestone proof hash (`computeMilestoneProofHash`) binds the roadmap ID, milestone index, completed task count, and signer wallet address into a signed cryptographic digest logged to `onchain_proofs`.

8. **Q: Why did you choose Base as the blockchain network for Syllaba?**
   - **A**: Student micro-commitments require sub-cent transaction fees and rapid 2-second block confirmations so that anchoring a study plan or verifying a weekly milestone costs less than \$0.001. Base also provides native ecosystem support for Coinbase Smart Wallet and ERC-4337 Paymasters for future gasless student onboarding.

9. **Q: What happens if Pinata IPFS is unreachable during a live user session?**
   - **A**: Our `/api/ipfs/snapshot` endpoint uses a hybrid content-addressed strategy: when `PINATA_JWT` is configured, it pins the canonical JSON snapshot to Pinata IPFS; if Pinata is offline or unconfigured, it deterministically computes the SHA-256 content-addressed CID locally alongside the `keccak256` digest so proof anchoring never blocks.

10. **Q: How does Syllaba make money sustainably after the hackathon?**
    - **A**: We monetize through three tiers: a \$4.99/semester Student Pro subscription for multi-course calendar sync and AI rescheduling, a 1.5% protocol fee on forfeited stakes in group accountability pools, and B2B licensing to university student-success departments seeking early telemetry on course workload bottlenecks.
