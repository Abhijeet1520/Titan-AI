import { defaultRequirements } from "./defaultRequirements";

// finalReqs = defaultRequirements;
const finalReqs = defaultRequirements;

export const bigDefiContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MyAdvancedDeFi
 * @dev Advanced DeFi protocol with multi-token staking and governance
 * Requirements:
${finalReqs.map((r, i) => ` * ${i + 1}. ${r}`).join("\n")}
 */
contract MyAdvancedDeFi is ReentrancyGuard, Ownable, Pausable {
    IERC20 public stakeTokenA;
    IERC20 public stakeTokenB;
    IERC20 public governanceToken;

    struct UserInfo {
        uint256 amountA;
        uint256 amountB;
        uint256 lastStakeTime;
        uint256 rewardDebt;
    }

    mapping(address => UserInfo) public userInfo;
    uint256 public rewardPool;
    uint256 public penaltyPeriod = 7 days;
    uint256 public penaltyFee = 10;
    uint256 public constant PRECISION = 1e18;

    event Staked(address indexed user, address token, uint256 amount);
    event Withdrawn(address indexed user, address token, uint256 amount, uint256 penalty);
    event RewardsClaimed(address indexed user, uint256 amount);
    event PenaltyUpdated(uint256 oldFee, uint256 newFee);

    constructor(
        address _tokenA,
        address _tokenB,
        address _govToken,
        uint256 _initialRewards
    ) {
        require(_tokenA != address(0), "Invalid token A address");
        require(_tokenB != address(0), "Invalid token B address");
        require(_govToken != address(0), "Invalid governance token address");

        stakeTokenA = IERC20(_tokenA);
        stakeTokenB = IERC20(_tokenB);
        governanceToken = IERC20(_govToken);
        rewardPool = _initialRewards;
    }

    modifier validateToken(address token) {
        require(
            token == address(stakeTokenA) || token == address(stakeTokenB),
            "Unsupported token"
        );
        _;
    }

    function stake(address token, uint256 amount)
        external
        nonReentrant
        validateToken(token)
        whenNotPaused
    {
        require(amount > 0, "Cannot stake zero tokens");
        UserInfo storage user = userInfo[msg.sender];

        if (token == address(stakeTokenA)) {
            stakeTokenA.transferFrom(msg.sender, address(this), amount);
            user.amountA += amount;
        } else {
            stakeTokenB.transferFrom(msg.sender, address(this), amount);
            user.amountB += amount;
        }

        user.lastStakeTime = block.timestamp;
        emit Staked(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount)
        external
        nonReentrant
        validateToken(token)
        whenNotPaused
    {
        UserInfo storage user = userInfo[msg.sender];
        require(
            token == address(stakeTokenA) ? amount <= user.amountA : amount <= user.amountB,
            "Insufficient balance"
        );

        if (token == address(stakeTokenA)) {
            user.amountA -= amount;
        } else {
            user.amountB -= amount;
        }

        uint256 penalty = _calculatePenalty(user, amount);
        uint256 finalAmount = amount - penalty;

        IERC20(token).transfer(msg.sender, finalAmount);
        if (penalty > 0) {
            IERC20(token).transfer(address(this), penalty);
        }

        emit Withdrawn(msg.sender, token, amount, penalty);
    }

    function claimRewards() external nonReentrant whenNotPaused {
        UserInfo storage user = userInfo[msg.sender];
        uint256 pending = _calculateRewards(msg.sender);
        require(pending > 0, "No rewards to claim");

        user.rewardDebt = block.timestamp;
        rewardPool -= pending;

        require(
            governanceToken.transfer(msg.sender, pending),
            "Reward transfer failed"
        );

        emit RewardsClaimed(msg.sender, pending);
    }

    function _calculatePenalty(UserInfo memory user, uint256 amount)
        internal
        view
        returns (uint256)
    {
        if (block.timestamp < user.lastStakeTime + penaltyPeriod) {
            return (amount * penaltyFee) / 100;
        }
        return 0;
    }

    function _calculateRewards(address _user) internal view returns (uint256) {
        UserInfo memory userInfo = userInfo[_user];
        uint256 timeElapsed = block.timestamp - userInfo.rewardDebt;
        uint256 totalStaked = userInfo.amountA + userInfo.amountB;

        if (timeElapsed == 0 || totalStaked == 0) return 0;

        return (totalStaked * timeElapsed * PRECISION) / (7 days);
    }

    // Governance functions
    function updatePenaltyFee(uint256 newFee) external {
        require(
            governanceToken.balanceOf(msg.sender) >= 1000 * PRECISION,
            "Insufficient governance tokens"
        );
        require(newFee <= 20, "Fee too high");

        emit PenaltyUpdated(penaltyFee, newFee);
        penaltyFee = newFee;
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address token) external nonReentrant {
        require(paused(), "Protocol must be paused");
        UserInfo storage user = userInfo[msg.sender];

        uint256 amount = token == address(stakeTokenA) ? user.amountA : user.amountB;
        require(amount > 0, "No tokens to withdraw");

        if (token == address(stakeTokenA)) {
            user.amountA = 0;
        } else {
            user.amountB = 0;
        }

        IERC20(token).transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, token, amount, 0);
    }
}`;

export const readmeContent = `# MyAdvancedDeFi Protocol

## Overview
This is a production-ready DeFi protocol implementing:
${finalReqs.map((r) => `- ${r}`).join("\n")}

## Features
- Multi-token staking support
- Time-based rewards distribution
- Early withdrawal penalties
- Governance integration
- Emergency withdrawal mechanism
- Comprehensive security measures

## Security Features
- ReentrancyGuard for all state-changing functions
- Pausable for emergency situations
- Precise mathematical calculations
- Event emission for transparency
- Input validation and bounds checking

## Deployment
1. Deploy governance token
2. Deploy staking tokens (if new)
3. Deploy main contract with:
   - Token A address
   - Token B address
   - Governance token address
   - Initial rewards amount

## Testing
Run full test suite before deployment:
\`\`\`bash
npx hardhat test
npx hardhat coverage
\`\`\`

## Audit Status
Pending security audit. Key areas to review:
- Reward calculation precision
- Withdrawal penalty logic
- Governance token integration
- Emergency procedures`;

export const deployConfig = `// Deployment Configuration
module.exports = {
  // Network selection
  network: "goerli",

  // Contract addresses
  tokenA: "0xTokenA...",  // Staking token A
  tokenB: "0xTokenB...",  // Staking token B
  govToken: "0xGov...",   // Governance token

  // Initial parameters
  initialRewards: "1000000000000000000000", // 1,000 tokens (18 decimals)

  // Verification settings
  verify: true,

  // Constructor arguments
  constructorArgs: [
    "0xTokenA...",
    "0xTokenB...",
    "0xGov...",
    "1000000000000000000000"
  ],

  // Gas settings
  gasPrice: "auto",
  gasLimit: 5000000
};`;
