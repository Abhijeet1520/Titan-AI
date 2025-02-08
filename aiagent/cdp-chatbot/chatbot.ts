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

// Location to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = path.join(__dirname, "wallet_data.txt");

// Global references to an initialized agent & config
let globalAgent: ReturnType<typeof createReactAgent> | null = null;
let globalAgentConfig: Record<string, any> | null = null;

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
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
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
 * Initialize agent & store references
 ***************************************************/
async function initializeAgent() {
  try {
    validateEnvironment();

    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    // Read any existing wallet data (if present)
    let walletDataStr: string | undefined = undefined;
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (err) {
        console.error("Error reading existing wallet file:", err);
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    // Construct wallet provider
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Initialize AgentKit
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

    // Turn AgentKit providers into LangChain “tools”
    const tools = await getLangChainTools(agentkit);

    // Memory for storing conversation threads
    const memory = new MemorySaver();
    const agentConfig = {
      configurable: {
        thread_id: "CDP AgentKit Chatbot Example",
      },
    };

    // Create a ReAct Agent
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

    // Export wallet data so we can persist it
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    globalAgent = agent;
    globalAgentConfig = agentConfig;

    console.log("Agent initialization successful.");
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

/***************************************************
 * Chat endpoint
 * Send user messages -> get agent's streaming response
 ***************************************************/
app.post("/api/chat", async (req, res) => {
  try {
    if (!globalAgent || !globalAgentConfig) {
      return res.status(400).json({ error: "Agent not initialized." });
    }

    const { userMessage } = req.body;
    if (!userMessage) {
      return res
        .status(400)
        .json({ error: "Missing 'userMessage' in request body." });
    }

    // Stream the agent's response.
    // In a real app, you'd want to implement streaming response
    // over SSE or websockets. For simplicity, let's just gather
    // and return the concatenated output in this example.
    const agentStream = await globalAgent.stream(
      {
        messages: [new HumanMessage(userMessage)],
      },
      globalAgentConfig
    );

    let collectedAgentResponse = "";
    for await (const chunk of agentStream) {
      if ("agent" in chunk) {
        const partial = chunk.agent.messages[0].content;
        collectedAgentResponse += partial + "\n";
      } else if ("tools" in chunk) {
        // Tools messages are tool logs, you can optionally return them
        collectedAgentResponse += `\n(Tool output)\n${chunk.tools.messages[0].content}\n`;
      }
    }

    return res.json({ response: collectedAgentResponse.trim() });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    return res.status(500).json({ error: String(err) });
  }
});

/***************************************************
 * Autonomous action endpoint
 ***************************************************/
app.post("/api/auto", async (req, res) => {
  try {
    if (!globalAgent || !globalAgentConfig) {
      return res.status(400).json({ error: "Agent not initialized." });
    }

    const prompt =
      "Be creative and do something interesting on the blockchain. Show your capabilities.";
    const agentStream = await globalAgent.stream(
      { messages: [new HumanMessage(prompt)] },
      globalAgentConfig
    );

    let result = "";
    for await (const chunk of agentStream) {
      if ("agent" in chunk) {
        result += chunk.agent.messages[0].content + "\n";
      } else if ("tools" in chunk) {
        result += `[TOOL LOG] ${chunk.tools.messages[0].content}\n`;
      }
    }

    return res.json({ message: result.trim() });
  } catch (error) {
    console.error("Error in /api/auto:", error);
    return res.status(500).json({ error: String(error) });
  }
});

/***************************************************
 * Advanced Chat endpoint
 * This endpoint first sends a prompt to the agent to determine
 * the query type (e.g. requirements, research, development,
 * audit, deployment, or general). Based on the response and
 * optionally a conversationStatus flag, it then calls the
 * appropriate specialized prompt(s).
 ***************************************************/
app.post("/api/advanced-chat", async (req, res) => {
  try {
    if (!globalAgent || !globalAgentConfig) {
      return res.status(400).json({ error: "Agent not initialized." });
    }

    const { userMessage, conversationStatus } = req.body;
    if (!userMessage) {
      return res.status(400).json({ error: "Missing 'userMessage' in request body." });
    }

    // If this is a new conversation, run the full sequence.
    let prompts: { type: string; prompt: string }[] = [];
    if (conversationStatus === "new") {
      prompts = [
        {
          type: "requirements",
          prompt: "Please provide the detailed project requirements including functionality, security needs, and business objectives."
        },
        {
          type: "research",
          prompt: "Based on the requirements, provide an in-depth market analysis and competitive research."
        },
        {
          type: "development",
          prompt: "List the current files (or file placeholders) and provide initial smart contract code to kickstart development."
        },
        {
          type: "audit",
          prompt: "Perform a security audit on the provided code and list any potential vulnerabilities."
        },
        {
          type: "deployment",
          prompt: "Outline a step-by-step deployment plan, including network configuration and verification steps."
        }
      ];
    } else {
      // For ongoing conversations, first ask the agent to classify the query.
      const classificationPrompt = `Please determine the category of the following query. Respond with one word from the following options: requirements, research, development, audit, deployment, or general. Query: "${userMessage}"`;
      const classificationStream = await globalAgent.stream(
        { messages: [new HumanMessage(classificationPrompt)] },
        globalAgentConfig
      );
      let classificationResponse = "";
      for await (const chunk of classificationStream) {
        if ("agent" in chunk) {
          classificationResponse += chunk.agent.messages[0].content;
        }
      }
      const category = classificationResponse.trim().toLowerCase();
      const allowedCategories = ["requirements", "research", "development", "audit", "deployment", "general"];
      const queryCategory = allowedCategories.includes(category) ? category : "general";

      // Define specialized prompts for each category.
      const specializedPrompts: Record<string, string> = {
        requirements: "Please provide the detailed project requirements including functionality, security needs, and business objectives.",
        research: "Based on the requirements, provide an in-depth market analysis and competitive research.",
        development: "List the current files and provide initial smart contract code to kickstart development.",
        audit: "Perform a security audit on the provided code and list any potential vulnerabilities.",
        deployment: "Outline a step-by-step deployment plan, including network configuration and verification steps.",
        general: userMessage
      };

      prompts.push({ type: queryCategory, prompt: specializedPrompts[queryCategory] });
    }

    let fullResponse = "";
    // For each selected prompt, call the agent and accumulate responses.
    for (const p of prompts) {
      const agentStream = await globalAgent.stream(
        { messages: [new HumanMessage(p.prompt)] },
        globalAgentConfig
      );
      let collectedResponse = "";
      for await (const chunk of agentStream) {
        if ("agent" in chunk) {
          collectedResponse += chunk.agent.messages[0].content + "\n";
        } else if ("tools" in chunk) {
          collectedResponse += `[TOOL LOG] ${chunk.tools.messages[0].content}\n`;
        }
      }
      fullResponse += `--- ${p.type.toUpperCase()} RESPONSE ---\n` + collectedResponse + "\n";
    }

    return res.json({ response: fullResponse.trim() });
  } catch (error) {
    console.error("Error in /api/advanced-chat:", error);
    return res.status(500).json({ error: String(error) });
  }
});

/***************************************************
 * Agent initialization endpoint
 ***************************************************/
app.post("/api/initialize", async (req, res) => {
  try {
    // If agent already initialized, skip re-initialization
    if (globalAgent) {
      return res.json({ message: "Agent already initialized." });
    }
    await initializeAgent();
    return res.json({ message: "Agent initialized successfully." });
  } catch (err) {
    console.error("Initialization error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

export { app };
