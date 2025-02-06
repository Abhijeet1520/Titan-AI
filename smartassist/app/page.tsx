import React, { useState, useEffect } from 'react';
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

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  agentType?: string;
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

export default function Home() {
  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showAgentSelect, setShowAgentSelect] = useState(false);

  // Requirements & Contract Generation
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [generatedContract, setGeneratedContract] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

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

  const projectTypes: ProjectType[] = [
    {
      id: 'nft',
      name: 'NFT Platform',
      description: 'Create NFT minting and marketplace solutions',
      icon: <FileCode />
    },
    {
      id: 'defi',
      name: 'DeFi Protocol',
      description: 'Build decentralized finance applications',
      icon: <Database />
    },
    {
      id: 'dao',
      name: 'DAO Framework',
      description: 'Develop decentralized autonomous organizations',
      icon: <Layout />
    }
  ];

  // Pre-fill default data on first load
  useEffect(() => {
    // Example: Preselect NFT project
    setSelectedProject('nft');
    // Example: Preselect the Architect agent
    setSelectedAgent('architect');
    // Example: Pre-populate some requirements
    const defaultRequirements = [
      'Users can mint their own NFTs',
      'Contract should track total supply',
      'Only owner can change the baseURI',
      'Emit an event upon each successful mint'
    ];
    setRequirements(defaultRequirements);
    
    // Generate an initial contract
    generateContract(defaultRequirements);
  }, []);

  // Add a new requirement to the list
  const addRequirement = () => {
    if (!currentRequirement.trim()) return;
    const updated = [...requirements, currentRequirement];
    setRequirements(updated);
    setCurrentRequirement('');
    generateContract(updated);
  };

  // Remove a requirement from the list
  const removeRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    generateContract(updated);
  };

  // Generate a mock smart contract & suggestions based on current requirements
  const generateContract = (reqs?: string[]) => {
    const finalReqs = reqs || requirements;
    const contractCode = `// Generated Smart Contract
// Requirements:
${finalReqs.map((r, i) => `// ${i + 1}. ${r}`).join('\n')}

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    uint256 public totalMinted;

    constructor() ERC721("MyNFT", "MNFT") {
        // constructor logic
    }

    function mint() external {
        // 1. Check any conditions if needed
        // 2. Mint the NFT to msg.sender
        _safeMint(msg.sender, totalMinted + 1);
        totalMinted += 1;

        // 3. Emit an event
        emit Minted(msg.sender, totalMinted);
    }

    // Only owner can change base URI
    function setBaseURI(string memory baseURI) external onlyOwner {
        // Implementation for setting a new base URI
    }

    event Minted(address indexed minter, uint256 tokenId);
}`;

    setGeneratedContract(contractCode);

    // Mock AI suggestions
    const suggestions = [
      'Add a pausable mechanism to halt minting if needed.',
      'Implement a royalty or fee mechanism for secondary sales.',
      'Integrate an Access Control library for fine-grained permissions.'
    ];
    setAiSuggestions(suggestions);
  };

  // Chat message handler
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    // AI response uses the latest generated contract & suggestions
    const aiResponse: Message = {
      id: messages.length + 2,
      content: 'Here’s an updated contract snippet based on your input. Check the code preview for more details!',
      sender: 'ai',
      agentType: selectedAgent,
      timestamp: new Date(),
      codeBlocks: [generatedContract || '// Your contract code will appear here'],
      securityChecks: ['✓ Reentrancy Guard', '✓ Integer Overflow Protection'],
      aiSuggestions: aiSuggestions.length > 0 ? aiSuggestions : [
        'Use OpenZeppelin libraries for safe math and ownership checks.'
      ]
    };

    setMessages([...messages, newMessage, aiResponse]);
    setInput('');
    setIsExpanded(true);
  };

  // Wallet Connection
  const handleConnectWallet = () => {
    setIsWalletConnected(true);
  };

  // Download contract as .sol file
  const downloadContract = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContract], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'MyNFT.sol';
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="fixed top-0 right-0 p-6 flex items-center gap-4">
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
        <div className="flex items-center gap-2">
          <Blocks className="w-8 h-8 text-blue-600" />
          <span className="font-bold text-xl text-blue-600">SmartAI</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {!isExpanded ? (
          // Initial view: project selection, agent selection, and requirements input
          <div className="w-full max-w-3xl text-center space-y-8">
            <h1 className="text-4xl font-bold text-gray-800">Smart Contract Assistant</h1>
            
            {/* Project Type Selection */}
            <div className="grid grid-cols-3 gap-4 mb-8">
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
            <div className="relative mb-8">
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

            {/* Contract Requirements Input */}
            <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Contract Requirements</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  placeholder="Enter a requirement (e.g., 'Implement minting function')"
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
          </div>
        ) : (
          // Expanded view: Split-screen chat and contract preview sections
          <div className="w-full max-w-7xl grid grid-cols-12 gap-6 mt-20">
            {/* Left Side - Chat Interface */}
            <div className="col-span-4 bg-white rounded-2xl shadow-xl h-[800px] flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Chat with AI Agent</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
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
                    <div
                      className={`p-3 rounded-xl max-w-[80%] ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {/* Display code blocks, if any */}
                      {message.codeBlocks?.length ? (
                        <pre className="mt-2 bg-gray-800 text-green-200 p-2 rounded-md text-xs overflow-x-auto">
                          {message.codeBlocks.join("\n")}
                        </pre>
                      ) : null}
                      {/* Display AI suggestions, if any */}
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

            {/* Right Side - Contract Preview, Security Analysis, and AI Suggestions */}
            <div className="col-span-8 space-y-6">
              {/* Contract Code Preview */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">Smart Contract Preview</h2>
                  <div className="flex gap-2">
                    <button onClick={downloadContract} className="p-2 rounded-lg hover:bg-gray-100">
                      <Download className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100">
                      <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm text-gray-100 overflow-x-auto">
                  {generatedContract || "// Generated contract code will appear here"}
                </div>
              </div>

              {/* Security Analysis Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Security Analysis</h2>
                <div className="space-y-3">
                  {messages.length > 0 && messages[messages.length - 1].securityChecks?.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                      <Shield className="w-5 h-5" />
                      <span className="text-sm">{check}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="font-semibold text-gray-800 mb-4">AI Suggestions</h2>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {aiSuggestions.length > 0 ? (
                    aiSuggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))
                  ) : (
                    <li>No suggestions available yet. Generate contract to see AI suggestions.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
