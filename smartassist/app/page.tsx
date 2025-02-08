"use client";
import React, { useState, useEffect } from 'react';
import {
  Blocks,
  Brain,
  FileCode,
  Shield,
  Zap,
  Bot,
  Wallet,
  Settings,
  ChevronDown,
  Terminal,
  GitBranch,
  Plus,
  Download,
  Menu,
  XCircle,
  Rocket,
  Search,
  Code2,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  Megaphone,
  Sparkles
} from 'lucide-react';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTab, setSelectedTab] = useState('ideation');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);

  const journeySteps = [
    {
      id: 'research',
      title: 'Market Research & Analysis',
      description: 'Our Research Agent conducts comprehensive market analysis, identifies opportunities, and evaluates competition. Get detailed insights about market size, trends, and potential challenges.',
      icon: Search,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800&h=600',
      features: [
        'Market size analysis',
        'Competitor research',
        'Trend identification',
        'SWOT analysis'
      ]
    },
    {
      id: 'development',
      title: 'Development & Implementation',
      description: 'The Development Agent transforms ideas into reality, handling technical implementation with best practices and optimal performance in mind.',
      icon: Code2,
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800&h=600',
      features: [
        'Code generation',
        'Architecture planning',
        'Performance optimization',
        'Best practices implementation'
      ]
    },
    {
      id: 'security',
      title: 'Security & Auditing',
      description: 'Our Security Agent performs thorough code audits, identifies vulnerabilities, and ensures your business implementation is secure and robust.',
      icon: Shield,
      image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800&h=600',
      features: [
        'Vulnerability scanning',
        'Code auditing',
        'Security best practices',
        'Compliance checks'
      ]
    },
    {
      id: 'deployment',
      title: 'Deployment & Operations',
      description: 'The Deployment Agent handles the entire deployment process, ensuring smooth operations and monitoring system performance.',
      icon: Rocket,
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800&h=600',
      features: [
        'Automated deployment',
        'Performance monitoring',
        'Scaling management',
        'Infrastructure setup'
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing & Growth',
      description: 'Our Marketing Agent develops comprehensive strategies to promote your business and drive growth through various channels.',
      icon: Megaphone,
      image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=800&h=600',
      features: [
        'Marketing strategy',
        'Content creation',
        'Social media planning',
        'Growth analytics'
      ]
    }
  ];

  const llmOptions = [
    {
      name: 'GPT-4',
      description: 'Advanced reasoning and complex task handling',
      icon: Sparkles
    },
    {
      name: 'Claude 2',
      description: 'Exceptional analysis and detailed responses',
      icon: Brain
    },
    {
      name: 'Custom LLM',
      description: 'Use your own fine-tuned models',
      icon: Bot
    },
    {
      name: 'Palm 2',
      description: 'Efficient and versatile processing',
      icon: MessageSquare
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const journeySection = document.getElementById('journey-section');
      if (journeySection) {
        const steps = journeySection.getElementsByClassName('journey-step');
        const windowHeight = window.innerHeight;

        Array.from(steps).forEach((step, index) => {
          const rect = step.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= windowHeight * 0.5) {
            setActiveJourneyStep(index);
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Blocks className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-2xl text-blue-600">SmartAI</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsWalletConnected(!isWalletConnected)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isWalletConnected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Wallet className="w-4 h-4" />
                {isWalletConnected ? 'Connected' : 'Connect Wallet'}
              </button>

              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Build Your Business with
              <span className="text-blue-600"> AI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              From ideation to deployment, SmartAI helps you create, develop, and launch your business with confidence.
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Get Started
              </button>
              <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-blue-200">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Section */}
      <div id="journey-section" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">Your Journey with SmartAI</h2>

          <div className="space-y-32">
            {journeySteps.map((step, index) => (
              <div
                key={step.id}
                className={`journey-step flex flex-col lg:flex-row items-center gap-12 transition-opacity duration-500 ${
                  Math.abs(activeJourneyStep - index) <= 1 ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <img
                    src={step.image}
                    alt={step.title}
                    className="rounded-xl shadow-lg w-full h-[400px] object-cover"
                  />
                </div>
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <step.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-blue-600 font-medium">Step {index + 1}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-600 mb-6">{step.description}</p>
                  <ul className="space-y-3">
                    {step.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LLM Support Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Compatible with Leading LLMs</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            SmartAI seamlessly integrates with major language models and supports custom implementations for specialized needs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {llmOptions.map((llm, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <llm.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">{llm.name}</h3>
                </div>
                <p className="text-gray-600 text-sm">{llm.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who are building their dreams with SmartAI.
          </p>
          <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Start Building Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Blocks className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-white">SmartAI</span>
              </div>
              <p className="text-sm">Building the future of business development with AI.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>Features</li>
                <li>Pricing</li>
                <li>Documentation</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © 2025 SmartAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
