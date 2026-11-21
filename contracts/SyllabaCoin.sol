// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SyllabaCoin ($SYL)
 * @notice Official ERC-20 Learn-to-Earn token for Syllaba Academic Protocol on Base Sepolia (Chain ID 84532).
 * Students mint real $SYL ERC-20 tokens upon completing PPT modules and AI exams,
 * and burn $SYL tokens to unlock academic utility perks.
 */
contract SyllabaCoin {
    string public constant name = "Syllaba Coin";
    string public constant symbol = "SYL";
    uint8 public constant decimals = 18;

    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18;
    uint256 public constant MAX_SINGLE_CLAIM = 5_000;
    uint256 public constant MODULE_REWARD = 25 * 10 ** 16; // 0.25 SYL per graduated module

    uint256 public totalSupply;
    address public immutable deployer;
    address public immutable owner;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => mapping(bytes32 => bool)) private _claimedRewards;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event StudyRewardMinted(
        address indexed student,
        bytes32 indexed claimId,
        uint256 amountWei,
        string courseRef
    );
    event PerkRedeemed(
        address indexed student,
        string perkId,
        uint256 burnedWei
    );

    constructor() {
        deployer = msg.sender;
        owner = msg.sender;
        // Bootstrap initial genesis reserve (1,000 SYL) to deployer for testing/liquidity
        uint256 genesisAmount = 1_000 * 10 ** 18;
        totalSupply = genesisAmount;
        _balances[msg.sender] = genesisAmount;
        emit Transfer(address(0), msg.sender, genesisAmount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address tokenOwner, address spender) external view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "SYL: approve to zero address");
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "SYL: insufficient allowance");
        unchecked {
            _allowances[from][msg.sender] = currentAllowance - amount;
        }
        emit Approval(from, msg.sender, _allowances[from][msg.sender]);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Claim earned $SYL ERC-20 tokens for verified PPT/exam completion.
     * @param claimId Unique deterministic claim digest to prevent duplicate claims.
     * @param wholeTokens Number of whole $SYL tokens to mint (scaled by 10**18 internally).
     * @param courseRef Course title / roadmap reference.
     */
    function claimStudyReward(
        bytes32 claimId,
        uint256 wholeTokens,
        string calldata courseRef
    ) external returns (uint256) {
        require(claimId != bytes32(0), "SYL: invalid claimId");
        require(wholeTokens > 0 && wholeTokens <= MAX_SINGLE_CLAIM, "SYL: claim out of range");
        require(!_claimedRewards[msg.sender][claimId], "SYL: reward already claimed");

        uint256 mintAmount = wholeTokens * (10 ** uint256(decimals));
        require(totalSupply + mintAmount <= MAX_SUPPLY, "SYL: max supply exceeded");

        _claimedRewards[msg.sender][claimId] = true;
        totalSupply += mintAmount;
        _balances[msg.sender] += mintAmount;

        emit Transfer(address(0), msg.sender, mintAmount);
        emit StudyRewardMinted(msg.sender, claimId, mintAmount, courseRef);
        return mintAmount;
    }

    /**
     * @notice Distribute 0.25 $SYL reward to any graduating student via the protocol owner/relayer.
     */
    function rewardCompletedModule(address student) external {
        require(msg.sender == owner, "SYL: only owner");
        require(student != address(0), "SYL: zero student");
        require(totalSupply + MODULE_REWARD <= MAX_SUPPLY, "SYL: max supply exceeded");

        totalSupply += MODULE_REWARD;
        _balances[student] += MODULE_REWARD;

        emit Transfer(address(0), student, MODULE_REWARD);
        emit StudyRewardMinted(
            student,
            keccak256(abi.encodePacked(student, block.number, totalSupply)),
            MODULE_REWARD,
            "MODULE_GRADUATION_0_25_SYL"
        );
    }

    /**
     * @notice Burn $SYL ERC-20 tokens on-chain to redeem an academic utility perk.
     */
    function redeemPerk(
        string calldata perkId,
        uint256 wholeTokens
    ) external returns (bool) {
        require(wholeTokens > 0, "SYL: amount must be positive");
        uint256 burnAmount = wholeTokens * (10 ** uint256(decimals));
        require(_balances[msg.sender] >= burnAmount, "SYL: insufficient SYL balance");

        unchecked {
            _balances[msg.sender] -= burnAmount;
            totalSupply -= burnAmount;
        }

        emit Transfer(msg.sender, address(0), burnAmount);
        emit PerkRedeemed(msg.sender, perkId, burnAmount);
        return true;
    }

    function isRewardClaimed(address student, bytes32 claimId) external view returns (bool) {
        return _claimedRewards[student][claimId];
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "SYL: transfer from zero");
        require(to != address(0), "SYL: transfer to zero");
        require(_balances[from] >= amount, "SYL: balance too low");

        unchecked {
            _balances[from] -= amount;
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}
