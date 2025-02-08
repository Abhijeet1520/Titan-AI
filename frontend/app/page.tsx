"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { modalContent, ModalContentMap } from '@/data/modalContent';
import {
  Blocks,
  Bot,
  Brain,
  CheckCircle2,
  Code2,
  Megaphone,
  MessageSquare,
  Rocket,
  Search,
  Shield,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

function Home() {
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);
  const [activeModal, setActiveModal] = useState<string | null>(null);

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

  const handleRedirectToChat = () => {
    window.location.href = `${window.location.origin}/chat`;
  };

  const renderModalContent = () => {
    if (!activeModal) return null;

    const content = modalContent[activeModal as keyof typeof modalContent];

    switch (activeModal) {
      case 'features':
        const featuresContent = content as ModalContentMap['features'];
        return (
          <div className="space-y-8">
            {featuresContent.content.map((feature, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
                <ul className="list-disc list-inside space-y-2">
                  {feature.points.map((point, i) => (
                    <li key={i} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );

      case 'pricing':
        const pricingContent = content as ModalContentMap['pricing'];
        return (
          <div className="grid md:grid-cols-3 gap-6">
            {pricingContent.plans.map((plan, idx) => (
              <div key={idx} className="border rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-2xl font-bold text-blue-600">{plan.price}</p>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleRedirectToChat}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        );

      case 'about': {
        const aboutContent = content as ModalContentMap['about'];
        return (
          <div className="space-y-8">
            {aboutContent.sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-600">{section.title}</h3>
                <p className="text-gray-700 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        );
      }

      case 'documentation': {
        const documentationContent = content as ModalContentMap['documentation'];
        return (
          <div className="space-y-6">
            {documentationContent.sections.map((section, idx) => (
              <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                <p className="text-gray-600">{section.content}</p>
              </div>
            ))}
            <div className="mt-6">
              <button
                onClick={handleRedirectToChat}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Documentation
              </button>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

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
              <Image src="/android-chrome-192x192.png" alt="Titan AI Logo" width={32} height={32} />
              <span className="font-bold text-2xl text-blue-600">Titan AI</span>
            </div>
            <button
              onClick={handleRedirectToChat}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Open Platform
            </button>
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
              From ideation to deployment, Titan AI helps you create, develop, and launch your business with confidence.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleRedirectToChat}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleRedirectToChat}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-blue-200"
              >
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Section */}
      <div id="journey-section" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">Your Journey with Titan AI</h2>

          <div className="space-y-32">
            {journeySteps.map((step, index) => (
              <div
                key={step.id}
                className={`journey-step flex flex-col lg:flex-row items-center gap-12 transition-opacity duration-500 ${
                  Math.abs(activeJourneyStep - index) <= 1 ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={800}
                    height={600}
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
            Titan AI seamlessly integrates with major language models and supports custom implementations for specialized needs.
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
            Join thousands of entrepreneurs who are building their dreams with Titan AI.
          </p>
          <button
            onClick={handleRedirectToChat}
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
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
                <span className="font-bold text-white">Titan AI</span>
              </div>
              <p className="text-sm">Building the future of business development with AI.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setActiveModal('features')}
                    className="hover:text-blue-400 transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('pricing')}
                    className="hover:text-blue-400 transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('documentation')}
                    className="hover:text-blue-400 transition-colors"
                  >
                    Documentation
                  </button>
                </li>
                <li>
                  <button onClick={handleRedirectToChat} className="hover:text-blue-400 transition-colors">
                    API
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setActiveModal('about')}
                    className="hover:text-blue-400 transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button onClick={handleRedirectToChat} className="hover:text-blue-400 transition-colors">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={handleRedirectToChat} className="hover:text-blue-400 transition-colors">
                    Careers
                  </button>
                </li>
                <li>
                  <button onClick={handleRedirectToChat} className="hover:text-blue-400 transition-colors">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={handleRedirectToChat} className="hover:text-blue-400 transition-colors">
                    Privacy
                  </button>
                </li>
                <li>
                  <button onClick={handleRedirectToChat} className="hover:text-blue-400 transition-colors">
                    Terms
                  </button>
                </li>
                <li>
                  <button onClick={handleRedirectToChat} className="hover:text-blue-400 transition-colors">
                    Security
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © 2025 Titan AI. Created by <a href="https://abhi1520.com">Abhijeet1520</a>. All rights reserved.
          </div>
        </div>
      </footer>

      <Dialog open={activeModal !== null} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {activeModal ? modalContent[activeModal as keyof typeof modalContent].title : ''}
            </DialogTitle>
          </DialogHeader>
          {renderModalContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Home;
