
import { Brain, Terminal, Shield, GitBranch } from "lucide-react";
import React from "react";

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  expertise: string[];
}

export const agentsData: Agent[] = [
  {
    id: "research",
    name: "Research Agent",
    description: "Provides domain/market research & suggestions",
    icon: <Brain className="w-5 h-5" />,
    expertise: [
      "Market Analysis",
      "Competitor Research",
      "Trend Analysis",
      "Risk Assessment"
    ]
  },
  {
    id: "developer",
    name: "Developer Agent",
    description: "Implements the contract logic",
    icon: <Terminal className="w-5 h-5" />,
    expertise: [
      "Smart Contracts",
      "Gas Optimization",
      "Testing",
      "Integration"
    ]
  },
  {
    id: "auditor",
    name: "Auditor Agent",
    description: "Analyzes and audits the contract for vulnerabilities",
    icon: <Shield className="w-5 h-5" />,
    expertise: [
      "Security Analysis",
      "Best Practices",
      "Vulnerability Detection",
      "Code Review"
    ]
  },
  {
    id: "deployment",
    name: "Deployment Specialist",
    description: "Handles final deployment & verification steps",
    icon: <GitBranch className="w-5 h-5" />,
    expertise: [
      "Network Selection",
      "Contract Verification",
      "Gas Estimation",
      "Deployment Strategy"
    ]
  }
];
