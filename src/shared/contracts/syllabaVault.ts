export const SYLLABA_VAULT_ADDRESS =
  (process.env.NEXT_PUBLIC_SYLLABA_VAULT_ADDRESS as `0x${string}` | undefined) || undefined;

export const SYLLABA_VAULT_ABI = [
  {
    type: "function",
    name: "commitStudyPlan",
    stateMutability: "payable",
    inputs: [
      { name: "roadmapHash", type: "bytes32" },
      { name: "ipfsCid", type: "string" },
      { name: "totalMilestones", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "verifyMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roadmapHash", type: "bytes32" },
      { name: "milestoneIndex", type: "uint256" },
      { name: "proofHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimStudyCredential",
    stateMutability: "nonpayable",
    inputs: [{ name: "roadmapHash", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getCommitment",
    stateMutability: "view",
    inputs: [
      { name: "student", type: "address" },
      { name: "roadmapHash", type: "bytes32" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "student", type: "address" },
          { name: "roadmapHash", type: "bytes32" },
          { name: "ipfsCid", type: "string" },
          { name: "totalMilestones", type: "uint256" },
          { name: "verifiedMilestones", type: "uint256" },
          { name: "stakeAmount", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "claimed", type: "bool" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "StudyPlanCommitted",
    inputs: [
      { name: "student", type: "address", indexed: true },
      { name: "roadmapHash", type: "bytes32", indexed: true },
      { name: "ipfsCid", type: "string", indexed: false },
      { name: "totalMilestones", type: "uint256", indexed: false },
      { name: "stakeAmount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
] as const;
