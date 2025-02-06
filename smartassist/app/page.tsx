"use client";
import {
  Blocks,
  Bot,
  Brain,
  ChevronDown,
  Database,
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
import React, { useState } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showAgentSelect, setShowAgentSelect] = useState(false);
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    const aiResponse: Message = {
      id: messages.length + 2,
      content: "Based on your input and requirements, here's a draft of your smart contract.",
      sender: 'ai',
      agentType: selectedAgent,
      timestamp: new Date(),
      codeBlocks: [generatedContract || "// Your contract code will appear here"],
      securityChecks: ["✓ Reentrancy Guard", "✓ Integer Overflow Protection"],
      aiSuggestions: [
        "Consider adding pausable functionality",
        "Implement access control modifiers",
        "Add events for important state changes"
      ]
    };

    setMessages([...messages, newMessage, aiResponse]);
    setInput('');
    setIsExpanded(true);
  };

  const addRequirement = () => {
    if (!currentRequirement.trim()) return;
    setRequirements([...requirements, currentRequirement]);
    setCurrentRequirement('');
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const generateContract = () => {
    const contractCode = `// Generated Smart Contract
// Requirements:
${requirements.map((req, i) => `// ${i + 1}. ${req}`).join("\n")}

pragma solidity ^0.8.0;

contract GeneratedContract {
    // Contract logic based on provided requirements
    address public owner;
    bool public paused;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // TODO: Implement functions as per requirements
}`;

    setGeneratedContract(contractCode);
    setAiSuggestions([
      "Consider implementing ERC standards for compatibility",
      "Add comprehensive error messages",
      "Implement emergency pause functionality"
    ]);
  };

  const handleConnectWallet = () => {
    setIsWalletConnected(true);
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
          // Initial Center Input State
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

            {/* Contract Requirements */}
            <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Contract Requirements</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  placeholder="Enter a requirement (e.g., 'Implement minting function')"
                  className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
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
                      <button
                        onClick={() => removeRequirement(index)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={generateContract}
                disabled={requirements.length === 0}
                className={`w-full p-3 rounded-xl transition-colors ${
                  requirements.length > 0
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Generate Contract
              </button>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask questions or request modifications..."
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
          // Expanded Chat Interface with Split View
          <div className="w-full max-w-7xl grid grid-cols-12 gap-6 mt-20">
            {/* Left Side - Chat */}
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
                      {message.aiSuggestions && (
                        <div className="mt-2 text-xs space-y-1">
                          {message.aiSuggestions.map((suggestion, idx) => (
                            <p key={idx} className="text-blue-700">• {suggestion}</p>
                          ))}
                        </div>
                      )}
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

            {/* Right Side - Contract Preview & Analysis */}
            <div className="col-span-8 space-y-6">
              {/* Code Preview */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">Smart Contract Preview</h2>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100">
                      <FileCode className="w-5 h-5 text-gray-600" />
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

              {/* Security Analysis */}
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

              {/* AI Suggestions */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="font-semibold text-gray-800 mb-4">AI Suggestions</h2>
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-center gap-2 text-blue-700 bg-blue-50 p-3 rounded-lg">
                      <Brain className="w-5 h-5" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
