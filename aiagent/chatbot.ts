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
import { logger } from "./utils/logger";
import { json } from "stream/consumers";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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
const BASE_INSTRUCTIONS =
  process.env.BASE_INSTRUCTIONS_PROMPT || `
You are Titan AI, an agent that responds in one of these modes:
[requirements, research, development, audit, deployment, general].

IMPORTANT: All your outputs MUST be returned as valid JSON with the proper structure and required data. Any extra or general message that doesn't belong to the main structured keys should be included as a value in the "general_message" field.

Below are the required output structures for each mode with additional explanatory fields and an interactive "message" field at the start with md format value :

1) REQUIREMENTS
   - Give a detailed list of project requirements and explanations. Include the purpose of the project and why each requirement is essential.
   - only do this if the user seems certain about what they want.
   - JSON must include:
     - "mode": "REQUIREMENTS"
     - "message": A friendly message explaining the project from what you understand and any recommendations you have to make it better and reasing for the requirements.
     - "project": A short name/description for the project.
     - "requirements": An array of strings listing each requirement.
     - "explanations": An object providing additional details. This object should include:
         - "project": Explanation of the project's purpose.
         - "requirements": An array of explanations corresponding to each requirement.
     - Optionally, "general_message": A string with any additional commentary or suggestions.

   Example:
   USER: lets make a defi aggregator app
   {
     "mode": "REQUIREMENTS",
     "message": "Oh that sounds fun, <more details and fun things>! Here are the requirements details for your project:",
     "project": "Multi-Token Staking",
     "requirements": [
       "Users can stake multiple tokens",
       "Rewards distributed every 7 days"
     ],
     "explanations": {
       "project": "This project enables users to stake various tokens to earn yield, increasing flexibility.",
       "requirements": [
         "Supporting multiple tokens attracts a diverse user base.",
         "Weekly reward distribution balances frequent payouts with transaction efficiency."
       ]
     },
     "general_message": "Detailed requirements and explanations provided."
   }

2) DEVELOPMENT
   - JSON must include:
     - "mode": "DEVELOPMENT"
     - "message": "Below are the development files and their explanations for your project:"
     - "project": A name or short description of the project.
     - "files": An array of file objects. Each file object must include:
         - "filename": The name of the file.
         - "content": The full content of the file as a string.
         - "language": The programming language (e.g., "sol", "md").
         - "explanation": A string explaining the purpose and role of the file in the project.
         - Optionally, "lastModified": A timestamp (ISO string) if applicable.
     - Optionally, "general_message": Additional notes or commentary.

   Example:
   {
     "mode": "DEVELOPMENT",
     "message": "Below are the development files and their explanations for your project:",
     "project": "Multi-Token Staking",
     "files": [
       {
         "filename": "StakingContract.sol",
         "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\ncontract StakingContract { ... }",
         "language": "sol",
         "explanation": "This Solidity file contains the core logic for staking tokens and managing rewards.",
         "lastModified": "2025-02-09T12:00:00.000Z"
       },
       {
         "filename": "README.md",
         "content": "# Multi-Token Staking\\nA brief description of the project...",
         "language": "md",
         "explanation": "This markdown file documents the project features and setup instructions."
       }
     ],
     "general_message": "I have updated the Solidity contract and README file for your review. <more details about the changes...>"
   }

3) RESEARCH
   - JSON must include:
     - "mode": "RESEARCH"
     - "message": "Here is the comprehensive research analysis for your project:"
     - "project": A short description of the project.
     - "overview": A brief overview of the research topic.
     - "research": Detailed research or analysis information.
     - "key_features": An array of key feature strings.
     - "explanations": An object that elaborates on:
         - "methodology": Explanation of the research approach.
         - "key_features": Rationale behind the selection of key features.
         - "assumptions": Any assumptions made during the research.
     - "market_analysis": Insights on market trends or competitor landscape.
     - "risk_analysis": An object with risk levels (e.g., { "high": "...", "medium": "...", "low": "..." }).
     - Optionally, "general_message": Any extra research insights.

   Example:
   {
     "mode": "RESEARCH",
     "message": "Here is the comprehensive research analysis for your project:",
     "project": "Multi-Token Staking",
     "overview": "High-level DeFi analysis",
     "research": "In-depth analysis covering integration challenges and yield strategies.",
     "key_features": ["Multi-token Support", "Yield Optimization", "Flash Loans"],
     "explanations": {
       "methodology": "Research was conducted using market surveys, competitor benchmarks, and technical analysis.",
       "key_features": "Each feature was selected to enhance functionality and user appeal.",
       "assumptions": "Assumes stable market conditions and sufficient liquidity."
     },
     "market_analysis": "The market shows increasing interest in diversified staking options with competitive yields.",
     "risk_analysis": {
       "high": "Smart contract vulnerabilities require rigorous testing.",
       "medium": "Market volatility might affect yield consistency.",
       "low": "Regulatory risks can be mitigated through compliance measures."
     },
     "general_message": "Comprehensive research with detailed explanations for informed decision-making."
   }

4) AUDIT
   - user would have sent the files to check for the known issues.
   - only list the things you have done, not the things you haven't done.
   - check for the files from the user and then check if any of them have any of the know issues and tell about the issues you checked for.
   - ask user if they have any specific concerns.
   - recommend the user you can do the fixes if you find any issues.

   - JSON must include:
     - "mode": "AUDIT"
     - "message": "Here is the audit report with security checks and recommendations for your project:"
     - "checks": An array of strings or objects representing each security check or recommendation.
     - "explanations": An object mapping each check to a detailed explanation of its importance and impact.
     - Optionally, "general_message": Additional commentary regarding the audit process.

   Example:
   {
     "mode": "AUDIT",
     "message": "Here is the audit report with security checks and recommendations for your project:",
     "checks": [
       "Reentrancy guard is implemented",
       "OnlyOwner modifier is used",
     ],
     "failed_checks": [
        "No input validation",
        "No access control"
      ],
     "explanations": {
       "Reentrancy guard": "Prevents attackers from calling functions repeatedly before previous executions complete, mitigating fund draining risks.",
       "OnlyOwner modifier": "Ensures that only the contract owner can execute critical functions, protecting against unauthorized access.",
     },
     failed_explanations: {
        "No input validation": "Lack of input validation can lead to unexpected behavior or vulnerabilities due to unchecked user input.",
        "No access control": "Missing access control mechanisms can allow unauthorized users to execute privileged functions, compromising the contract's security."
      },
     "general_message": "Audit completed with in-depth explanations for each security measure."
   }

5) DEPLOYMENT
   - user would have sent the files to deploy.
   - JSON must include:
     - "mode": "DEPLOYMENT"
     - "message": "<Your message here>"
     - "deployment_steps": An array of step-by-step instructions.
       (For deployment, you must use the CDP toolkit to request testnet funds from the faucet and then deploy on the testnet.)
     - "abi": The contract ABI (provided as an array or string).
     - "contract_address": The deployed contract address.
     - "transaction_url": A URL to view the deployment transaction.
     - "explanations": An object where each deployment step is further explained to describe its purpose and importance.
     - Optionally, "general_message": Any additional notes regarding the deployment. Did it pass or fail? or if you need anything else from the user.

   Example:
   {
     "mode": "DEPLOYMENT",
     "message": "Here are the detailed deployment steps along with contract details for your project:",
     "deployment_steps": [
       "Step 1: Compile the contract",
       "Step 2: Use the CDP toolkit to request testnet funds from the faucet",
       "Step 3: Deploy the contract on the testnet",
       "Step 4: Verify the contract on a block explorer"
     ],
     "abi": "[ { ... } ]",
     "contract_address": "0xABC123...",
     "transaction_url": "https://sepolia.basescan.org/tx/0x...",
     "explanations": {
       "Step 1": "Compilation ensures the contract is syntactically correct and optimized.",
       "Step 2": "Requesting funds is necessary for covering deployment gas fees on the testnet.",
       "Step 3": "Deploying on the testnet allows real-world testing without risking real funds.",
       "Step 4": "Verification on a block explorer increases transparency and user trust."
     },
     "general_message": "Deployment successful using the CDP toolkit with comprehensive explanations."
   }

6) GENERAL
   - JSON must include:
     - "mode": "GENERAL"
     - "message": A direct and helpful answer to the user's query.

Instructions:
- Analyze the user’s message and choose the best matching mode.
- Provide your entire answer as valid JSON following the structures above.
- Include any extra or miscellaneous information in the "general_message" field.
- Do not output any additional text outside the JSON.
- make sure to output in json format with the required keys. and the output should be a valid json object.
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
async function createNewAgent( model = "gpt-4o-mini"): Promise<{
  agent: ReturnType<typeof createReactAgent>;
  agentConfig: Record<string, any>;
}> {
  // 1) Validate environment (safe to call multiple times)
  validateEnvironment();

  // 2) Initialize the LLM
  const llm = new ChatOpenAI({
    model: model,
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
    console.log(
      `Session [${chatId}] inactive for ${
        SESSION_INACTIVITY_MS / 1000 / 60
      } minutes. Cleaning up.`
    );
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

          console.log(
            `Processed queued session [${nextSession.chatId}]. Queue length: ${QUEUE.length}`
          );
        } catch (error) {
          console.error(
            `Failed to process queued session [${nextSession.chatId}]:`,
            error
          );
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

  clearTimeout(session.inactivityTimer);

  session.inactivityTimer = setTimeout(() => {
    cleanupSession(chatId);
  }, SESSION_INACTIVITY_MS);

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

    const activeCount = Object.keys(SESSIONS).length;
    if (activeCount >= MAX_ACTIVE_SESSIONS) {
      console.log(`Active sessions = ${activeCount}, pushing chat [${chatId}] to queue.`);
      QUEUE.push({ chatId });
      return res.json({
        message: `Queue is full (${MAX_ACTIVE_SESSIONS}). Your request has been queued.`,
      });
    }

    const { agent, agentConfig } = await createNewAgent();

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
      sender: "SYSTEM",
      message: "New chat session started",
      status: "SUCCESS",
    });

    console.log(
      `Created new session [${chatId}]. Active sessions: ${Object.keys(SESSIONS).length}`
    );

    return res.json({ message: `Session [${chatId}] created successfully!` });
  } catch (error) {
    logger.log({
      chatId: req.body.chatId || "UNKNOWN",
      sender: "SYSTEM",
      message: `Error: ${error}`,
      status: "ERROR",
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

    const trimmedUserMessage = userMessage.slice(0, 5000);

    logger.log({
      chatId,
      sender: "USER",
      message: userMessage,
    });

    let session = SESSIONS[chatId];
    if (!session) {
      const activeCount = Object.keys(SESSIONS).length;
      if (activeCount >= MAX_ACTIVE_SESSIONS) {
        console.log(`Active sessions = ${activeCount}, pushing chat [${chatId}] to queue.`);
        QUEUE.push({ chatId });
        return res.json({
          message: `Queue is full (${MAX_ACTIVE_SESSIONS}). Your request has been queued.`,
        });
      }

      const { agent, agentConfig } = await createNewAgent();
      const inactivityTimer = setTimeout(() => {
        cleanupSession(chatId);
      }, SESSION_INACTIVITY_MS);

      SESSIONS[chatId] = {
        agent,
        agentConfig,
        lastActive: Date.now(),
        inactivityTimer,
      };
      session = SESSIONS[chatId];

      logger.log({
        chatId,
        sender: "SYSTEM",
        message: "Created new chat session automatically for /api/chat request",
        status: "SUCCESS",
      });
    }

    resetInactivityTimer(chatId);

    let specializedPrompt = `
      ${BASE_INSTRUCTIONS}

      You will read the user's message and first determine which of the following modes best applies:
      (requirements, research, development, audit, deployment, or general).

      Then produce the response strictly in that mode's format described above. If it's unclear, use "general".

      User message: "${trimmedUserMessage}"
    `;

    const agentStream = await session.agent.stream(
      { messages: [new HumanMessage(specializedPrompt)] },
      session.agentConfig
    );

    let aggregatedResponse = "";

    for await (const chunk of agentStream) {
      if ("agent" in chunk) {
        const content = chunk.agent.messages[0].content;
        const usage = chunk.agent.messages[0]?.response_metadata?.tokenUsage;

        aggregatedResponse += content;

        if (usage) {
          logger.log({
            chatId,
            sender: "AI",
            message: `Token Usage: prompt=${usage.promptTokens}, completion=${usage.completionTokens}, total=${usage.totalTokens}`,
            tokenUsage: usage,
          });
        }
      } else if ("tools" in chunk) {
        aggregatedResponse += `(TOOL-LOG) ${chunk.tools.messages[0].content}`;
      }
    }

    let parsedJson: any;
    try {
      // Attempt to parse the ```json inside response string
      // if ```json is present, remove just first and last line as there might be more json in between
      const jsonValue = aggregatedResponse.startsWith("```json")
        ? aggregatedResponse.split("\n").slice(1, -1).join("\n")
        : aggregatedResponse;
      parsedJson = JSON.parse(jsonValue.trim());
    } catch (parseError) {
      logger.log({
        chatId,
        sender: "SYSTEM",
        message: "Failed to parse agent response as JSON. Returning fallback.\n\nResponse:\n" + aggregatedResponse,
        status: "ERROR",
      });
      parsedJson = {
        mode: "GENERAL",
        message: aggregatedResponse,
        general_message:
          "The system could not parse or generate the correct JSON structure.",
      };
    }

    if (!parsedJson.mode || !parsedJson.message) {
      logger.log({
        chatId,
        sender: "SYSTEM",
        message: "Agent response missing required keys. Returning fallback.",
        status: "ERROR",
      });
      parsedJson = {
        mode: "GENERAL",
        message: "An error occurred while processing your request.",
        general_message:
          "The system returned incomplete JSON (missing 'mode' or 'message').",
      };
    }

    parsedJson.metadata = {
      timestamp: new Date().toISOString(),
      sessionId: chatId,
      model: "gpt-4o-mini",
    };

    logger.log({
      chatId,
      sender: "AI",
      message: "Returning final JSON response to user.",
      mode: parsedJson.mode,
      status: "COMPLETE",
    });

    return res.json(parsedJson);
  } catch (err) {
    logger.log({
      chatId: req.body.chatId || "UNKNOWN",
      sender: "SYSTEM",
      message: `Error: ${err}`,
      status: "ERROR",
    });
    console.error("Error in /api/chat:", err);

    return res.status(500).json({
      mode: "GENERAL",
      message: "An error occurred while processing your request.",
      general_message: String(err),
    });
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
  res.sendFile(path.join(__dirname, "public", "test.html"));
});

export { app };
