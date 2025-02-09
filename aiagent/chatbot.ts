/***************************************************
 * server.ts
 ***************************************************/
import express from "express";
import cors from "cors";
import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//-------------------------------------------------------
// Specialized Prompts: Read from env variables or default
//-------------------------------------------------------
const PROMPT_REQUIREMENTS =
  process.env.REQUIREMENTS_PROMPT ||
  `
The user wants to discuss new requirements. Provide helpful detail about how to gather requirements,
security considerations, and objectives. Also list some clarifying questions.
`.trim();

const PROMPT_RESEARCH =
  process.env.RESEARCH_PROMPT ||
  `
The user wants to research or analyze something. Provide thorough background research,
competitor analysis, or relevant data.
`.trim();

const PROMPT_DEVELOPMENT =
  process.env.DEVELOPMENT_PROMPT ||
  `
The user wants to discuss development. Provide guidance on best practices, tools, and frameworks.
`.trim();

const PROMPT_AUDIT =
  process.env.AUDIT_PROMPT ||
  `
The user wants to discuss auditing. Provide guidance on security audits, code reviews, and testing.
`.trim();

const PROMPT_DEPLOYMENT =
  process.env.DEPLOYMENT_PROMPT ||
  `
The user wants to discuss deployment. Provide guidance on deployment strategies, hosting, and scaling.
`.trim();

const PROMPT_GENERAL =
  process.env.GENERAL_PROMPT ||
  `
The user has a general question. Provide a helpful response.
`.trim();

//-------------------------------------------------------
// Base instructions for how to format each mode's output
//-------------------------------------------------------
const BASE_INSTRUCTIONS = `
You must always format your responses according to the Mode:
1) REQUIREMENTS
    Start with "REQUIREMENTS" at the top.
    Then the project name, followed by a brief description.
    Then list items line by line, for example:
    REQUIREMENTS
    Project: My Project
    - Requirement 1
    - Requirement 2

2) DEVELOPMENT
    Start with "DEVELOPMENT" at the top.
    First, return a list of file names.
    Then for each file, provide its contents in code blocks. for example:
    DEVELOPMENT
    DeFi Protocol: My Project
    Files: 3
      - File 1: contract.sol
      - File 2: README.md
      - File 3: config.json

    File 1: contract.sol
    \`\`\`sol
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    contract MyContract {
      // Your contract code here
    }
    \`\`\`

    File 2: README.md
    \`\`\`md
    # DeFi Protocol - My Project
    <A brief description of the project>

    ## Requirements
    - Requirement 1
    - Requirement 2
    \`\`\`

    File 3: config.json
    \`\`\`json
    {
      "network": "mainnet",
      "address": "0x1234567890abcdef"
    }
    \`\`\`

3) RESEARCH
    Start with "RESEARCH" at the top.
    Provide your findings in bullet points. for example:
    RESEARCH
    DeFi Protocol Analysis: Medium-High complexity staking or yield strategies
    Research: High Complexity
    Key Features: 3
      -Multi-token Support
      -Yield Optimization
      -Flash Loans
    Market Analysis:
      <div class="space-y-4">
      <div>
        <h4 class="font-medium text-gray-900 mb-2">
          Market Size
        </h4>
        <div class="bg-gray-100 rounded-lg p-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Current TVL</span>
            <span class="font-medium">$1.2B</span>
          </div>
          <div class="flex items-center justify-between text-sm mt-2">
            <span class="text-gray-600">Growth Rate</span>
            <span class="font-medium text-green-600">+15% MoM</span>
          </div>
        </div>
      </div>
      <div>
        <h4 class="font-medium text-gray-900 mb-2">Competition</h4>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
            <span>Aave</span>
            <span class="font-medium">32% Market Share</span>
          </div>
          <div class="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
            <span>Compound</span>
            <span class="font-medium">28% Market Share</span>
          </div>
          <div class="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
            <span>Others</span>
            <span class="font-medium">40% Market Share</span>
          </div>
        </div>
      </div>
    </div>
    Risk Analysis: 3
    - High Risk:Smart contract vulnerabilities
    - Medium Risk:Market volatility impact
    - Low Risk:Regulatory compliance (with KYC)

4) AUDIT
    Start with "AUDIT" at the top.
    Provide security analysis in bullet points. for example:
    AUDIT
    - Checks: 3
    Test 1: ✓ ReentrancyGuard implemented on state-changing functions
    Status 1: Pass
    Test 2: ✓ Proper access control with Ownable
    Status 2: Pass
    Test 3: ✗ SafeMath library not used
    Status 3: Fail
    Recommendations for 3: 2
    - Implement SafeMath library
    - Use OpenZeppelin contracts

5) DEPLOYMENT
    Start with "DEPLOYMENT" at the top.
    Provide steps and pointers in bullet points. for example:
    DEPLOYMENT
    - Deployment Steps: 3
    Step 1: Compile the contracts
    Step 2: Deploy the contracts to the testnet
    Step 3: Test the contracts
    Should I deploy to the testnet or mainnet?

6) GENERAL
   Start with "GENERAL" at the top.
   Provide general insights or answers.
`.trim();

//-------------------------------------------------------
// In-memory session store & queue
//-------------------------------------------------------
interface AgentSession {
  agent: ReturnType<typeof createReactAgent>;
  agentConfig: Record<string, any>;
  lastActive: number; // Timestamp of last user activity
  inactivityTimer: NodeJS.Timeout; // Timer handle to clean up if inactive
}

const SESSIONS: Record<string, AgentSession> = {};
const MAX_ACTIVE_SESSIONS = 20;
const SESSION_INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes
const QUEUE: Array<{ chatId: string }> = [];

//-------------------------------------------------------
// Wallet data location
//-------------------------------------------------------
const WALLET_DATA_FILE = path.join(__dirname, "wallet_data.txt");

/***************************************************
 * Validate environment variables
 ***************************************************/
function validateEnvironment(): void {
  const missingVars: string[] = [];
  // Check required variables
  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_NAME",
    "CDP_API_KEY_PRIVATE_KEY",
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia");
  }
}

/***************************************************
 * Create a brand-new agent for a chat session
 ***************************************************/
async function createNewAgent(): Promise<{
  agent: ReturnType<typeof createReactAgent>;
  agentConfig: Record<string, any>;
}> {
  // 1) Validate environment (safe to call multiple times)
  validateEnvironment();

  // 2) Initialize the LLM
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.7,
  });

  // 3) Read any existing wallet data (if present)
  let walletDataStr: string | undefined = undefined;
  if (fs.existsSync(WALLET_DATA_FILE)) {
    try {
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
    } catch (err) {
      console.error("Error reading existing wallet file:", err);
    }
  }

  // 4) Configure CDP Wallet Provider
  const config = {
    apiKeyName: process.env.CDP_API_KEY_NAME,
    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    cdpWalletData: walletDataStr || undefined,
    networkId: process.env.NETWORK_ID || "base-sepolia",
  };

  // 5) Construct wallet provider
  const walletProvider = await CdpWalletProvider.configureWithWallet(config);

  // 6) Initialize AgentKit
  const agentkit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      wethActionProvider(),
      pythActionProvider(),
      walletActionProvider(),
      erc20ActionProvider(),
      cdpApiActionProvider({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      cdpWalletActionProvider({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    ],
  });

  // 7) Turn AgentKit providers into LangChain “tools”
  const tools = await getLangChainTools(agentkit);

  // 8) Memory for storing conversation threads
  const memory = new MemorySaver();
  const agentConfig = {
    configurable: {
      thread_id: "Titan Agent ",
    },
  };

  // 9) Create a ReAct Agent
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    // Insert the base instructions at the start
    messageModifier: `${BASE_INSTRUCTIONS}\n\nYou are a helpful agent that can interact onchain using the Coinbase Developer Platform (CDP) AgentKit.
If you ever need funds, you can request them from a faucet if on 'base-sepolia'.
If you cannot do something with the current tools, politely explain that it is not supported.
`,
  });

  // 10) Export wallet data so we can persist it
  const exportedWallet = await walletProvider.exportWallet();
  fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

  return { agent, agentConfig };
}

/***************************************************
 * Clean up a session if inactive
 ***************************************************/
async function cleanupSession(chatId: string) {
  if (SESSIONS[chatId]) {
    console.log(`Session [${chatId}] inactive for ${SESSION_INACTIVITY_MS/1000/60} minutes. Cleaning up.`);
    delete SESSIONS[chatId];

    // Process next queued session if any
    if (QUEUE.length > 0) {
      const nextSession = QUEUE.shift();
      if (nextSession) {
        try {
          // Create new agent for queued session
          const { agent, agentConfig } = await createNewAgent();

          const inactivityTimer = setTimeout(() => {
            cleanupSession(nextSession.chatId);
          }, SESSION_INACTIVITY_MS);

          SESSIONS[nextSession.chatId] = {
            agent,
            agentConfig,
            lastActive: Date.now(),
            inactivityTimer,
          };

          console.log(`Processed queued session [${nextSession.chatId}]. Queue length: ${QUEUE.length}`);
        } catch (error) {
          console.error(`Failed to process queued session [${nextSession.chatId}]:`, error);
          // Put it back in queue if failed
          QUEUE.unshift(nextSession);
        }
      }
    }
  }
}

/***************************************************
 * Reset the inactivity timer for a session
 ***************************************************/
function resetInactivityTimer(chatId: string) {
  const session = SESSIONS[chatId];
  if (!session) return;

  // Clear the old timer
  clearTimeout(session.inactivityTimer);

  // Set a new timer
  session.inactivityTimer = setTimeout(() => {
    cleanupSession(chatId);
  }, SESSION_INACTIVITY_MS);

  // Update lastActive timestamp
  session.lastActive = Date.now();
}

/***************************************************
 * Endpoint: Start a new chat session
 ***************************************************/
app.post("/api/start-chat", async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: "Missing 'chatId' in request body." });
    }

    if (SESSIONS[chatId]) {
      return res.status(400).json({ error: "That chatId is already in use." });
    }

    // If we have 50 active sessions, push to a queue for demo
    // In real logic, you might have a better approach.
    const activeCount = Object.keys(SESSIONS).length;
    if (activeCount >= MAX_ACTIVE_SESSIONS) {
      console.log(`Active sessions = ${activeCount}, pushing chat [${chatId}] to queue.`);
      QUEUE.push({ chatId });
      return res.json({ message: `Queue is full (${MAX_ACTIVE_SESSIONS}). Your request has been queued.` });
    }

    // Otherwise, create a new agent session
    const { agent, agentConfig } = await createNewAgent();

    // Store it
    const inactivityTimer = setTimeout(() => {
      cleanupSession(chatId);
    }, SESSION_INACTIVITY_MS);

    SESSIONS[chatId] = {
      agent,
      agentConfig,
      lastActive: Date.now(),
      inactivityTimer,
    };

    logger.log({
      chatId,
      sender: 'SYSTEM',
      message: 'New chat session started',
      status: 'SUCCESS'
    });

    console.log(`Created new session [${chatId}]. Active sessions: ${Object.keys(SESSIONS).length}`);

    return res.json({ message: `Session [${chatId}] created successfully!` });
  } catch (error) {
    logger.log({
      chatId: req.body.chatId || 'UNKNOWN',
      sender: 'SYSTEM',
      message: `Error: ${error}`,
      status: 'ERROR'
    });
    console.error("Error in /api/start-chat:", error);
    return res.status(500).json({ error: String(error) });
  }
});

/***************************************************
 * Endpoint: Send a chat message to an existing session
 ***************************************************/
app.post("/api/chat", async (req, res) => {
  try {
    const { chatId, userMessage } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: "Missing 'chatId' in request body." });
    }
    if (!userMessage) {
      return res.status(400).json({ error: "Missing 'userMessage' in request body." });
    }

    // limit userMessage to 5000 characters
    const trimmedUserMessage = userMessage.slice(0, 5000);

    // Log user message
    logger.log({
      chatId,
      sender: 'USER',
      message: userMessage
    });

    // Check if session exists
    const session = SESSIONS[chatId];
    if (!session) {
      // Potentially check the queue here to see if we can now create it
      // if a spot is open, etc. For simplicity, just error out.
      return res.status(404).json({ error: `No active session found for chatId = ${chatId}.` });
    }

    // Reset inactivity timer
    resetInactivityTimer(chatId);

    // 1) Classify the user's message
    const classificationPrompt = `
      You will read the user's message and classify it into one of the following modes:
      "requirements", "research", "development", "audit", "deployment", "general".
      If requirements are not provided or clear then choose "requirements".
      If research & requirements are not provided or clear then choose "research".
      If research & requirements are clear and development is being told then choose "development".
      So on and so forth.
      Provide only the single word: requirements, research, development, audit, deployment, or general.

      User message: "${trimmedUserMessage}"
    `;
    const classificationStream = await session.agent.stream(
      { messages: [new HumanMessage(classificationPrompt)] },
      session.agentConfig
    );
    let classificationResponse = "";
    for await (const chunk of classificationStream) {
      if ("agent" in chunk) {
        classificationResponse += chunk.agent.messages[0].content;
      }
    }
    const rawMode = classificationResponse.trim().toLowerCase();
    const allowedModes = ["requirements", "research", "development", "audit", "deployment", "general"];
    const mode = allowedModes.includes(rawMode) ? rawMode : "general";

    // After classification
    logger.log({
      chatId,
      sender: 'SYSTEM',
      message: `Message classified as: ${mode}`,
      mode
    });

    // 2) Get specialized prompt and enhance it with context
    let specializedPrompt = `${BASE_INSTRUCTIONS}\n`;

    if (mode === "development") {
      specializedPrompt += `
You are a smart contract development expert.
Please follow the "DEVELOPMENT" format.

`;
    } else if (mode === "requirements") {
      specializedPrompt += `${PROMPT_REQUIREMENTS} - Please follow the "REQUIREMENTS" format.`;
    } else if (mode === "research") {
      specializedPrompt += `${PROMPT_RESEARCH} - Please follow the "RESEARCH" format.`;
    } else if (mode === "audit") {
      specializedPrompt += `${PROMPT_AUDIT} - Please follow the "AUDIT" format.`;
    } else if (mode === "deployment") {
      specializedPrompt += `${PROMPT_DEPLOYMENT} - Please follow the "DEPLOYMENT" format.`;
    } else {
      specializedPrompt += `${PROMPT_GENERAL} - Please follow the "GENERAL" format.`;
    }

    // Add user message at the end
    specializedPrompt += `\n\nUser message: "${trimmedUserMessage}"`;

    // 3) Send to AI and collect response
    const agentStream = await session.agent.stream(
      { messages: [new HumanMessage(specializedPrompt)] },
      session.agentConfig
    );

    // 4) Process the response
    let responseText = "";
    let codeBlocks: string[] = []; // Add type annotation here
    let currentBlock = "";
    let inCodeBlock = false;

    for await (const chunk of agentStream) {
      if ("agent" in chunk) {
        const content = chunk.agent.messages[0].content;

        // Parse content for code blocks
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.includes('```')) {
            if (inCodeBlock) {
              codeBlocks.push(currentBlock);
              currentBlock = "";
            }
            inCodeBlock = !inCodeBlock;
          } else if (inCodeBlock) {
            currentBlock += line + '\n';
          } else {
            responseText += line + '\n';
          }
        }
      } else if ("tools" in chunk) {
        responseText += `(TOOL-LOG) ${chunk.tools.messages[0].content}\n`;
      }
      console.log(chunk);
    }

    // After AI response
    logger.log({
      chatId,
      sender: 'AI',
      message: responseText,
      mode,
      status: 'COMPLETE'
    });

    if (codeBlocks.length > 0) {
      logger.log({
        chatId,
        sender: 'AI',
        message: `Generated ${codeBlocks.length} code blocks`,
        mode: 'CODE'
      });
    }

    // 5) Return structured response
    return res.json({
      mode,
      response: responseText.trim(),
      codeBlocks,
      metadata: {
        timestamp: new Date().toISOString(),
        model: "gpt-4o-mini",
        sessionId: chatId
      }
    });

  } catch (err) {
    logger.log({
      chatId: req.body.chatId || 'UNKNOWN',
      sender: 'SYSTEM',
      message: `Error: ${err}`,
      status: 'ERROR'
    });
    console.error("Error in /api/chat:", err);
    return res.status(500).json({ error: String(err) });
  }
});

/***************************************************
 * Endpoint: Manual check if any queued requests
 ***************************************************/
app.get("/api/queue-status", (req, res) => {
  res.json({ queued: QUEUE });
});

/***************************************************
 * Endpoint: Manual check if any active sessions
 ***************************************************/
app.get("/api/session-status", (req, res) => {
  res.json({ activeSessions: Object.keys(SESSIONS) });
});

/***************************************************
 * Endpoint: Show the server is running (Health Check)
 ***************************************************/
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Add before the root endpoint handler
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

export { app };
