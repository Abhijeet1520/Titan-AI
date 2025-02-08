"use client";
import Editor from "@monaco-editor/react";
import {
  AlertCircle,
  Blocks,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileCode,
  GitBranch,
  Layout,
  Plus,
  Send,
  Settings,
  Shield,
  Terminal,
  Trash2,
  Wallet,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import SplitPane from 'react-split-pane';
import Image from 'next/image';

/* -------------------------------------------------------------------
  TYPES & INTERFACES
---------------------------------------------------------------------*/
interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  agentId: string;          // which agent this message belongs to
  timestamp: Date;
  codeBlocks?: string[];
  securityChecks?: string[];
  aiSuggestions?: string[];
  status?: 'pending' | 'complete' | 'error';
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  expertise: string[];
}

interface ProjectType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  complexity: 'Low' | 'Medium' | 'High';
}

interface CodeFile {
  name: string;
  content: string;
  language: string;
  lastModified: Date;
}

interface ChatModel {
  id: string;
  name: string;
  description: string;
  features: string[];
  costLevel: 'Low' | 'Medium' | 'High';
}

/* -------------------------------------------------------------------
  MULTI-FILE EDITOR COMPONENT
  - Tabbed file editor using Monaco
---------------------------------------------------------------------*/
interface MultiFileEditorProps {
  files: CodeFile[];
  setFiles: React.Dispatch<React.SetStateAction<CodeFile[]>>;
  isFullscreen: boolean; // Whether the editor is expanded to full-screen
}

const MultiFileEditor: React.FC<MultiFileEditorProps> = ({
  files,
  setFiles,
  isFullscreen
}) => {
  // track which file is active
  const [activeTab, setActiveTab] = useState(0);

  const handleEditorChange = (value: string | undefined) => {
    if (!files[activeTab]) return;
    const updated = [...files];
    updated[activeTab] = {
      ...updated[activeTab],
      content: value || "",
      lastModified: new Date()
    };
    setFiles(updated);
  };

  return (
    <div className={`flex flex-col h-full relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Tabs with file info */}
      <div className="flex items-center border-b bg-gray-50 overflow-x-auto">
        <div className="flex-1 flex">
          {files.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-3 flex items-center gap-2 border-r min-w-[150px]
                ${activeTab === idx
                  ? 'bg-white border-b-2 border-b-blue-500 font-medium'
                  : 'hover:bg-gray-100'
                }`}
            >
              <FileCode className="w-4 h-4 text-gray-500" />
              <div className="flex flex-col items-start">
                <span className="text-sm truncate max-w-[100px]">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(file.lastModified).toLocaleTimeString()}
                </span>
              </div>
            </button>
          ))}
        </div>
        <div className="flex-shrink-0 border-l px-2">
          <button
            onClick={() => console.log("Add more settings for the editor if needed")}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Editor Settings"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative bg-gray-800">
        {files[activeTab] ? (
          <Editor
            height="100%"
            language={files[activeTab].language}
            theme="vs-dark"
            value={files[activeTab].content}
            onChange={handleEditorChange}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: true },
              scrollbar: { verticalScrollbarSize: 8 },
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              formatOnPaste: true,
              formatOnType: true
            }}
          />
        ) : (
          <div className="p-4 text-gray-500">No file selected.</div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------
  MAIN APP COMPONENT
  - Top bar with LLM dropdown and wallet
  - Left: Chat
  - Right: Editor on top, bottom has tabs (Requirements, Research, etc.)
  - Draggable/resizable using SplitPane
  ---------------------------------------------------------------------*/
function Home() {
  // State declarations
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('0x1234...5678');

  // Agents (multiple)
  const agents: Agent[] = [
    {
      id: 'research',
      name: 'Research Agent',
      description: 'Provides domain/market research & suggestions',
      icon: <Brain />,
      expertise: ['Market Analysis', 'Competitor Research', 'Trend Analysis', 'Risk Assessment']
    },
    {
      id: 'developer',
      name: 'Developer Agent',
      description: 'Implements the contract logic',
      icon: <Terminal />,
      expertise: ['Smart Contracts', 'Gas Optimization', 'Testing', 'Integration']
    },
    {
      id: 'auditor',
      name: 'Auditor Agent',
      description: 'Analyzes and audits the contract for vulnerabilities',
      icon: <Shield />,
      expertise: ['Security Analysis', 'Best Practices', 'Vulnerability Detection', 'Code Review']
    },
    {
      id: 'deployment',
      name: 'Deployment Specialist',
      description: 'Handles final deployment & verification steps',
      icon: <GitBranch />,
      expertise: ['Network Selection', 'Contract Verification', 'Gas Estimation', 'Deployment Strategy']
    }
  ];

  // Project types
  const projectTypes: ProjectType[] = [
    {
      id: 'defi',
      name: 'DeFi Protocol',
      description: 'Medium-High complexity staking or yield strategies',
      icon: <Database />,
      features: ['Multi-token Support', 'Yield Optimization', 'Flash Loans', 'Governance'],
      complexity: 'High'
    },
    {
      id: 'nft',
      name: 'NFT Platform',
      description: 'Minting, marketplace, and royalties',
      icon: <FileCode />,
      features: ['ERC-721/1155', 'Marketplace', 'Royalties', 'Metadata'],
      complexity: 'Medium'
    },
    {
      id: 'dao',
      name: 'DAO Framework',
      description: 'Governance tokens, proposals, and voting',
      icon: <Layout />,
      features: ['Token Voting', 'Proposal System', 'Treasury Management', 'Timelock'],
      complexity: 'High'
    }
  ];

  // Chat Model selection
  const chatModels: ChatModel[] = [
    {
      id: 'gpt-4',
      name: 'OpenAI GPT-4',
      description: 'Advanced reasoning model',
      features: ['Complex Problem Solving', 'Nuanced Understanding', 'Code Generation'],
      costLevel: 'High'
    },
    {
      id: 'gpt-3.5',
      name: 'OpenAI GPT-3.5',
      description: 'Faster, cost-effective solution',
      features: ['Quick Responses', 'Basic Code Help', 'Documentation'],
      costLevel: 'Low'
    },
    {
      id: 'custom-llm',
      name: 'Custom LLM',
      description: 'Bring-your-own fine-tuned model',
      features: ['Specialized Knowledge', 'Custom Training', 'Private Deployment'],
      costLevel: 'Medium'
    }
  ];

  const [selectedAgentId, setSelectedAgentId] = useState<string>('research');
  const [selectedProject, setSelectedProject] = useState('defi');
  const [selectedModel, setSelectedModel] = useState('gpt-4');

  // Chat messages for each agent
  const [agentMessages, setAgentMessages] = useState<{ [key: string]: Message[] }>({
    research: [],
    developer: [],
    auditor: [],
    deployment: []
  });

  // Requirements & contract generation
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [generatedContract, setGeneratedContract] = useState('');

  // Editor + Security analysis
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [latestSecurityChecks, setLatestSecurityChecks] = useState<string[]>([]);

  // AI suggestions - stored for the latest AI response
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // For toggling the Editor's fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Bottom Tabs: requirements, research, audit, deployment
  const bottomTabs = ['requirements', 'research', 'audit', 'deployment'] as const;
  type BottomTab = typeof bottomTabs[number];
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('requirements');

  /* ------------------------------------------------------------------
       generateContract: Create mock contract & populate editor
  --------------------------------------------------------------------*/
  useEffect(() => {
    const defaultReqs = [
      "Users can stake multiple token types for yield",
      "A reward pool is distributed every 7 days",
      "Penalties apply if users withdraw before the cycle ends",
      "Integrate a governance token for fee adjustments",
      "ReentrancyGuard to protect critical flows"
    ];
    setRequirements(defaultReqs);

  }, []);

  /* ------------------------------------------------------------------
       handleConnectWallet: Simulate connecting a user wallet
  --------------------------------------------------------------------*/
  const handleConnectWallet = async () => {
    setIsProcessing(true);
    try {
      // Simulated wallet connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsWalletConnected(true);
setWalletAddress('0x1234...5678');
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ------------------------------------------------------------------
       handleAddRequirement & handleRemoveRequirement
  --------------------------------------------------------------------*/
  const handleAddRequirement = () => {
    if (!currentRequirement.trim()) return;
    const updated = [...requirements, currentRequirement];
    setRequirements(updated);
    setCurrentRequirement('');
    generateContract(updated);
  };

  const handleRemoveRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    generateContract(updated);
  };

  /* ------------------------------------------------------------------
       generateContract: Create mock contract & populate editor
  --------------------------------------------------------------------*/
  const generateContract = (reqs?: string[]) => {
    const finalReqs = reqs || requirements;
    const bigDefiContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MyAdvancedDeFi
 * @dev Advanced DeFi protocol with multi-token staking and governance
 * Requirements:
${finalReqs.map((r, i) => ` * ${i + 1}. ${r}`).join('\n')}
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

    // Additional files for the editor
    const readmeContent = `# MyAdvancedDeFi Protocol

## Overview
This is a production-ready DeFi protocol implementing:
${finalReqs.map(r => `- ${r}`).join('\n')}

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

    const deployConfig = `// Deployment Configuration
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

    // Populate the editor with 3 files
    const initialFiles: CodeFile[] = [
      {
        name: "MyAdvancedDeFi.sol",
        content: bigDefiContract,
        language: "solidity",
        lastModified: new Date()
      },
      {
        name: "README.md",
        content: readmeContent,
        language: "markdown",
        lastModified: new Date()
      },
      {
        name: "deploy-config.js",
        content: deployConfig,
        language: "javascript",
        lastModified: new Date()
      }
    ];
    setFiles(initialFiles);

    const suggestions = [
      "Implement time-weighted rewards based on stake duration",
      "Add support for flash loan protection",
      "Consider implementing a progressive penalty system",
      "Add emergency pause mechanism with timelock",
      "Integrate with Chainlink price feeds for dynamic rewards"
    ];
    setAiSuggestions(suggestions);

    setLatestSecurityChecks([
      "✓ ReentrancyGuard implemented on state-changing functions",
      "✓ Proper access control with Ownable",
      "✓ Emergency pause functionality",
      "✓ Input validation on constructor",
      "✓ Safe math operations",
      "✓ Event emission for transparency",
      "✓ Bounds checking on penalty fee"
    ]);
  };

  /* ------------------------------------------------------------------
       handleSendMessage: Submits a user chat to the currently selected agent
  --------------------------------------------------------------------*/
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    const agentId = selectedAgentId;
    const oldMessages = agentMessages[agentId] || [];

    // user message
    const userMsg: Message = {
      id: oldMessages.length + 1,
      content: input,
      sender: 'user',
      agentId,
      timestamp: new Date(),
      status: 'complete'
    };

    // Mock AI "thinking"
    const processingMsg: Message = {
      id: oldMessages.length + 2,
      content: 'Analyzing your request...',
      sender: 'ai',
      agentId,
      timestamp: new Date(),
      status: 'pending'
    };

    setAgentMessages({
      ...agentMessages,
      [agentId]: [...oldMessages, userMsg, processingMsg]
    });

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const aiMsg: Message = {
      id: oldMessages.length + 2,
      content: `Here's an updated implementation based on your request. (Using ${selectedModel})`,
      sender: 'ai',
      agentId,
      timestamp: new Date(),
      codeBlocks: [generatedContract],
      securityChecks: latestSecurityChecks,
      aiSuggestions: aiSuggestions,
      status: 'complete'
    };

    setAgentMessages({
      ...agentMessages,
      [agentId]: [...oldMessages, userMsg, aiMsg]
    });

    setInput('');
    setIsProcessing(false);
  };

  /* ------------------------------------------------------------------
       handleDownloadContract: Let user download .sol file
  --------------------------------------------------------------------*/
  const handleDownloadContract = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContract], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'MyAdvancedDeFi.sol';
    document.body.appendChild(element);
    element.click();
  };

  /* ------------------------------------------------------------------
       Render
  --------------------------------------------------------------------*/
  const currentAgentChats = agentMessages[selectedAgentId] || [];
  const selectedAgentDetails = agents.find(a => a.id === selectedAgentId);
  const selectedProjectDetails = projectTypes.find(p => p.id === selectedProject);

  // Resizer styles
  const verticalResizerStyle: React.CSSProperties = {
    width: '8px',
    background: '#e2e8f0',
    cursor: 'col-resize',
    margin: '0 2px',
    zIndex: 1,
  };
  const horizontalResizerStyle: React.CSSProperties = {
    height: '4px',
    background: '#e2e8f0',
    cursor: 'row-resize',
    margin: '2px 0',
    zIndex: 1,
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar: LLM dropdown + Wallet Connect */}
      <div className="w-full h-14 flex items-center justify-between bg-white border-b px-4">
        <div className="flex items-center gap-3">
          <Image src="/android-chrome-192x192.png" alt="Titan AI Logo" width={32} height={32} />
          <span className="font-bold text-xl text-blue-600">Titan AI</span>

          {/* Project selection (Optional) */}
          <select
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              generateContract(requirements);
            }}
          >
            {projectTypes.map(pt => (
              <option key={pt.id} value={pt.id}>
                {pt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          {/* LLM Models Dropdown */}
          <div>
            <label className="mr-1 text-sm text-gray-600">Model:</label>
            <select
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {chatModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Connect Wallet Button */}
          <button
            onClick={handleConnectWallet}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isWalletConnected
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            } ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <Wallet className="w-4 h-4" />
            {isProcessing
              ? 'Connecting...'
              : isWalletConnected
                ? walletAddress
                : 'Connect Wallet'
            }
          </button>
        </div>
      </div>

      {/* Main Split: Left (Chat) | Right (Editor + Bottom Tabs) */}
      {/* @ts-ignore */}
      <SplitPane
        split="vertical"
        defaultSize="60%"
        minSize={300}
        resizerStyle={verticalResizerStyle}
        style={{ position: 'relative', flex: 1 }}
      >
        {/* LEFT: Chat Panel */}
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
          {/* Agent selection (optional) */}
          <div className="flex gap-2 p-3 border-b bg-gray-50">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${selectedAgentId === agent.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
              >
                {agent.icon}
                <span>{agent.name}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto">
            <div className="h-full w-full p-4 space-y-4">
                {currentAgentChats.map((message) => (
                <div
                key={message.id}
                className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
                >
                <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.sender === 'user'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
                }`}
                >
                {message.sender === 'user' ? (
                  <Zap className="w-5 h-5 text-blue-600" />
                ) : (
                  selectedAgentDetails?.icon || <Bot className="w-5 h-5 text-gray-600" />
                )}
                </div>

                <div
                className={`flex-1 max-w-[80%] ${
                  message.status === 'pending' ? 'opacity-70' : ''
                }`}
                >
                <div
                  className={`p-4 rounded-2xl ${
                  message.sender === 'user'
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-white border shadow-sm'
                  }`}
                >
                  {message.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>{message.content}</span>
                  </div>
                  ) : (
                  <>
                  <p className="text-sm lg:text-base">{message.content}</p>

                  {message.codeBlocks?.length ? (
                  <div className="mt-3 space-y-2">
                    {message.codeBlocks.map((block, idx) => (
                    <pre
                    key={idx}
                    className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs lg:text-sm overflow-x-auto"
                    >
                    {block}
                    </pre>
                    ))}
                  </div>
                  ) : null}

                  {/* AI suggestions */}
                  {message.securityChecks?.length ? (
                  <div className="mt-3 space-y-1.5">
                    {message.securityChecks.map((check, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{check}</span>
                    </div>
                    ))}
                  </div>
                  ) : null}

                  {message.aiSuggestions?.length ? (
                  <div className="mt-3 space-y-1.5">
                    {message.aiSuggestions.map((sug, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-blue-700">
                    <Zap className="w-4 h-4" />
                    <span>{sug}</span>
                    </div>
                    ))}
                  </div>
                  ) : null}
                  </>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                  {message.sender === 'ai' && selectedAgentDetails && (
                  <>
                  <span className="font-medium">{selectedAgentDetails.name}</span>
                  <span>•</span>
                  </>
                  )}
                  <span>
                  {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                </div>
                </div>
                ))}
              </div>
            </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${selectedAgentDetails?.name || 'AI'} anything...`}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing}
                className={`bg-blue-500 text-white p-2.5 rounded-xl transition-colors ${
                  isProcessing
                    ? 'opacity-75 cursor-not-allowed'
                    : 'hover:bg-blue-600'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Split horizontally => Top (Editor), Bottom (Tabs) */}
        {/* @ts-ignore */}
        <SplitPane
          split="horizontal"
          defaultSize="60%"
          minSize={150}
          resizerStyle={horizontalResizerStyle}
          style={{ position: 'relative' }}
        >
          {/* TOP: Editor Panel */}
          <div className="w-full h-full flex flex-col overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold text-gray-800">Smart Contract Editor</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadContract}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Download Contract"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Toggle Fullscreen"
                >
                  <Blocks className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <MultiFileEditor
                files={files}
                setFiles={setFiles}
                isFullscreen={isFullscreen}
              />
            </div>
          </div>

          {/* BOTTOM: TABS (Requirements, Research, Audit, Deployment) */}
          <div className="w-full h-full flex flex-col bg-white overflow-y-auto overflow-x-hidden">
            {/* Tab Bar */}
            <div className="flex items-center gap-2 border-b px-4 bg-gray-50">
              {bottomTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveBottomTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors
                    ${
                      activeBottomTab === tab
                        ? 'border-b-2 border-blue-500 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
              {/* REQUIREMENTS TAB */}
              {activeBottomTab === 'requirements' && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Project Requirements</h2>
                  <div className="mb-4 flex items-center gap-3">
                    <input
                      type="text"
                      value={currentRequirement}
                      onChange={(e) => setCurrentRequirement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                      placeholder="Add requirement..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={handleAddRequirement}
                      className="bg-blue-500 text-white p-2.5 rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* List each requirement vertically */}
                  {requirements.length > 0 && (
                    <ul className="space-y-3">
                      {requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                        >
                          <button
                            onClick={() => handleRemoveRequirement(idx)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <span className="text-gray-700 flex-1">{req}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* RESEARCH TAB */}
              {activeBottomTab === 'research' && (
                <div className="max-w-4xl">
                  <h2 className="text-lg font-semibold mb-3">
                    {selectedProjectDetails?.name} Analysis
                  </h2>

                  <div className="flex items-center justify-between mb-6">
                    <span className="text-gray-700">
                      {selectedProjectDetails?.description}
                    </span>
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${selectedProjectDetails?.complexity === 'High'
                        ? 'bg-red-100 text-red-700'
                        : selectedProjectDetails?.complexity === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }
                    `}>
                      {selectedProjectDetails?.complexity} Complexity
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h3 className="text-md font-semibold mb-4">Key Features</h3>
                      <ul className="space-y-2">
                        {selectedProjectDetails?.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h3 className="text-md font-semibold mb-4">Market Analysis</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Market Size</h4>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Current TVL</span>
                              <span className="font-medium">$1.2B</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                              <span className="text-gray-600">Growth Rate</span>
                              <span className="font-medium text-green-600">+15% MoM</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Competition</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                              <span>Aave</span>
                              <span className="font-medium">32% Market Share</span>
                            </div>
                            <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                              <span>Compound</span>
                              <span className="font-medium">28% Market Share</span>
                            </div>
                            <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                              <span>Others</span>
                              <span className="font-medium">40% Market Share</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                    <h3 className="text-md font-semibold mb-4">Risk Analysis</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                          <span className="font-medium">High Risk:</span>
                          <span className="ml-1">Smart contract vulnerabilities</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                          <span className="font-medium">Medium Risk:</span>
                          <span className="ml-1">Market volatility impact</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                        <div>
                          <span className="font-medium">Low Risk:</span>
                          <span className="ml-1">Regulatory compliance (with KYC)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-md font-semibold mb-4">Development Timeline</h3>
                    <div className="space-y-4">
                      <div className="relative pl-8 pb-8 border-l-2 border-blue-200">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500" />
                        <h4 className="font-medium text-gray-900">Phase 1: Smart Contract Development</h4>
                        <p className="text-sm text-gray-600 mt-1">2-3 weeks</p>
                      </div>
                      <div className="relative pl-8 pb-8 border-l-2 border-blue-200">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500" />
                        <h4 className="font-medium text-gray-900">Phase 2: Security Audit</h4>
                        <p className="text-sm text-gray-600 mt-1">2 weeks</p>
                      </div>
                      <div className="relative pl-8 pb-8 border-l-2 border-blue-200">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500" />
                        <h4 className="font-medium text-gray-900">Phase 3: Frontend Development</h4>
                        <p className="text-sm text-gray-600 mt-1">3-4 weeks</p>
                      </div>
                      <div className="relative pl-8">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500" />
                        <h4 className="font-medium text-gray-900">Phase 4: Testing & Deployment</h4>
                        <p className="text-sm text-gray-600 mt-1">1-2 weeks</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIT TAB (Security Analysis) */}
              {activeBottomTab === 'audit' && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Audit & Security Analysis</h2>
                  <p className="text-sm text-gray-500 mb-3">Below are the latest security checks:</p>
                  {latestSecurityChecks.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {latestSecurityChecks.map((check, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 bg-white rounded-lg border border-gray-100"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">{check}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Waiting for security analysis...</span>
                    </div>
                  )}
                </div>
              )}

              {/* DEPLOYMENT TAB */}
              {activeBottomTab === 'deployment' && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Deployment</h2>
                  <p className="text-sm text-gray-600">
                    (Placeholder) Prepare final deployment steps here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </SplitPane>
      </SplitPane>
    </div>
  );
}

export default Home;
