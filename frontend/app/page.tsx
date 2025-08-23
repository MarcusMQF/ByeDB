'use client';

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Card } from "@/components/card";
import { InteractiveHoverButton } from "@/components/interactive-hover-button";
import GradientText from "@/components/gradient-text";
import AvatarGroup from "@/components/avatar-group";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { BentoCard, BentoGrid } from "@/components/bento-grid";
import { Database, MessageSquare, BarChart3, Shield, Zap, Users, ArrowRight, Sparkles, FileText, Brain, TrendingUp, Bot, ChevronUp, Send, Settings, Menu, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Typing effect component
function TypingPlaceholder({ text, speed = 100 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      // Reset after 3 seconds when animation completes
      const resetTimer = setTimeout(() => {
        setDisplayText('');
        setCurrentIndex(0);
      }, 3000);
      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex, text, speed]);

  // Reset animation when text changes
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className="text-gray-400">
      {displayText}
    </span>
  );
}

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [visibleElements, setVisibleElements] = useState(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMode, setChatMode] = useState<'agent' | 'ask'>('agent');
  const [selectedFeature, setSelectedFeature] = useState<number>(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elementsToObserve = document.querySelectorAll('[data-animate]');
    elementsToObserve.forEach(el => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const isVisible = (id: string) => visibleElements.has(id);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSend = () => {
    // Check if there's input to send
    if (!chatInput.trim()) return;
    
    console.log('Storing message in localStorage:', chatInput.trim());
    // Store the message in localStorage for the dashboard to pick up
    localStorage.setItem('byedb_landing_message', chatInput.trim());
    
    // Navigate to dashboard normally
    window.location.href = '/dashboard';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const developers = [
    {
      id: 1,
      name: "Marcus Mah",
      image: "/images/marcus.png",
      linkedin: "https://www.linkedin.com/in/mah-qing-fung/",
    },
    {
      id: 2,
      name: "Shan Chien",
      image: "/images/shanchien.png",
      linkedin: "https://www.linkedin.com/in/tan-shan-chien-232517337/",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fb] relative overflow-hidden">
      
      <div className="relative z-10">
        {/* Header */}
        <header className={`fixed top-3 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'transform -translate-y-full' 
            : 'transform translate-y-0'
        }`}>
          <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-3 relative">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl px-4 sm:px-8 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between">
                {/* Logo and Brand */}
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                  onClick={scrollToTop}
                >
                  <div className="relative">
                    <img 
                      src="/icons/crop.png" 
                      alt="ByeDB Icon" 
                      className="h-8 w-8 sm:h-10 sm:w-10"
                    />
                  </div>
                  <h1 className="font-medium text-gray-900 text-base sm:text-lg" style={{ fontFamily: 'sans-serif' }}>ByeDB</h1>
                </div>
                
                {/* Desktop Navigation Links - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg"
                    onClick={scrollToTop}
                  >
                    Home
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg"
                    onClick={() => scrollToSection('powerful-section')}
                  >
                    Features
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg"
                    onClick={() => scrollToSection('business-section')}
                  >
                    About
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg"
                    onClick={() => window.open('https://deepwiki.com/MarcusMQF/ByeDB/1-overview', '_blank')}
                  >
                    Docs
                  </Button>
                </div>

                {/* Desktop Support Us Button - Hidden on mobile */}
                <button
                  className="hidden md:inline-flex btn-design px-6 py-2 text-base items-center gap-2"
                  style={{ borderRadius: '9999px' }}
                  onClick={() => window.open('https://github.com/MarcusMQF/ByeDB', '_blank')}
                >
                  <Send className="h-4 w-4" />
                  Support Us
                </button>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 text-gray-700" />
                  ) : (
                    <Menu className="h-6 w-6 text-gray-700" />
                  )}
                </button>
              </div>

              {/* Mobile Menu */}
              {isMobileMenuOpen && (
                <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <button
                      className="w-full text-left px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => {
                        scrollToTop();
                        closeMobileMenu();
                      }}
                    >
                      Home
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => {
                        scrollToSection('powerful-section');
                        closeMobileMenu();
                      }}
                    >
                      Features
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => {
                        scrollToSection('business-section');
                        closeMobileMenu();
                      }}
                    >
                      About
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => {
                        window.open('https://deepwiki.com/MarcusMQF/ByeDB/1-overview', '_blank');
                        closeMobileMenu();
                      }}
                    >
                      Docs
                    </button>
                    <div className="pt-2">
                      <button
                        className="w-full btn-design px-6 py-3 text-base inline-flex items-center justify-center gap-2"
                        style={{ borderRadius: '9999px' }}
                        onClick={() => {
                          window.open('https://github.com/MarcusMQF/ByeDB', '_blank');
                          closeMobileMenu();
                        }}
                      >
                        <Send className="h-4 w-4" />
                        Support Us
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

                {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 pt-40 text-center relative">
          <div className="max-w-5xl mx-auto relative overflow-hidden">
            {/* Centered flickering grid background for hero */}
            <FlickeringGrid
              className="absolute left-1/2 -translate-x-1/2 top-2 w-[1200px] h-[620px] z-0 [mask-image:radial-gradient(650px_circle_at_center,white,transparent)] opacity-75 pointer-events-none"
              squareSize={5}
              gridGap={8}
              color="#60A5FA"
              maxOpacity={0.45}
              flickerChance={0.16}
              height={620}
              width={1200}
            />


            {/* Icon Badge */}
            <div 
              id="hero-badge"
              data-animate
              className={`inline-flex items-center justify-center mb-8 transition-all duration-1000 ${
                isVisible('hero-badge') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <img 
                src="/icons/white_icon.png" 
                alt="ByeDB Icon" 
                className="h-28 w-27"
              />
            </div>
            
            <h2 
              id="hero-title"
              data-animate
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[76px] font-normal mb-6 sm:mb-8 leading-tight -mt-2 sm:-mt-4 md:-mt-6 transition-all duration-1000 delay-200 ${
                isVisible('hero-title') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <span className="text-gray-900">
                Turn Natural Language into{" "}
              </span>
              <GradientText 
                colors={["#60a5fa", "#06b6d4", "#3b82f6", "#06b6d4", "#60a5fa"]}
                animationSpeed={6}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[76px] font-normal"
              >
                Powerful SQL
              </GradientText>
            </h2>
            
            <p 
              id="hero-description"
              data-animate
              className={`text-sm md:text-base text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed -mt-2 md:-mt-4 transition-all duration-1000 delay-400 ${
                isVisible('hero-description') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              Ask questions in plain English and get instant SQL queries, visualizations, and insights. 
              No coding required — just natural conversation with your data.
            </p>

            {/* Hero Chat Box */}
            <div
              id="hero-chat"
              data-animate
              className={`mx-auto max-w-3xl mb-8 transition-all duration-1000 delay-500 ${
                isVisible('hero-chat') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="relative rounded-2xl bg-white shadow-[0_6px_24px_rgba(0,0,0,0.06)] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="relative w-full min-h-[80px]">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full resize-none outline-none bg-transparent text-gray-800 text-base sm:text-lg min-h-[80px] absolute inset-0 z-10"
                        style={{ caretColor: chatInput ? 'auto' : 'transparent' }}
                      />
                      {!chatInput && (
                        <div className="absolute inset-0 pointer-events-none text-base sm:text-lg min-h-[80px] flex items-start pt-0 pl-0">
                          <TypingPlaceholder text="What's the first thing I should fix on my data?" speed={30} />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {/* Mode chips */}
                      <div className="flex items-center gap-2">
                        {/* Agent chip only */}
                        <button
                          type="button"
                          onClick={() => setChatMode('agent')}
                          className={`pl-3 pr-2 py-1.5 rounded-full text-sm flex items-center gap-1.5 border transition-all shadow-sm bg-white hover:shadow-md hover:-translate-y-[1px] ${
                            chatMode === 'agent' ? 'text-gray-800 border-gray-300' : 'text-gray-600 border-gray-300'
                          }`}
                        >
                          <Bot className="h-4 w-4" />
                          <span className="font-medium">Agent</span>
                          <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                        </button>
                      </div>

                      {/* Ask ByeDB black button with 3D hover */}
                      <button
                        onClick={handleSend}
                        className="btn-ask px-5 py-2 text-sm font-medium"
                      >
                        Ask ByeDB
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div 
              id="hero-cta"
              data-animate
              className={`flex justify-center mt-6 transition-all duration-1000 delay-500 ${
                isVisible('hero-cta') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <button
                                  className="btn-design px-8 py-4 text-lg inline-flex items-center gap-2"
                style={{ borderRadius: '9999px' }}
                onClick={() => window.location.href = '/dashboard'}
              >
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <p
              id="powered-by"
              className="relative z-20 mt-8 text-sm text-gray-600 inline-flex items-center justify-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Powered by Advanced AI Agent
            </p>
          </div>
        </section>

        <section id="business-section" className="py-42 relative bg-[#f5f8fb]">
          <div className="container mx-auto px-6">
            <div 
              id="marketing-features"
              data-animate
              className={`relative mx-auto max-w-7xl transition-all duration-1000 ${
                isVisible('marketing-features') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="rounded-3xl bg-[#e3e9ed] px-10 pt-20 pb-12 md:px-16 md:pt-24 md:pb-16">
                {/* Section badge */}
                <div className="flex justify-center -mt-10">
                  <span className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-[#edf6fc] text-gray-700 border border-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    Business Application
                  </span>
                </div>

                {/* Headline and subtext */}
                <h2 className="text-center text-4xl md:text-5xl font-normal text-gray-900 mt-6">
                  AI-Powered Data Intelligence
                </h2>
                <p className="text-center text-gray-600 mt-6">
                  Help you analyze your data and get insights with a second.
                </p>

                {/* Feature grid 3 cards */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="relative bg-[#f6fbff] rounded-2xl p-8 h-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute -top-3 -left-3 bg-white p-2 rounded-lg shadow-lg">
                      <Bot className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="text-4xl font-normal text-gray-900">Self-Correcting AI</h3>
                    <p className="text-base text-gray-600 mt-15">GPT can generate code, and when it works, it's great. But what if it doesn't? ByeDB.AI saves you from this frustrating loop. Our platform's function calls go back to the model itself, allowing it to learn and self-correct, ensuring a more reliable experience.</p>
                  </div>

                  {/* Card 2 */}
                  <div className="relative bg-[#f6fbff] rounded-2xl p-8 h-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute -top-3 -left-3 bg-white p-2 rounded-lg shadow-lg">
                      <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="text-4xl font-normal text-gray-900">Execution Confirmation</h3>
                    <p className="text-base text-gray-600 mt-15">Don't know SQL but need a database for your hackathon? ByeDB creates it for you. With execution confirmation, you review the query and click a button — simple as that. No fear of the model screwing up.</p>
                  </div>

                  {/* Card 3 */}
                  <div className="relative bg-[#f6fbff] rounded-2xl p-8 h-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute -top-3 -left-3 bg-white p-2 rounded-lg shadow-lg">
                      <Settings className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="text-4xl font-normal text-gray-900">Your Technical Assistant</h3>
                    <p className="text-base text-gray-600 mt-15">Non-technical and your coworker is on leave? Can't trust unknown GPT queries? ByeDB acts like a real technical person — straightforward, helpful, and equipped with visualization tools to draw insights for you.</p>
                  </div>
                </div>

                {/* Additional Features Section */}
                <div className="mt-16">
                  <div className="flex items-center justify-center gap-8 text-gray-700">
                    {/* Seamless Automation */}
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                      </svg>
                      <span className="text-base font-medium">Seamless Automation</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Real-Time Data Sync */}
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                      <span className="text-base font-medium">Real-Time Data Sync</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Secure Data Interaction */}
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"/>
                      </svg>
                      <span className="text-base font-medium">Secure Data Interaction</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Another Aspect Section */}
        <section id="powerful-section" className="py-32 relative bg-[#f5f8fb]">
          <div className="container mx-auto px-6">
            <div 
              id="another-aspect-header"
              data-animate
              className={`text-center mb-8 transition-all duration-1000 ${
                isVisible('another-aspect-header') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <h2 className="text-4xl md:text-5xl font-normal text-gray-900 mb-4">
                What makes ByeDB Powerful?
              </h2>
              <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Your AI-powered SQL Agent that transforms natural language questions into actionable insights and beautiful visualizations—effortlessly.
              </p>
            </div>

            <div 
              id="powerful-content"
              data-animate
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto transition-all duration-1000 delay-200 ${
                isVisible('powerful-content') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              {/* Left Side - Features */}
              <div className="space-y-6">
                <div 
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedFeature === 1 ? 'bg-white shadow-lg' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFeature(1)}
                >
                  <img src="/icons/agent.png" alt="Agent" className="w-18 h-18 mt-3" />
                  <div className="max-w-lg">
                    <h3 className="text-lg font-normal text-gray-900 mb-1">Multiagent AI Orchestration</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                    The system runs in two modes: ASK Mode, where the AI provides direct answers and explanations, and Agent Mode, where autonomous AI agents can interact with your dataset to complete user tasks.                    </p>
                  </div>
                </div>

                <div 
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedFeature === 2 ? 'bg-white shadow-lg' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFeature(2)}
                >
                  <img src="/icons/data.png" alt="Agent" className="w-18 h-18" />
                  <div className="max-w-lg">
                    <h3 className="text-lg font-normal text-gray-900 mb-1">Real-time Data Visualization</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                     Real-time visualization engine with dynamic charts, graphs, and analytics dashboards.
                    </p>
                  </div>
                </div>

                <div 
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedFeature === 3 ? 'bg-white shadow-lg' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFeature(3)}
                >
                  <img src="/icons/confirm.png" alt="Data" className="w-18 h-18 mt-1" />
                  <div className="max-w-lg">
                    <h3 className="text-lg font-normal text-gray-900 mb-1">Critical Operation Confirmation</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Mandatory verification protocols for write operations and destructive queries with real-time risk assessment.
                    </p>
                  </div>
                </div>

                <div 
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedFeature === 4 ? 'bg-white shadow-lg' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFeature(4)}
                >
                  <img src="/icons/education.png" alt="Export" className="w-18 h-18 mt-1" />
                  <div className="max-w-lg">
                    <h3 className="text-lg font-normal text-gray-900 mb-1">Educational Transparency</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                       AI decision explanation with a step-by-step reasoning breakdown, and full transparency on the exact SQL queries executed to perform user tasks. 
                    </p>
                  </div>
                </div>

                <div 
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedFeature === 5 ? 'bg-white shadow-lg' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFeature(5)}
                >
                  <img src="/icons/prompt.png" alt="Export" className="w-18 h-18 mt-1" />
                  <div className="max-w-lg">
                    <h3 className="text-lg font-normal text-gray-900 mb-1">Prompt Enhancement</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                       Advanced prompt engineering with semantic optimization for superior AI performance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side - Dynamic Content */}
              <div className="bg-gray-900 rounded-3xl p-6 shadow-xl h-[625px] flex items-center justify-center overflow-hidden ml-8">
                {selectedFeature === 1 && (
                  <img src="/images/agent.svg" alt="Agent" className="w-82 h-82" />
                )}
                {selectedFeature === 2 && (
                  <div className="flex flex-col gap-4 items-center justify-center">
                    <img src="/images/bar.svg" alt="Bar Chart" className="w-60 h-60 -ml-35" />
                    <img src="/images/pie.svg" alt="Pie Chart" className="w-60 h-60 ml-35" />
                  </div>
                )}
                {selectedFeature === 3 && (
                  <div className="flex flex-col gap-0 items-center justify-center">
                    <img src="/images/confirm.svg" alt="Confirmation" className="w-160 h-160 -ml-2" />
                    <img src="/images/success.svg" alt="Success" className="w-80 h-80 ml-35 -mt-60" />
                  </div>
                )}
                {selectedFeature === 4 && (
                  <div className="flex flex-col gap-4 items-center justify-center">
                    <img src="/images/explain.svg" alt="Explanation" className="w-130 h-130 ml-0" />
                    <img src="/images/queries.svg" alt="Education" className="w-120 h-120 ml-8 -mt-60" />
                  </div>
                )}
                {selectedFeature === 5 && (
                  <div className="flex flex-col gap-4 items-center justify-center">
                    <img src="/images/prompt.svg" alt="Prompt" className="w-150 h-150 -ml-15" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

          {/* Footer */}
          <footer className="relative py-12 overflow-hidden bg-[#f5f8fb]">
          <div className="container mx-auto px-6">
            <div 
              id="footer-content"
              className="relative mx-auto max-w-7xl relative z-10"
            >
              {/* Main Footer Content */}
              <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-8">
                {/* Brand Section */}
                <div className="flex items-start gap-4 -ml-2">
                  <div className="relative">
                    <img 
                      src="/icons/crop.png" 
                      alt="ByeDB Icon" 
                      className="h-12 w-12"
                    />
                    <div className="absolute inset-0 h-10 w-10 bg-blue-400/20 blur-md rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-normal text-gray-900 mb-1">ByeDB.AI</h3>
                    <p className="text-gray-600 leading-relaxed max-w-md text-sm">
                      Natural Language to SQL Made Simple. Transform your data queries with AI-powered intelligence.
                    </p>
                  </div>
                </div>

                {/* GitHub Section */}
                <div className="flex items-start">
                  <a 
                    href="https://github.com/MarcusMQF/ByeDB" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-github inline-flex items-center gap-3"
                    style={{ borderRadius: '9999px' }}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    Star on GitHub
                  </a>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="pt-10 border-t border-gray-200">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  {/* Developer Credits */}
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 font-medium">Built with ❤️ by</span>
                    <AvatarGroup 
                      items={developers} 
                      size="lg"
                      className="flex-shrink-0"
                    />
                  </div>
                  
                  {/* Copyright */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>© 2025 ByeDB.AI</span>
                    <span className="hidden sm:inline">•</span>
                    <span>All rights reserved.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
