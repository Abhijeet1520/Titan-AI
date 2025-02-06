"use client"
import React, { useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import {
  Send,
  Bot,
  FileCode,
  Shield,
  Zap,
  Blocks,
  Wallet,
  Brain,
  Layout,
  ChevronDown,
  Settings,
  Terminal,
  Database,
  GitBranch,
  Plus,
  Trash2,
  Download,
  Menu,
  XCircle
} from 'lucide-react';

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
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ProjectType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface CodeFile {
  name: string;
  content: string;
}

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

/* -------------------------------------------------------------------
  MULTI-FILE EDITOR COMPONENT
  - Tabbed file editor using Monaco
  - Displays a "Security Checks" panel at the bottom
---------------------------------------------------------------------*/
interface MultiFileEditorProps {
  files: CodeFile[];
  setFiles: React.Dispatch<React.SetStateAction<CodeFile[]>>;
  latestSecurityChecks: string[];  // Show latest checks for each AI output
}

const MultiFileEditor: React.FC<MultiFileEditorProps> = ({
  files,
  setFiles,
  latestSecurityChecks
}) => {
  // track which file is active
  const [activeTab, setActiveTab] = useState(0);

  const handleEditorChange = (value: string | undefined) => {
    if (!files[activeTab]) return;
    const updated = [...files];
    updated[activeTab].content = value || "";
    setFiles(updated);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b">
        {files.map((file, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 border-t border-l border-r 
              ${activeTab === idx ? "bg-white font-bold" : "bg-gray-200"}`}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative bg-gray-800">
        {files[activeTab] ? (
          <Editor
            height="100%"
            language={
              files[activeTab].name.endsWith('.sol')
                ? "solidity"
                : files[activeTab].name.endsWith('.md')
                ? "markdown"
                : "javascript"
            }
            theme="vs-dark"
            value={files[activeTab].content}
            onChange={handleEditorChange}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: true },
              scrollbar: { verticalScrollbarSize: 8 }
            }}
          />
        ) : (
          <div className="p-4 text-gray-500">
            No file selected.
          </div>
        )}
      </div>

      {/* Security Checks Panel */}
      <div className="bg-gray-100 p-4 border-t text-sm">
        <h3 className="font-semibold mb-2">Security Checks</h3>
        {latestSecurityChecks.length ? (
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {latestSecurityChecks.map((check, idx) => (
              <li key={idx}>{check}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No new checks found.</p>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------
  MAIN APP COMPONENT
  - Collapsible sidebar
  - Project-based approach
  - Chat with multiple agents under the same project
  - Research view for the selected project
  - Right side: multi-file editor
---------------------------------------------------------------------*/
function Home() {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Wallet
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Agents (multiple)
  const agents: Agent[] = [
    {
      id: 'research',
      name: 'Research Agent',
      description: 'Provides domain/market research & suggestions',
      icon: <Brain />
    },
    {
      id: 'developer',
      name: 'Developer Agent',
      description: 'Implements the contract logic',
      icon: <Terminal />
    },
    {
      id: 'auditor',
      name: 'Auditor Agent',
      description: 'Analyzes and audits the contract for vulnerabilities',
      icon: <Shield />
    },
    {
      id: 'deployment',
      name: 'Deployment Specialist',
      description: 'Handles final deployment & verification steps',
      icon: <GitBranch />
    }
  ];
  const [selectedAgentId, setSelectedAgentId] = useState<string>('research');

  // Project types
  const projectTypes: ProjectType[] = [
    {
      id: 'defi',
      name: 'DeFi Protocol',
      description: 'Medium-High complexity staking or yield strategies',
      icon: <Database />
    },
    {
      id: 'nft',
      name: 'NFT Platform',
      description: 'Minting, marketplace, and royalties',
      icon: <FileCode />
    },
    {
      id: 'dao',
      name: 'DAO Framework',
      description: 'Governance tokens, proposals, and voting',
      icon: <Layout />
    }
  ];
  const [selectedProject, setSelectedProject] = useState('defi');

  // Chat Model selection
  const chatModels: ChatModel[] = [
    { id: 'gpt-4', name: 'OpenAI GPT-4', description: 'Advanced reasoning model' },
    { id: 'gpt-3.5', name: 'OpenAI GPT-3.5', description: 'Faster, cost-effective solution' },
    { id: 'custom-llm', name: 'Custom LLM', description: 'Bring-your-own fine-tuned model' }
  ];
  const [selectedModel, setSelectedModel] = useState('gpt-4');

  // Research view toggle
  const [showResearchView, setShowResearchView] = useState(false);

  // Chat messages for each agent
  // We'll store them in a dictionary: agentId -> array of messages
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

  // Multi-file editor state
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [latestSecurityChecks, setLatestSecurityChecks] = useState<string[]>([]);

  // AI suggestions - stored for the latest AI response
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

/* ------------------------------------------------------------------
     useEffect: Initialize with an example project (DeFi),
     default agent (research), etc.
  --------------------------------------------------------------------*/
  useEffect(() => {
// Initialize requirements for a DeFi project
    const defaultReqs = [
      "Users can stake multiple token types for yield",
      "A reward pool is distributed every 7 days",
      "Penalties apply if users withdraw before the cycle ends",
      "Integrate a governance token for fee adjustments",
      "ReentrancyGuard to protect critical flows"
    ];
    setRequirements(defaultReqs);

    // Generate an initial contract
    generateContract(defaultReqs);
  }, []);

/* ------------------------------------------------------------------
     handleConnectWallet: Simulate connecting a user wallet
  --------------------------------------------------------------------*/
  const handleConnectWallet = () => {
    setIsWalletConnected(true);
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
    const bigDefiContract = `// DeFi Protocol Contract (Advanced Example)
// Requirements:
${finalReqs.map((r, i) => `// ${i + 1}. ${r}`).join('\n')}

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Example advanced contract with multiple tokens & governance
contract MyAdvancedDeFi is ReentrancyGuard {
    IERC20 public stakeTokenA;
    IERC20 public stakeTokenB;
    address public governanceToken; // For voting/fee adjustments
    
    struct UserInfo {
        uint256 amountA;    // Staked amount of Token A
        uint256 amountB;    // Staked amount of Token B
        uint256 lastStakeTime;
    }

    mapping(address => UserInfo) public userInfo;
    uint256 public rewardPool;
    uint256 public penaltyPeriod = 7 days;
    uint256 public penaltyFee = 10; // 10%
    
    constructor(address _tokenA, address _tokenB, uint256 _initialRewards) {
        stakeTokenA = IERC20(_tokenA);
        stakeTokenB = IERC20(_tokenB);
        rewardPool = _initialRewards;
    }

    function stake(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake zero tokens.");
        UserInfo storage user = userInfo[msg.sender];

        if (token == address(stakeTokenA)) {
            stakeTokenA.transferFrom(msg.sender, address(this), amount);
            user.amountA += amount;
        } else if (token == address(stakeTokenB)) {
            stakeTokenB.transferFrom(msg.sender, address(this), amount);
            user.amountB += amount;
        } else {
            revert("Unsupported staking token");
        }

        user.lastStakeTime = block.timestamp;
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        if (token == address(stakeTokenA)) {
            require(amount <= user.amountA, "Not enough staked token A.");
            user.amountA -= amount;
            _applyPenaltyAndTransfer(stakeTokenA, msg.sender, amount);
        } else if (token == address(stakeTokenB)) {
            require(amount <= user.amountB, "Not enough staked token B.");
            user.amountB -= amount;
            _applyPenaltyAndTransfer(stakeTokenB, msg.sender, amount);
        } else {
            revert("Unsupported token withdrawal");
        }
    }

    function claimRewards() external nonReentrant {
        // Implementation example:
        // - Calculate user share
        // - Transfer from rewardPool
    }

    function _applyPenaltyAndTransfer(IERC20 token, address to, uint256 amount) internal {
        UserInfo storage user = userInfo[to];
        uint256 fee = 0;
        if (block.timestamp < user.lastStakeTime + penaltyPeriod) {
            fee = (amount * penaltyFee) / 100;
        }
        uint256 finalAmount = amount - fee;
        token.transfer(to, finalAmount);
// The fee could remain in the contract or be distributed.
    }
}`;

    setGeneratedContract(bigDefiContract);

// Populate the editor with 3 files
    const initialFiles: CodeFile[] = [
      { name: "MyAdvancedDeFi.sol", content: bigDefiContract },
      {
        name: "README.md",
        content: `# MyAdvancedDeFi
This contract was generated for a more advanced DeFi scenario:
- ${finalReqs.join("\n- ")}
      
Includes multi-token staking, a penalty period, partial governance integration.`
      },
      {
        name: "deploy-config.js",
        content: `// Example deployment config
module.exports = {
  network: "goerli",
  tokenA: "0xTokenA...",
  tokenB: "0xTokenB...",
  initialRewards: "1000000000000000000000" // 1,000 tokens worth in Wei
};`
      }
    ];
    setFiles(initialFiles);

// Basic suggestions
    const suggestions = [
      "Implement a governance-based function to adjust penaltyFee.",
      "Extend reward logic to multiple distribution schedules.",
      "Consider Oracle integration for dynamic reward rates."
    ];
    setAiSuggestions(suggestions);
  };

/* ------------------------------------------------------------------
     handleSendMessage: Submits a user chat to the currently selected agent
  --------------------------------------------------------------------*/
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const agentId = selectedAgentId; // whichever agent we're talking to
    const oldMessages = agentMessages[agentId] || [];

// user message
    const userMsg: Message = {
      id: oldMessages.length + 1,
      content: input,
      sender: 'user',
      agentId,
      timestamp: new Date()
    };

// Mock AI response referencing the chosen model
    const aiMsg: Message = {
      id: oldMessages.length + 2,
      content: `Here's an updated snippet. (Model: ${selectedModel}) Please check the code editor for changes.`,
      sender: 'ai',
      agentId,
      timestamp: new Date(),
      codeBlocks: [generatedContract || '// No generated contract yet'],
      securityChecks: ['✓ Reentrancy Guard', '✓ Integer Overflow Checks'],
      aiSuggestions: aiSuggestions.length
        ? aiSuggestions
        : ["Consider implementing time-locked governance proposals."]
    };

    // Store them
    const newMessages = [...oldMessages, userMsg, aiMsg];
    setAgentMessages({
      ...agentMessages,
      [agentId]: newMessages
    });

    // Update security checks for the editor's bottom panel
    setLatestSecurityChecks(aiMsg.securityChecks || []);

    // Clear input
    setInput('');
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
  // Current agent's chat
  const currentAgentChats = agentMessages[selectedAgentId] || [];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      {/* Sidebar - Collapses on mobile */}
      <div
        className={`${
          sidebarOpen ? 'w-full lg:w-64' : 'w-16'
        } bg-white border-r shadow-md flex-shrink-0 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'h-screen lg:h-auto fixed lg:relative z-50' : ''
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <Blocks className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-xl text-blue-600">SmartAI</span>
            </div>
          ) : (
            <Blocks className="w-6 h-6 text-blue-600" />
          )}
          {/* Toggle Button */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? (
              <XCircle className="w-5 h-5 text-gray-500" />
            ) : (
              <Menu className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Wallet Connect */}
        <div className="p-4 flex items-center">
          <button
            onClick={handleConnectWallet}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
              isWalletConnected 
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            {sidebarOpen && (isWalletConnected ? 'Connected' : 'Connect')}
          </button>
        </div>

        {/* Project Types */}
        <div className="px-4">
          {sidebarOpen && <h3 className="text-sm font-semibold mb-2">Projects</h3>}
          <div className="space-y-2 mb-4">
            {projectTypes.map(type => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedProject(type.id);
                  generateContract(requirements);
                  setShowResearchView(false); // reset research view if project changes
                }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left ${
                  selectedProject === type.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 text-blue-600">{type.icon}</div>
                {sidebarOpen && (
                  <span className="text-sm">{type.name}</span>
                )}
              </button>
            ))}
          </div>

          {/* Agents */}
          {sidebarOpen && <h3 className="text-sm font-semibold mb-2">Agents</h3>}
          <div className="space-y-2 mb-4">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setShowResearchView(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left ${
                  selectedAgentId === agent.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 text-blue-600">{agent.icon}</div>
                {sidebarOpen && (
                  <span className="text-sm">{agent.name}</span>
                )}
              </button>
            ))}
          </div>

          {/* Chat Model */}
          {sidebarOpen && <h3 className="text-sm font-semibold mb-2">Chat Model</h3>}
          <div className="space-y-2 mb-4">
            {chatModels.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id);
                }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left ${
                  selectedModel === model.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 text-gray-600">
                  <Terminal />
                </div>
                {sidebarOpen && (
                  <span className="text-sm">{model.name}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="mt-auto p-4 flex flex-col gap-2">
          {/* Toggle research button */}
          <button
            onClick={() => setShowResearchView(!showResearchView)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50"
          >
            <FileCode className="w-4 h-4 text-gray-600" />
            {sidebarOpen && <span className="text-sm">Research</span>}
          </button>

          {/* Placeholder settings */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50">
            <Settings className="w-4 h-4 text-gray-600" />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {showResearchView ? (
          <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <h1 className="text-2xl lg:text-3xl font-bold mb-4">
              Research for Project: {selectedProject.toUpperCase()}
            </h1>
            <p className="mb-6 text-gray-700">
              {/* You can dynamically load or generate research data here. For now, just a placeholder. */}
              This is where in-depth market or technical research would appear, relevant to the current project type. 
              For a DeFi Protocol, you might display competitor analysis, yield strategies, or tokenomics references.
            </p>
            <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
              <h2 className="font-semibold">SWOT Analysis (Example)</h2>
              <ul className="list-disc list-inside">
                <li><strong>Strengths:</strong> High composability, global liquidity, permissionless usage.</li>
                <li><strong>Weaknesses:</strong> Smart contract exploits, volatility, complex UI for newcomers.</li>
                <li><strong>Opportunities:</strong> Growing DeFi adoption, potential to partner with stablecoin providers.</li>
                <li><strong>Threats:</strong> Regulatory clampdowns, black swan market events, high competition.</li>
              </ul>

              <h2 className="font-semibold">PESTEL Analysis (Example)</h2>
              <ul className="list-disc list-inside">
                <li><strong>Political:</strong> Varying regulations on DeFi worldwide.</li>
                <li><strong>Economic:</strong> Market downturns can reduce user appetite for staking.</li>
                <li><strong>Social:</strong> Younger demographics leaning more into crypto investments.</li>
                <li><strong>Technological:</strong> Layer-2 solutions improving scalability.</li>
                <li><strong>Environmental:</strong> PoS transitions helping reduce energy usage.</li>
                <li><strong>Legal:</strong> KYC/AML issues for large pools or institutional adoption.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Requirements input - Full width on mobile */}
            <div className="p-3 lg:p-4 bg-white border-b flex items-center gap-2">
              <input
                type="text"
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                placeholder="Add requirement..."
                className="flex-1 p-2 lg:p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
              />
              <button
                onClick={handleAddRequirement}
                className="bg-blue-500 text-white p-2 lg:p-3 rounded-xl hover:bg-blue-600 transition-colors flex-shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4">
              {currentAgentChats.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                  >
                    {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    {message.sender === 'user' ? (
                      <Zap className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600" />
                    )}
                  </div>

{/* Message content */}
                  <div
                    className={`p-3 rounded-xl max-w-[85%] lg:max-w-[75%] ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm lg:text-base">{message.content}</p>

                    {/* Code snippet(s) */}
                    {message.codeBlocks?.length ? (
                      <pre className="mt-2 bg-gray-800 text-green-200 p-2 rounded-md text-xs overflow-x-auto">
                        {message.codeBlocks.join("\n")}
                      </pre>
                    ) : null}

                    {/* AI suggestions */}
                    {message.aiSuggestions?.length ? (
                      <ul className="mt-2 text-xs lg:text-sm text-yellow-800 list-disc list-inside">
                        {message.aiSuggestions.map((sug, idx) => (
                          <li key={idx}>{sug}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input - Fixed at bottom */}
            <form onSubmit={handleSendMessage} className="p-3 lg:p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 lg:p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 lg:p-3 rounded-xl hover:bg-blue-600 transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Right Panel - Editor - Collapses to full width on mobile */}
      <div className="w-full lg:w-[36rem] bg-white border-l shadow-md flex flex-col h-screen">
        {/* Editor Header */}
        <div className="flex items-center justify-between p-3 lg:p-4 border-b">
          <h2 className="font-semibold text-gray-800">Code Editor</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadContract}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Monaco Editor + Security Panel */}
        <div className="flex-1">
          <MultiFileEditor
            files={files}
            setFiles={setFiles}
            latestSecurityChecks={latestSecurityChecks}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
