// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SyllabaProofVault
 * @notice Verifiable academic commitment and milestone proof ledger for Syllaba (Base Sepolia).
 */
contract SyllabaProofVault {
    struct StudyCommitment {
        address student;
        bytes32 roadmapHash;
        string ipfsCid;
        uint256 totalMilestones;
        uint256 verifiedMilestones;
        uint256 stakeAmount;
        uint256 deadline;
        bool claimed;
        bool exists;
    }

    bool private _locked;

    mapping(bytes32 => StudyCommitment) private _commitments;
    mapping(bytes32 => mapping(uint256 => bool)) private _verifiedMilestone;

    event StudyPlanCommitted(
        address indexed student,
        bytes32 indexed roadmapHash,
        string ipfsCid,
        uint256 totalMilestones,
        uint256 stakeAmount,
        uint256 deadline
    );

    event MilestoneVerified(
        address indexed student,
        bytes32 indexed roadmapHash,
        uint256 indexed milestoneIndex,
        bytes32 proofHash
    );

    event CredentialClaimed(
        address indexed student,
        bytes32 indexed roadmapHash,
        uint256 completedMilestones,
        uint256 returnedStake
    );

    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    function _commitmentKey(address student, bytes32 roadmapHash) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(student, roadmapHash));
    }

    /**
     * @notice Anchor a syllabus roadmap hash and IPFS snapshot on-chain with optional commitment stake.
     */
    function commitStudyPlan(
        bytes32 roadmapHash,
        string calldata ipfsCid,
        uint256 totalMilestones,
        uint256 deadline
    ) external payable {
        require(roadmapHash != bytes32(0), "Invalid roadmap hash");
        require(totalMilestones > 0, "Total milestones must be positive");
        require(deadline > block.timestamp, "Deadline must be in the future");

        bytes32 key = _commitmentKey(msg.sender, roadmapHash);
        require(!_commitments[key].exists, "Commitment already exists");

        _commitments[key] = StudyCommitment({
            student: msg.sender,
            roadmapHash: roadmapHash,
            ipfsCid: ipfsCid,
            totalMilestones: totalMilestones,
            verifiedMilestones: 0,
            stakeAmount: msg.value,
            deadline: deadline,
            claimed: false,
            exists: true
        });

        emit StudyPlanCommitted(
            msg.sender,
            roadmapHash,
            ipfsCid,
            totalMilestones,
            msg.value,
            deadline
        );
    }

    /**
     * @notice Record cryptographic proof of a completed micro-task or milestone.
     */
    function verifyMilestone(
        bytes32 roadmapHash,
        uint256 milestoneIndex,
        bytes32 proofHash
    ) external {
        bytes32 key = _commitmentKey(msg.sender, roadmapHash);
        StudyCommitment storage commitment = _commitments[key];

        require(commitment.exists, "Commitment not found");
        require(commitment.student == msg.sender, "Not commitment owner");
        require(!commitment.claimed, "Credential already claimed");
        require(milestoneIndex < commitment.totalMilestones, "Milestone index out of bounds");
        require(!_verifiedMilestone[key][milestoneIndex], "Milestone already verified");

        _verifiedMilestone[key][milestoneIndex] = true;
        commitment.verifiedMilestones += 1;

        emit MilestoneVerified(msg.sender, roadmapHash, milestoneIndex, proofHash);
    }

    /**
     * @notice Claim completion credential and withdraw commitment stake once all milestones are verified.
     */
    function claimStudyCredential(bytes32 roadmapHash) external nonReentrant {
        bytes32 key = _commitmentKey(msg.sender, roadmapHash);
        StudyCommitment storage commitment = _commitments[key];

        require(commitment.exists, "Commitment not found");
        require(commitment.student == msg.sender, "Not commitment owner");
        require(!commitment.claimed, "Credential already claimed");
        require(
            commitment.verifiedMilestones == commitment.totalMilestones,
            "All milestones must be verified"
        );

        commitment.claimed = true;
        uint256 refund = commitment.stakeAmount;
        commitment.stakeAmount = 0;

        if (refund > 0) {
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            require(success, "Stake transfer failed");
        }

        emit CredentialClaimed(
            msg.sender,
            roadmapHash,
            commitment.verifiedMilestones,
            refund
        );
    }

    function getCommitment(
        address student,
        bytes32 roadmapHash
    ) external view returns (StudyCommitment memory) {
        return _commitments[_commitmentKey(student, roadmapHash)];
    }

    function isMilestoneVerified(
        address student,
        bytes32 roadmapHash,
        uint256 milestoneIndex
    ) external view returns (bool) {
        return _verifiedMilestone[_commitmentKey(student, roadmapHash)][milestoneIndex];
    }
}
