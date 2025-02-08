
import { Database, FileCode, Layout } from "lucide-react";
import React from "react";

export interface ProjectType {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    complexity: "Low" | "Medium" | "High";
}

export const projectTypesData = [
  {
    id: "defi",
    name: "DeFi Protocol",
    description: "Medium-High complexity staking or yield strategies",
    icon: <Database className="w-5 h-5" />,
    features: [
      "Multi-token Support",
      "Yield Optimization",
      "Flash Loans",
      "Governance"
    ],
    complexity: "High"
  },
  {
    id: "nft",
    name: "NFT Platform",
    description: "Minting, marketplace, and royalties",
    icon: <FileCode className="w-5 h-5" />,
    features: ["ERC-721/1155", "Marketplace", "Royalties", "Metadata"],
    complexity: "Medium"
  },
  {
    id: "dao",
    name: "DAO Framework",
    description: "Governance tokens, proposals, and voting",
    icon: <Layout className="w-5 h-5" />,
    features: [
      "Token Voting",
      "Proposal System",
      "Treasury Management",
      "Timelock"
    ],
    complexity: "High"
  }
];
