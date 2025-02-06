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
  Download
} from 'lucide-react';

/* -------------------------------------------------------------------
  TYPES & INTERFACES
   - For messages, AI agents, project types, file data, etc.
---------------------------------------------------------------------*/

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  agentType?: string;
  timestamp: Date;
  codeBlocks?: string[];      // Possibly store multiple code snippets from AI
  securityChecks?: string[];  // Store a list of recommended security checks
  aiSuggestions?: string[];   // Additional AI suggestions or tips
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
   - Displays tabs for each file (Solidity, README, configs, etc.)
   - Uses Monaco Editor for advanced code editing
---------------------------------------------------------------------*/
interface MultiFileEditorProps {
  files: CodeFile[];
  setFiles: React.Dispatch<React.SetStateAction<CodeFile[]>>;
}

const MultiFileEditor: React.FC<MultiFileEditorProps> = ({ files, setFiles }) => {
  // Tracks which file (tab) is currently active
  const [activeTab, setActiveTab] = useState(0);

  // Called whenever the editor value changes
  const handleEditorChange = (value: string | undefined) => {
    const updatedFiles = [...files];
    updatedFiles[activeTab].content = value || "";
    setFiles(updatedFiles);
  };

  return (
    <div className="flex flex-col h-full">
      {/* File Tab Navigation */}
      <div className="flex border-b">
        {files.map((file, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 border-t border-l border-r ${
              activeTab === idx ? "bg-white font-bold" : "bg-gray-200"
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
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
            options={{ automaticLayout: true }}
          />
        ) : (
          <div className="p-4 text-gray-500">
            No file selected.
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------
  MAIN APP COMPONENT
   - Manages states for project, agent, chat model, user input, etc.
   - Displays the initial config UI or the expanded UI with chat + editor
---------------------------------------------------------------------*/

function App() {
  /* -----------------------
     Primary UI states
  -------------------------*/
  const [isExpanded, setIsExpanded] = useState(false);        // Whether we've expanded to chat + editor
  const [messages, setMessages] = useState<Message[]>([]);    // Chat messages
  const [input, setInput] = useState('');                     // Current input typed by user
  const [selectedAgent, setSelectedAgent] = useState<string>(''); // Which AI agent (e.g., Security Auditor)
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showAgentSelect, setShowAgentSelect] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);

  /* ------------------------------------------------------------------
     Requirements & Contract Generation
  --------------------------------------------------------------------*/
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [generatedContract, setGeneratedContract] = useState('');

  /* ------------------------------------------------------------------
     Multi-file editor state
  --------------------------------------------------------------------*/
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  /* ------------------------------------------------------------------
     Agents, Project Types, and Chat Models
       - Hardcoded for demonstration, but can be fetched or expanded
  --------------------------------------------------------------------*/
  const agents: Agent[] = [
    {
      id: 'architect',
      name: 'Smart Contract Architect',
      description: 'Designs and optimizes contract architecture',
      icon: <Brain />
    },
    {
      id: 'security',
      name: 'Security Auditor',
      description: 'Analyzes contracts for vulnerabilities',
      icon: <Shield />
    },
    {
      id: 'developer',
      name: 'Contract Developer',
      description: 'Implements and tests smart contracts',
      icon: <Terminal />
    },
    {
      id: 'deployment',
      name: 'Deployment Specialist',
      description: 'Handles contract deployment and verification',
      icon: <GitBranch />
    }
  ];

  // A “medium-difficulty” example: A DeFi protocol
  const projectTypes: ProjectType[] = [
    {
      id: 'defi',
      name: 'DeFi Protocol',
      description: 'Build decentralized finance applications (medium complexity)',
      icon: <Database />
    },
    {
      id: 'nft',
      name: 'NFT Platform',
      description: 'Create NFT minting and marketplace solutions',
      icon: <FileCode />
    },
    {
      id: 'dao',
      name: 'DAO Framework',
      description: 'Develop decentralized autonomous organizations',
      icon: <Layout />
    }
  ];

  // Example chat model selection
  const chatModels: ChatModel[] = [
    {
      id: 'gpt-4',
      name: 'OpenAI GPT-4',
      description: 'Most advanced model by OpenAI'
    },
    {
      id: 'gpt-3.5',
      name: 'OpenAI GPT-3.5',
      description: 'Streamlined for speed and cost'
    },
    {
      id: 'custom-llm',
      name: 'Custom LLM',
      description: 'Your own fine-tuned model'
    }
  ];
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4'); // default model

  /* ------------------------------------------------------------------
     Pre-fill data once on mount:
       - Preselect DeFi project (medium difficulty)
       - Preselect an agent
       - Populate default DeFi-related requirements
       - Generate initial code
  --------------------------------------------------------------------*/
  useEffect(() => {
    // Preselect DeFi Protocol as an example
    setSelectedProject('defi');

    // Preselect the Architect agent
    setSelectedAgent('architect');

    // Pre-populate some "medium-difficulty" DeFi requirements
    const defaultRequirements = [
      'Users can stake tokens to earn yield',
      'A reward pool is automatically distributed',
      'Implement a penalty for early withdrawals',
      'Ensure reentrancy protection on critical functions'
    ];
    setRequirements(defaultRequirements);

    // Generate an initial contract based on these requirements
    generateContract(defaultRequirements);
  }, []);

  /* ------------------------------------------------------------------
     FUNCTION: addRequirement
       - Adds a new requirement to the list
  --------------------------------------------------------------------*/
  const addRequirement = () => {
    if (!currentRequirement.trim()) return;
    const updated = [...requirements, currentRequirement];
    setRequirements(updated);
    setCurrentRequirement('');
    generateContract(updated);
  };

  /* ------------------------------------------------------------------
     FUNCTION: removeRequirement
       - Removes a requirement from the list by index
  --------------------------------------------------------------------*/
  const removeRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    generateContract(updated);
  };

  /* ------------------------------------------------------------------
     FUNCTION: generateContract
       - Produces a mock DeFi smart contract based on listed requirements
       - Updates multi-file editor state with multiple files
  --------------------------------------------------------------------*/
  const generateContract = (reqs?: string[]) => {
    const finalReqs = reqs || requirements;

    // The contract below is just a mock for demonstration
    const contractCode = `// Generated DeFi Smart Contract
// Requirements:
${finalReqs.map((r, i) => `// ${i + 1}. ${r}`).join('\n')}

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MyDeFiProtocol is ReentrancyGuard {
    IERC20 public stakeToken;

    // A record of each user's staked balance
    mapping(address => uint256) public stakedBalance;

    // Define a reward pool and distribution rules
    uint256 public rewardPool;
    uint256 public earlyWithdrawalFee = 10; // 10%

    constructor(address _token) {
        stakeToken = IERC20(_token);
        // Initialize reward pool or other logic
        rewardPool = 1000000 ether; // Example large reward pool
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake zero tokens.");
        stakeToken.transferFrom(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        // Additional logic for user shares
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount <= stakedBalance[msg.sender], "Not enough staked tokens.");
        // If withdrawing early, apply fee
        uint256 fee = (amount * earlyWithdrawalFee) / 100;
        uint256 finalAmount = amount - fee;
        
        stakedBalance[msg.sender] -= amount;
        stakeToken.transfer(msg.sender, finalAmount);
        // Fee could be sent to treasury or burned
    }

    function claimRewards() external nonReentrant {
        // Distribute yield from rewardPool
        // Implementation depends on staked share
    }

    // Additional recommended functions / events:
    // - function setEarlyWithdrawalFee(uint256 fee) external onlyOwner
    // - function depositRewards(uint256 amount) external onlyOwner
    // - function emergencyWithdraw() external onlyOwner
}`;

    setGeneratedContract(contractCode);

    // Update the multi-file editor with new files
    const initialFiles: CodeFile[] = [
      { name: "MyDeFiProtocol.sol", content: contractCode },
      { 
        name: "README.md",
        content: `# MyDeFiProtocol
This contract was generated with the following requirements:
- ${finalReqs.join("\n- ")}

**Key Features**:
1. Users can stake tokens.
2. Automatic reward pool distribution.
3. Early withdrawal penalty.
4. Reentrancy protection to secure critical flows.

**Recommended Tools**:
- OpenZeppelin libraries (ReentrancyGuard, IERC20).
- Hardhat/Truffle for testing/deployment.
        ` 
      },
      { 
        name: "config.js",
        content: `// Example Deployment Configuration
module.exports = {
  network: "goerli",
  contractName: "MyDeFiProtocol",
  constructorArgs: ["0xTokenContractAddressHere"],
};`
      }
    ];
    setFiles(initialFiles);

    // Provide some mock AI suggestions
    const suggestions = [
      'Consider implementing a yield farming strategy with multiple tokens.',
      'Utilize a time-based lockup period for staked tokens.',
      'Add a governance module to allow community-driven fee adjustments.'
    ];
    setAiSuggestions(suggestions);
  };

  /* ------------------------------------------------------------------
     FUNCTION: handleSend
       - Handles the user pressing "Send" in the chat
       - Creates a user message and an AI response with code blocks
  --------------------------------------------------------------------*/
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // User message
    const newMessage: Message = {
      id: messages.length + 1,
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    // AI response uses the latest contract snippet and suggestions
    const aiResponse: Message = {
      id: messages.length + 2,
      content: `Here's an updated contract snippet based on your input (Model: ${selectedModel}). Check out the multi-file editor for all files!`,
      sender: 'ai',
      agentType: selectedAgent,
      timestamp: new Date(),
      codeBlocks: [generatedContract || '// No generated contract yet'],
      securityChecks: ['✓ Reentrancy Guard', '✓ Integer Overflow Protection'],
      aiSuggestions: aiSuggestions.length > 0 ? aiSuggestions : [
        'Use robust math libraries for safe arithmetic operations.'
      ]
    };

    // Append messages to chat
    setMessages([...messages, newMessage, aiResponse]);
    setInput('');

    // Expand the UI to chat+editor view if not already
    setIsExpanded(true);
  };

  /* ------------------------------------------------------------------
     FUNCTION: handleConnectWallet
       - Simulates connecting to a crypto wallet
  --------------------------------------------------------------------*/
  const handleConnectWallet = () => {
    setIsWalletConnected(true);
  };

  /* ------------------------------------------------------------------
     FUNCTION: downloadContract
       - Lets user download the main .sol file
  --------------------------------------------------------------------*/
  const downloadContract = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContract], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'MyDeFiProtocol.sol';
    document.body.appendChild(element);
    element.click();
  };

  /* ------------------------------------------------------------------
     RESEARCH SECTION
       - For showing additional analyses like SWOT, PESTEL, etc.
       - Could be expanded with more dynamic content in the future
  --------------------------------------------------------------------*/
  const [showResearch, setShowResearch] = useState(false);

  const swotAnalysis = {
    strengths: [
      "Transparency through smart contracts",
      "Global reach and 24/7 availability",
      "High composability with DeFi ecosystem"
    ],
    weaknesses: [
      "Smart contract security risks",
      "Volatile crypto market conditions",
      "Complex UX for non-crypto users"
    ],
    opportunities: [
      "Regulatory clarity could boost adoption",
      "Partnerships with existing DeFi protocols",
      "Growing institutional interest in yield strategies"
    ],
    threats: [
      "Harsh regulations or outright bans",
      "Smart contract exploits/hacks",
      "Market saturation and competition"
    ]
  };

  const pestelAnalysis = {
    political: "Regulations on DeFi vary widely. Potential for increased scrutiny.",
    economic: "Crypto markets are highly volatile, influencing user engagement.",
    social: "Growing acceptance of decentralized finance among younger demographics.",
    technological: "Advances in Layer-2 solutions reduce fees and increase scalability.",
    environmental: "Energy consumption remains a concern, though many blockchains are moving to PoS.",
    legal: "KYC/AML compliance might become necessary for yield protocols."
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ----------------------------------------------------------------
          PAGE HEADER: Wallet Connection & Branding
      ----------------------------------------------------------------- */}
      <div className="fixed top-0 right-0 p-6 flex items-center gap-4">
        {/* Connect Wallet Button */}
        <button
          onClick={handleConnectWallet}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isWalletConnected 
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          <Wallet className="w-5 h-5" />
          {isWalletConnected ? 'Connected' : 'Connect Wallet'}
        </button>

        {/* Branding */}
        <div className="flex items-center gap-2">
          <Blocks className="w-8 h-8 text-blue-600" />
          <span className="font-bold text-xl text-blue-600">SmartAI</span>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          MAIN CONTENT
            - If not expanded, show initial config (project, agent, model, requirements)
            - If expanded, show chat + editor
      ----------------------------------------------------------------- */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {!isExpanded ? (
          /* -------------------------------------------------------------
             INITIAL CONFIGURATION VIEW
             - Project type, AI agent selection, chat model selection,
               contract requirements input
          --------------------------------------------------------------*/
          <div className="w-full max-w-3xl text-center space-y-8">
            <h1 className="text-4xl font-bold text-gray-800">Smart Contract Assistant</h1>

            {/* Project Type Selection */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {projectTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedProject(type.id)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedProject === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {type.icon}
                    </div>
                    <h3 className="font-semibold">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* AI Agent Selection */}
            <div className="relative mb-4">
              <button
                onClick={() => setShowAgentSelect(!showAgentSelect)}
                className="w-full p-4 rounded-xl border-2 border-gray-200 flex items-center justify-between hover:border-blue-200"
              >
                <span className="text-gray-700">
                  {selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : 'Select AI Agent'}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
              {showAgentSelect && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent.id);
                        setShowAgentSelect(false);
                      }}
                      className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {agent.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Model Selection */}
            <div className="relative mb-4">
              <button
                onClick={() => setShowModelSelect(!showModelSelect)}
                className="w-full p-4 rounded-xl border-2 border-gray-200 flex items-center justify-between hover:border-blue-200"
              >
                <span className="text-gray-700">
                  {selectedModel
                    ? chatModels.find(model => model.id === selectedModel)?.name 
                    : 'Select Chat Model'}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
              {showModelSelect && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                  {chatModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelSelect(false);
                      }}
                      className="w-full p-4 flex flex-col gap-1 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl text-left"
                    >
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-gray-500">
                        {model.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contract Requirements Input */}
            <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Contract Requirements</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  placeholder="Enter a requirement (e.g., 'Implement early withdrawal fee')"
                  className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addRequirement}
                  className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {requirements.length > 0 && (
                <ul className="space-y-2 text-left">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                      <span>{req}</span>
                      <button onClick={() => removeRequirement(index)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => generateContract()}
                className="mt-4 bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-colors w-full"
              >
                Generate Contract
              </button>
            </div>

            {/* Additional Chat Input */}
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                placeholder="Describe any additional requirements or ask for changes..."
                className="w-full p-6 rounded-2xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>

            {/* Toggle Research Section Button */}
            <button
              className="mt-6 text-sm underline text-blue-500"
              onClick={() => setShowResearch(!showResearch)}
            >
              {showResearch ? "Hide" : "View"} Research & Analysis
            </button>

            {/* Research & Analysis Section */}
            {showResearch && (
              <div className="bg-white p-6 rounded-2xl shadow-xl text-left mt-4">
                <h3 className="text-xl font-bold mb-2">SWOT Analysis</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <h4 className="font-semibold">Strengths</h4>
                    <ul className="list-disc ml-5">
                      {swotAnalysis.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Weaknesses</h4>
                    <ul className="list-disc ml-5">
                      {swotAnalysis.weaknesses.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Opportunities</h4>
                    <ul className="list-disc ml-5">
                      {swotAnalysis.opportunities.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Threats</h4>
                    <ul className="list-disc ml-5">
                      {swotAnalysis.threats.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">PESTEL Analysis</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Political:</strong> {pestelAnalysis.political}</p>
                  <p><strong>Economic:</strong> {pestelAnalysis.economic}</p>
                  <p><strong>Social:</strong> {pestelAnalysis.social}</p>
                  <p><strong>Technological:</strong> {pestelAnalysis.technological}</p>
                  <p><strong>Environmental:</strong> {pestelAnalysis.environmental}</p>
                  <p><strong>Legal:</strong> {pestelAnalysis.legal}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* -------------------------------------------------------------
             EXPANDED VIEW: SPLIT-SCREEN
             - Left: Chat Interface
             - Right: Multi-file Editor
          --------------------------------------------------------------*/
          <div className="w-full max-w-7xl grid grid-cols-12 gap-6 mt-20">
            {/* Left Side - Chat Interface */}
            <div className="col-span-4 bg-white rounded-2xl shadow-xl h-[800px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Chat with {selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : 'AI Agent'} ({selectedModel})</h2>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Sender Icon */}
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

                    {/* Message Content */}
                    <div
                      className={`p-3 rounded-xl max-w-[80%] ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>

                      {/* Code Blocks (if any) */}
                      {message.codeBlocks?.length ? (
                        <pre className="mt-2 bg-gray-800 text-green-200 p-2 rounded-md text-xs overflow-x-auto">
                          {message.codeBlocks.join("\n")}
                        </pre>
                      ) : null}

                      {/* AI Suggestions (if any) */}
                      {message.aiSuggestions?.length ? (
                        <ul className="mt-2 text-xs text-yellow-800 list-disc list-inside">
                          {message.aiSuggestions.map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Box */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side - Multi-file Editor */}
            <div className="col-span-8 bg-white rounded-2xl shadow-xl h-[800px] flex flex-col">
              {/* Editor Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-gray-800">Code Editor</h2>
                <div className="flex gap-2">
                  {/* Download main contract */}
                  <button
                    onClick={downloadContract}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* The MultiFileEditor */}
              <div className="flex-1">
                {files.length > 0 ? (
                  <MultiFileEditor files={files} setFiles={setFiles} />
                ) : (
                  <div className="p-4 text-gray-600">No files to display.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
