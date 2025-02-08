export type ModalFeatures = {
  title: string;
  content: {
    title: string;
    description: string;
    points: string[];
  }[];
};

export type ModalPricing = {
  title: string;
  plans: {
    name: string;
    price: string;
    features: string[];
  }[];
};

export type ModalAbout = {
  title: string;
  sections: {
    title: string;
    content: string;
  }[];
};

export type ModalDocumentation = {
  title: string;
  sections: {
    title: string;
    content: string;
  }[];
};

export interface ModalContentMap {
  features: ModalFeatures;
  pricing: ModalPricing;
  about: ModalAbout;
  documentation: ModalDocumentation;
}

export const modalContent: ModalContentMap = {
    features: {
      title: "Platform Features",
      content: [
        {
          title: "AI-Powered Development",
          description: "Our CDP-based agents leverage advanced AI to automate and optimize your development workflow.",
          points: [
            "Smart contract generation and auditing",
            "Automated code review and optimization",
            "Real-time security analysis",
            "Cross-chain compatibility testing"
          ]
        },
        {
          title: "Integrated Wallet System",
          description: "Each AI agent comes with its own crypto wallet capabilities.",
          points: [
            "Direct smart contract interaction",
            "Multi-chain support",
            "Automated transaction handling",
            "Secure key management"
          ]
        },
        {
          title: "Advanced Analytics",
          description: "Comprehensive insights into your project's performance.",
          points: [
            "Real-time metrics tracking",
            "Performance optimization suggestions",
            "Gas usage analysis",
            "User behavior tracking"
          ]
        }
      ]
    },
    pricing: {
      title: "Pricing Plans",
      plans: [
        {
          name: "Starter",
          price: "$99/month",
          features: [
            "Basic AI agent access",
            "5 smart contract deployments",
            "Standard security checks",
            "Community support"
          ]
        },
        {
          name: "Professional",
          price: "$299/month",
          features: [
            "Advanced AI agents",
            "Unlimited deployments",
            "Premium security features",
            "24/7 priority support",
            "Custom wallet integration"
          ]
        },
        {
          name: "Enterprise",
          price: "Custom",
          features: [
            "Full suite of AI agents",
            "Custom agent development",
            "Dedicated support team",
            "SLA guarantees",
            "Advanced analytics"
          ]
        }
      ]
    },
    about: {
      title: "About Titan AI",
      sections: [
        {
          title: "Our Mission",
          content: "To revolutionize blockchain development through AI-powered automation and intelligence."
        },
        {
          title: "Technology",
          content: "Our CDP (Crypto Development Platform) combines advanced AI models with blockchain expertise to create intelligent agents capable of understanding, developing, and deploying smart contracts."
        },
        {
          title: "Innovation",
          content: "Each AI agent is equipped with its own crypto wallet, enabling direct interaction with blockchain networks and smart contracts."
        }
      ]
    },
    documentation: {
      title: "Documentation",
      sections: [
        {
          title: "Getting Started",
          content: "Quick start guides and basic concepts"
        },
        {
          title: "AI Agents",
          content: "Detailed documentation on each agent's capabilities"
        },
        {
          title: "Smart Contract Development",
          content: "Best practices and development guidelines"
        },
        {
          title: "API Reference",
          content: "Complete API documentation and examples"
        }
      ]
    }
  };
