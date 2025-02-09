"use client";
import Editor from "@monaco-editor/react";
import {
  AlertCircle,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileCode,
  Fullscreen,
  GitBranch,
  Layout,
  Minimize,
  Plus,
  Send,
  Settings,
  Shield,
  Terminal,
  Trash2,
  Wallet,
  Zap
} from "lucide-react";
import React, { useEffect, useState } from "react";
import SplitPane from "react-split-pane";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

import { agentsData } from "@/data/agents";
import { projectTypesData } from "@/data/projectTypes";
import { chatModelsData } from "@/data/chatModels";
import { defaultRequirements } from "@/data/defaultRequirements";
import { bigDefiContract, readmeContent, deployConfig } from "@/data/contractTemplates";

const chatApiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || "/api/chat";

/* -------------------------------------------------------------------
  TYPES & INTERFACES
---------------------------------------------------------------------*/
interface Message {
  id: number;
  content: string; // We'll store full JSON here or short text, whichever you prefer
  sender: "user" | "ai";
  agentId: string; // which agent this message belongs to
  timestamp: Date;
  codeBlocks?: string[];
  securityChecks?: string[];
  aiSuggestions?: string[];
  status?: "pending" | "complete" | "error";
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
  costLevel: "Low" | "Medium" | "High";
}

/* -------------------------------------------------------------------
  MULTI-FILE EDITOR COMPONENT
---------------------------------------------------------------------*/
interface MultiFileEditorProps {
  files: CodeFile[];
  setFiles: React.Dispatch<React.SetStateAction<CodeFile[]>>;
  isFullscreen: boolean;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MultiFileEditor: React.FC<MultiFileEditorProps> = ({
  files,
  setFiles,
  isFullscreen,
  setIsFullscreen
}) => {
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
    <div
      className={
        isFullscreen
          ? "fixed top-[6%] left-0 w-[100%] h-[95%] z-[999] bg-white flex flex-col"
          : "relative h-full flex flex-col"
      }
    >
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute right-0 p-2 m-2 bg-gray-200 rounded-md shadow text-sm z-[9999] flex items-center gap-2"
        >
          <Minimize className="w-4 h-4" />
        </button>
      )}
      {/* Tabs with file info */}
      <div className="flex items-center border-b bg-gray-50 overflow-x-auto">
        <div className="flex-1 flex">
          {files.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 border-r min-w-[8rem]
                px-3 py-2
                ${
                  activeTab === idx
                    ? "bg-white border-b-2 border-b-blue-500 font-medium"
                    : "hover:bg-gray-100"
                }`}
            >
              <FileCode className="w-4 h-4 text-gray-500" />
              <div className="flex flex-col items-start">
                <span className="text-sm truncate max-w-[12rem]">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(file.lastModified).toLocaleTimeString()}
                </span>
              </div>
            </button>
          ))}
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
              lineNumbers: "on",
              renderWhitespace: "selection",
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
---------------------------------------------------------------------*/
function Home() {
  // State declarations
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("0x1234...5678");
  const [isSending, setIsSending] = useState(false);

  // Track chatId for the API
  const [chatId, setChatId] = useState<string>("");

  // Agents (multiple)
  const agents = agentsData;

  // Project types
  const projectTypes = projectTypesData;

  // Chat Model selection
  const chatModels = chatModelsData;

  const [selectedAgentId, setSelectedAgentId] = useState<string>("research");
  const [selectedProject, setSelectedProject] = useState("defi");
  const [selectedModel, setSelectedModel] = useState("gpt-4");

  // Chat messages for each agent
  const [agentMessages, setAgentMessages] = useState<{ [key: string]: Message[] }>({
    research: [],
    developer: [],
    auditor: [],
    deployment: []
  });

  // Requirements & contract generation
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [generatedContract, setGeneratedContract] = useState("");

  // Editor + Security analysis
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [latestSecurityChecks, setLatestSecurityChecks] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // To store research/audit/deployment text if desired
  const [researchOutput, setResearchOutput] = useState("");
  const [auditOutput, setAuditOutput] = useState("");
  const [deploymentOutput, setDeploymentOutput] = useState("");

  // New state: suggested requirements
  const [suggestedRequirements, setSuggestedRequirements] = useState<
    Array<{ text: string; selected: boolean }>
  >([]);

  // Editor Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Bottom Tabs
  const bottomTabs = ["requirements", "research", "audit", "deployment"] as const;
  type BottomTab = typeof bottomTabs[number];
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>("requirements");

  /* ------------------------------------------------------------------
       Initialize default requirements
  --------------------------------------------------------------------*/
  useEffect(() => {
    setRequirements(defaultRequirements);
  }, []);

  /* ------------------------------------------------------------------
       handleConnectWallet
  --------------------------------------------------------------------*/
  const handleConnectWallet = async () => {
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsWalletConnected(true);
      setWalletAddress("0x1234...5678");
    } catch (error) {
      console.error("Wallet connection failed:", error);
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
    setCurrentRequirement("");
    generateContract(updated);
  };

  const handleRemoveRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    generateContract(updated);
  };

  // Toggle checkbox for suggested requirement
  const handleToggleSuggestion = (index: number) => {
    const updated = suggestedRequirements.map((item, idx) => {
      if (idx === index) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });
    setSuggestedRequirements(updated);
  };

  // Add selected suggestions to main requirements
  const handleAddSelectedSuggestions = () => {
    const toAdd = suggestedRequirements.filter(item => item.selected).map(item => item.text);
    if (toAdd.length) {
      setRequirements(prev => [...prev, ...toAdd]);
      setSuggestedRequirements([]);
    }
  };

  /* ------------------------------------------------------------------
       generateContract
  --------------------------------------------------------------------*/
  const generateContract = (reqs?: string[]) => {
    const finalReqs = reqs || requirements;
    const bigContract = bigDefiContract.replace(
      "// ...the big solidity contract string...",
      "SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\n// ...rest of contract..."
    );
    const readme = readmeContent.replace(
      "// ...the markdown README content...",
      "## Implementation details\n// ...rest of README..."
    );
    const deployConf = deployConfig.replace(
      "// ...the deployment configuration string...",
      "// Custom deployment instructions here"
    );

    const initialFiles: CodeFile[] = [
      {
        name: "MyAdvancedDeFi.sol",
        content: bigContract,
        language: "sol",
        lastModified: new Date()
      },
      {
        name: "README.md",
        content: readme,
        language: "markdown",
        lastModified: new Date()
      },
      {
        name: "deploy-config.js",
        content: deployConf,
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
       handleSendMessage
  --------------------------------------------------------------------*/
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    setIsSending(true);
    const agentId = selectedAgentId;
    const oldMessages = agentMessages[agentId] || [];

    // user message
    const userMsg: Message = {
      id: oldMessages.length + 1,
      content: input,
      sender: "user",
      agentId,
      timestamp: new Date(),
      status: "complete"
    };

    // placeholder 'thinking' AI message
    const processingMsg: Message = {
      id: oldMessages.length + 2,
      content: "Analyzing your request...",
      sender: "ai",
      agentId,
      timestamp: new Date(),
      status: "pending"
    };

    setAgentMessages({
      ...agentMessages,
      [agentId]: [...oldMessages, userMsg, processingMsg]
    });

    try {
      // If no chatId yet, create one
      let usedChatId = chatId;
      if (!usedChatId) {
        usedChatId = `chat-${Date.now()}`;
        setChatId(usedChatId);
      }

      const response = await fetch(chatApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: usedChatId, userMessage: input })
      });
      setInput("");

      const data = await response.json();
      const mode = data.mode as string || "GENERAL";

      // ---- MAP THE RESPONSE TO YOUR UI BASED ON MODE ----
      // We'll store the entire JSON as a string in the final AI message.
      // Additionally, handle specialized fields if we want to update the bottom tabs.

      if (mode === "REQUIREMENTS") {
        setActiveBottomTab("requirements");
        // If we get an array of requirements from the server, mark them as suggestions
        if (Array.isArray(data.requirements)) {
          setSuggestedRequirements(
            data.requirements.map((req: string) => ({
              text: req,
              selected: false
            }))
          );
        }
      } else if (mode === "RESEARCH") {
        setActiveBottomTab("research");
        // If there's a 'research' field, store it
        setResearchOutput(
          `**${data.message}**\n\n${data.overview || ""}\n\n${data.research || ""}`
        );
      } else if (mode === "DEVELOPMENT") {
        setActiveBottomTab("requirements"); // or "development" if you prefer a separate tab
        // If there's a 'files' array in data, replace or merge with existing files
        if (Array.isArray(data.files)) {
          const newFiles = data.files.map((f: any) => ({
            name: f.filename,
            content: f.content,
            language: f.language || "sol",
            lastModified: f.lastModified ? new Date(f.lastModified) : new Date()
          }));
          setFiles(newFiles);
        }
      } else if (mode === "AUDIT") {
        setActiveBottomTab("audit");
        // If there's a 'checks' field, show them in the UI
        if (Array.isArray(data.checks)) {
          setLatestSecurityChecks(data.checks);
        }
        // Save the "message" in the audit output
        setAuditOutput(data.message || "Audit results below:");
      } else if (mode === "DEPLOYMENT") {
        setActiveBottomTab("deployment");
        // If there's a 'transaction_url' or other fields, store them
        setDeploymentOutput(
          `${data.message}\n\nContract Address: ${data.contract_address}\nTransaction: ${data.transaction_url}`
        );
      } else {
        // fallback for GENERAL
        setActiveBottomTab("requirements");
      }

      // final AI message in chat
      // We'll stringify the entire JSON so you can see it in the chat bubble
      const aiMsg: Message = {
        id: oldMessages.length + 2,
        content: JSON.stringify(data, null, 2),
        sender: "ai",
        agentId,
        timestamp: new Date(),
        codeBlocks: [generatedContract],
        securityChecks: latestSecurityChecks,
        aiSuggestions: aiSuggestions,
        status: "complete"
      };

      setAgentMessages({
        ...agentMessages,
        [agentId]: [...oldMessages, userMsg, aiMsg]
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Show an error message in chat
      const errorMsg: Message = {
        id: oldMessages.length + 2,
        content: `${String(error)}`,
        sender: "ai",
        agentId,
        timestamp: new Date(),
        status: "error"
      };
      setAgentMessages({
        ...agentMessages,
        [agentId]: [...oldMessages, userMsg, errorMsg]
      });
    } finally {
      setIsSending(false);
      setIsProcessing(false);
    }

  };

  /* ------------------------------------------------------------------
       handleDownloadContract: Let user download .sol file
  --------------------------------------------------------------------*/
  const handleDownloadContract = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContract], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "MyAdvancedDeFi.sol";
    document.body.appendChild(element);
    element.click();
  };

  /* ------------------------------------------------------------------
       Render
  --------------------------------------------------------------------*/
  const currentAgentChats = agentMessages[selectedAgentId] || [];
  const selectedAgentDetails = agents.find((a) => a.id === selectedAgentId);
  const selectedProjectDetails = projectTypes.find((p) => p.id === selectedProject);

  // SplitPane resizer styles
  const verticalResizerStyle: React.CSSProperties = {
    width: "6px",
    background: "#e2eff0",
    cursor: "col-resize",
    margin: "0 2px",
    zIndex: 1
  };
  const horizontalResizerStyle: React.CSSProperties = {
    height: "6px",
    minHeight: "3px",
    background: "#e2eff0",
    cursor: "row-resize",
    margin: "0",
    zIndex: 1
  };

  return (
    <div className="h-screen w-screen min-h-screen min-w-screen flex flex-col h-full w-full">
      {/* Top Bar: LLM dropdown + Wallet Connect */}
      <div className="h-14 flex items-center justify-between bg-white border-b px-6">
        <div className="flex items-center gap-4">
          <Image
            src="/android-chrome-192x192.png"
            alt="Titan AI Logo"
            width={32}
            height={32}
            className="object-contain"
          />
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
            {projectTypes.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          {/* LLM Models Dropdown */}
          <div className="flex items-center">
            <label className="mr-1 text-sm text-gray-600">Model:</label>
            <select
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {chatModels.map((model) => (
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isWalletConnected
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            } ${isProcessing ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            <Wallet className="w-5 h-5" />
            {isProcessing
              ? "Connecting..."
              : isWalletConnected
              ? walletAddress
              : "Connect Wallet"}
          </button>
        </div>
      </div>

      {/* Main Split: Left (Chat) | Right (Editor + Bottom Tabs) */}
      {/* @ts-ignore */}
      <SplitPane
        split="vertical"
        defaultSize="60%"
        minSize="20%"
        resizerStyle={verticalResizerStyle}
        style={{ position: "relative", flex: 1 }}
      >
        {/* LEFT: Chat Panel */}
        <div className="flex flex-col w-full h-full overflow-y-auto">
          {/* Agent selection */}
          <div className="flex gap-2 p-3 border-b bg-gray-50">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${
                    selectedAgentId === agent.id
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
              >
                {agent.icon}
                <span>{agent.name}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full p-3 space-y-3 w-max-[100]">
              <div className="flex-1 flex flex-col bg-white">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {currentAgentChats.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 rounded-full flex items-center justify-center w-10 h-10 ${
                          message.sender === "user" ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        {message.sender === "user" ? (
                          <Zap className="w-4 h-4 text-blue-600" />
                        ) : (
                          selectedAgentDetails?.icon ?? (
                            <Bot className="w-4 h-4 text-gray-600" />
                          )
                        )}
                      </div>

                      <div
                        className={`flex-1 max-w-[80%] ${
                          message.status === "pending" ? "opacity-70" : ""
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl ${
                            message.sender === "user"
                              ? "bg-blue-500 text-white ml-auto"
                              : "bg-white border shadow-sm"
                          }`}
                        >
                          {message.status === "pending" ? (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>{message.content}</span>
                            </div>
                          ) : (
                            <>
                              <pre className="text-sm lg:text-base overflow-x-auto whitespace-pre-wrap">
                                {message.content}
                              </pre>
                              {message.codeBlocks?.length ? (
                                <div className="mt-3 space-y-2">
                                  {message.codeBlocks.map((block, idx) => (
                                    <pre
                                      key={idx}
                                      className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs lg:text-sm overflow-x-auto"
                                    >
                                      {block}
                                    </pre>
                                  ))}
                                </div>
                              ) : null}

                              {/* AI suggestions / security checks */}
                              {message.securityChecks?.length ? (
                                <div className="mt-3 space-y-1.5">
                                  {message.securityChecks.map((check, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 text-sm text-gray-700"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      <span>{check}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              {message.aiSuggestions?.length ? (
                                <div className="mt-3 space-y-1.5">
                                  {message.aiSuggestions.map((sug, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 text-sm text-blue-700"
                                    >
                                      <Zap className="w-5 h-5" />
                                      <span>{sug}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                          {message.sender === "ai" && selectedAgentDetails && (
                            <>
                              <span className="font-medium">
                                {selectedAgentDetails.name}
                              </span>
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
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${
                  selectedAgentDetails?.name || "AI"
                } anything...`}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                // disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing}
                className={`bg-blue-500 text-white p-2 rounded-xl transition-colors ${
                  isProcessing ? "opacity-75 cursor-not-allowed" : "hover:bg-blue-600"
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
          className="h-full w-full"
          minSize="10%"
          maxSize="90%"
          resizerStyle={horizontalResizerStyle}
        >

          {/* TOP: TABS (Requirements, Research, Audit, Deployment) */}
          <div className="w-full h-full flex flex-col bg-white overflow-y-auto overflow-x-hidden">
            {/* Tab Bar */}
            <div className="flex items-center gap-2 border-b px-3 bg-gray-50">
              {bottomTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveBottomTab(tab)}
                  className={`px-3 py-2 text-sm font-medium transition-colors
                    ${
                      activeBottomTab === tab
                        ? "border-b-2 border-blue-500 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {/* REQUIREMENTS TAB */}
              {activeBottomTab === "requirements" && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">
                    Project Requirements
                  </h2>
                  <div className="mb-4 flex items-center gap-3">
                    <input
                      type="text"
                      value={currentRequirement}
                      onChange={(e) => setCurrentRequirement(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAddRequirement()
                      }
                      placeholder="Add requirement..."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={handleAddRequirement}
                      className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {/* List each requirement */}
                  {requirements.length > 0 && (
                    <ul className="space-y-3">
                      {requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                        >
                          <button
                            onClick={() => handleRemoveRequirement(idx)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <span className="text-gray-700 flex-1">{req}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {suggestedRequirements.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-md font-semibold mb-2">Suggested Requirements</h3>
                      <ul className="space-y-2">
                        {suggestedRequirements.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleSuggestion(idx)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{item.text}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={handleAddSelectedSuggestions}
                        className="mt-2 bg-green-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Add Selected
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* RESEARCH TAB */}
              {activeBottomTab === "research" && (
                <div className="max-w-100">
                  <h2 className="text-lg font-semibold mb-3">
                    {selectedProjectDetails?.name} Analysis
                  </h2>
                  <div className="prose prose-sm text-gray-600 mb-3">
                    <ReactMarkdown>{researchOutput}</ReactMarkdown>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-gray-700">
                      {selectedProjectDetails?.description}
                    </span>
                    <span
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${
                          selectedProjectDetails?.complexity === "High"
                            ? "bg-red-100 text-red-700"
                            : selectedProjectDetails?.complexity === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }
                      `}
                    >
                      {selectedProjectDetails?.complexity} Complexity
                    </span>
                  </div>
                </div>
              )}

              {/* AUDIT TAB (Security Analysis) */}
              {activeBottomTab === "audit" && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">
                    Audit &amp; Security Analysis
                  </h2>
                  <div className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                    {auditOutput}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Below are the latest security checks:
                  </p>
                  {latestSecurityChecks.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {latestSecurityChecks.map((check, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 bg-white rounded-lg border border-gray-100"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            {check}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Clock className="w-5 h-5" />
                      <span>Waiting for security analysis...</span>
                    </div>
                  )}
                </div>
              )}

              {/* DEPLOYMENT TAB */}
              {activeBottomTab === "deployment" && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Deployment</h2>
                  <div className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                    {deploymentOutput}
                  </div>
                  <p className="text-sm text-gray-600">
                    (Placeholder) Prepare final deployment steps here.
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* BOTTOM: Editor Panel */}
          <div className="w-full h-full flex flex-col overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between p-3 border-b bg-white">
              <div className="flex items-center gap-3">
                <FileCode className="w-4 h-4 text-gray-500" />
                <h2 className="font-semibold text-gray-800">
                  Smart Contract Editor
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadContract}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Download Contract"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Toggle Fullscreen"
                >
                  <Fullscreen className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <MultiFileEditor
                files={files}
                setFiles={setFiles}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
              />
            </div>
          </div>
        </SplitPane>
      </SplitPane>
    </div>
  );
}

export default Home;
