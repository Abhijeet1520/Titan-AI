/***************************************************
 * server.ts
 ***************************************************/
import express from "express";
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

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

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
    model: "gpt-4o-mini",
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
    messageModifier: `
      You are a helpful agent that can interact onchain using the Coinbase Developer Platform (CDP) AgentKit.
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
function cleanupSession(chatId: string) {
  if (SESSIONS[chatId]) {
    console.log(`Session [${chatId}] inactive for 10 mins. Cleaning up.`);
    delete SESSIONS[chatId];
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

    console.log(`Created new session [${chatId}]. Active sessions: ${Object.keys(SESSIONS).length}`);

    return res.json({ message: `Session [${chatId}] created successfully!` });
  } catch (error) {
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
      Provide only the single word: requirements, research, development, audit, deployment, or general.

      User message: "${userMessage}"
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

    // 2) Build the specialized prompt based on the classification
    let specializedPrompt = "";
    if (mode === "requirements") {
      specializedPrompt = PROMPT_REQUIREMENTS;
    } else if (mode === "research") {
      specializedPrompt = PROMPT_RESEARCH;
    } else if (mode === "development") {
      specializedPrompt = PROMPT_DEVELOPMENT;
    } else if (mode === "audit") {
      specializedPrompt = PROMPT_AUDIT;
    } else if (mode === "deployment") {
      specializedPrompt = PROMPT_DEPLOYMENT;
    } else {
      specializedPrompt = PROMPT_GENERAL;
    }
    specializedPrompt += ` User message: "${userMessage}"`;

    // 3) Send the specialized prompt to the agent
    const agentStream = await session.agent.stream(
      { messages: [new HumanMessage(specializedPrompt)] },
      session.agentConfig
    );

    let finalText = "";
    for await (const chunk of agentStream) {
      if ("agent" in chunk) {
        finalText += chunk.agent.messages[0].content + "\n";
      } else if ("tools" in chunk) {
        finalText += `(TOOL-LOG) ${chunk.tools.messages[0].content}\n`;
      }
    }

    // 5) Return a JSON response, including the mode
    return res.json({
      mode,
      response: finalText.trim(),
    });
  } catch (err) {
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

/***************************************************
 * HTTP listener
 ***************************************************/
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export { app };
