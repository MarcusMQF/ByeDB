'use client';

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Card } from "@/components/card";
import { InteractiveHoverButton } from "@/components/interactive-hover-button";
import GradientText from "@/components/gradient-text";
import AvatarGroup from "@/components/avatar-group";
import { BentoCard, BentoGrid } from "@/components/bento-grid";
import { Database, MessageSquare, BarChart3, Shield, Zap, Users, ArrowRight, Sparkles, FileText, Brain, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [visibleElements, setVisibleElements] = useState(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const developers = [
    {
      id: 1,
      name: "Marcus",
      designation: "Frontend Developer",
      image: "/images/marcus.png",
    },
    {
      id: 2,
      name: "Shan Chien",
      designation: "Backend Developer",
      image: "/images/shanchien.png",
    },
    {
      id: 3,
      name: "Hong Zhang",
      designation: "Backend Developer",
      image: "/images/kim.png",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0">
        {/* Primary blue glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full"></div>
        {/* Secondary purple glow */}
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-500/15 blur-[100px] rounded-full"></div>
        {/* Accent cyan glow */}
        <div className="absolute top-60 left-1/4 w-[300px] h-[300px] bg-cyan-400/10 blur-[80px] rounded-full"></div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f]"></div>
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl shadow-lg shadow-black/20' 
            : 'border-b border-transparent bg-transparent backdrop-blur-none'
        }`}>
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/icon.png" 
                  alt="ByeDB Icon" 
                  className="h-10 w-10 drop-shadow-lg"
                />
                <div className="absolute inset-0 h-8 w-8 bg-blue-400/30 blur-md rounded-full"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg">ByeDB</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Button variant="ghost" className={`transition-all duration-200 ${
                isScrolled 
                  ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                  : 'text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm'
              }`}>Features</Button>
              <Button variant="ghost" className={`transition-all duration-200 ${
                isScrolled 
                  ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                  : 'text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm'
              }`}>Docs</Button>
              <InteractiveHoverButton 
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-blue-500 shadow-lg shadow-blue-500/25"
                onClick={() => window.location.href = '/dashboard'}
              >
                Get Started
              </InteractiveHoverButton>
            </nav>
          </div>
        </header>

                {/* Hero Section */}
        <section className="container mx-auto px-6 py-32 pt-40 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div 
              id="hero-badge"
              data-animate
              className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8 transition-all duration-1000 ${
                isVisible('hero-badge') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300 font-medium">Powered by Advanced AI</span>
            </div>
            
            <h2 
              id="hero-title"
              data-animate
              className={`text-6xl md:text-7xl font-bold mb-8 leading-tight transition-all duration-1000 delay-200 ${
                isVisible('hero-title') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Turn Natural Language into{" "}
              </span>
              <GradientText 
                colors={["#60a5fa", "#06b6d4", "#3b82f6", "#06b6d4", "#60a5fa"]}
                animationSpeed={6}
                className="text-6xl md:text-7xl"
              >
                Powerful SQL
              </GradientText>
            </h2>
            
            <p 
              id="hero-description"
              data-animate
              className={`text-xl text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${
                isVisible('hero-description') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              Ask questions in plain English and get instant SQL queries, visualizations, and insights. 
              No coding required—just natural conversation with your data.
            </p>
          </div>
        </section>

        {/* Platform Screenshot - Full Width */}
        <section className="relative w-full px-4 lg:px-8 pb-20 -mt-35">
          <div 
            id="platform-screenshot"
            data-animate
            className={`relative w-full max-w-[1400px] mx-auto transition-all duration-1000 delay-200 ${
              isVisible('platform-screenshot') 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-12 scale-95'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2 overflow-hidden">
              {/* Chat Interface Image */}
              <div className="relative rounded-2xl overflow-hidden">
                <img 
                  src="/images/chat.png" 
                  alt="ByeDB Chat Interface" 
                  className="w-full h-auto rounded-2xl shadow-2xl object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6">
            <div 
              id="features-header"
              data-animate
              className={`text-center mb-20 transition-all duration-1000 ${
                isVisible('features-header') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Complete Data Analysis Workflow
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                From natural language queries to stunning visualizations, ByeDB streamlines every step of your data journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Feature 1: Smart SQL Generation */}
              <div 
                id="feature-1"
                data-animate
                className={`group relative transition-all duration-1000 delay-100 ${
                  isVisible('feature-1') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-blue-600/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="mb-6">
                    <div className="relative w-full h-48 mb-6 overflow-hidden rounded-2xl">
                      <img 
                        src="/images/ask_agent.png" 
                        alt="Natural Language Query" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <MessageSquare className="h-6 w-6 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Natural Language Queries</h3>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Simply ask questions in plain English and watch as ByeDB converts them into optimized SQL queries automatically.
                  </p>
                  <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                    <span>Try a query</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Feature 2: SQL Execution */}
              <div 
                id="feature-2"
                data-animate
                className={`group relative transition-all duration-1000 delay-200 ${
                  isVisible('feature-2') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="mb-6">
                    <div className="relative w-full h-48 mb-6 overflow-hidden rounded-2xl">
                      <img 
                        src="/images/sql_execution.png" 
                        alt="SQL Execution" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <Database className="h-6 w-6 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Instant SQL Execution</h3>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Execute complex queries instantly with our optimized database engine. Get results in milliseconds, not minutes.
                  </p>
                  <div className="flex items-center text-emerald-400 text-sm font-medium group-hover:text-emerald-300 transition-colors">
                    <span>Execute query</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Feature 3: Data Visualization */}
              <div 
                id="feature-3"
                data-animate
                className={`group relative transition-all duration-1000 delay-300 ${
                  isVisible('feature-3') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-fuchsia-500/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="mb-6">
                    <div className="relative w-full h-48 mb-6 overflow-hidden rounded-2xl">
                      <img 
                        src="/images/visualize.png" 
                        alt="Data Visualization" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <BarChart3 className="h-6 w-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Smart Visualizations</h3>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Transform your data into beautiful, interactive charts and graphs automatically. Perfect for presentations and reports.
                  </p>
                  <div className="flex items-center text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
                    <span>Create chart</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Feature 4: Data Upload */}
              <div 
                id="feature-4"
                data-animate
                className={`group relative transition-all duration-1000 delay-100 ${
                  isVisible('feature-4') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="mb-6">
                    <div className="relative w-full h-48 mb-6 overflow-hidden rounded-2xl">
                      <img 
                        src="/images/dataset.png" 
                        alt="Dataset Management" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-500/20 rounded-xl">
                        <FileText className="h-6 w-6 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Easy Data Import</h3>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Upload CSV, Excel files, or connect to existing databases. Support for multiple data sources and formats.
                  </p>
                  <div className="flex items-center text-orange-400 text-sm font-medium group-hover:text-orange-300 transition-colors">
                    <span>Upload data</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Feature 5: Export Results */}
              <div 
                id="feature-5"
                data-animate
                className={`group relative transition-all duration-1000 delay-200 ${
                  isVisible('feature-5') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="mb-6">
                    <div className="relative w-full h-48 mb-6 overflow-hidden rounded-2xl">
                      <img 
                        src="/images/export.png" 
                        alt="Export Results" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-cyan-500/20 rounded-xl">
                        <ArrowRight className="h-6 w-6 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Export & Share</h3>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Export your results, charts, and reports in multiple formats. Share insights with your team effortlessly.
                  </p>
                  <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:text-cyan-300 transition-colors">
                    <span>Export data</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Feature 6: AI Enhancement */}
              <div 
                id="feature-6"
                data-animate
                className={`group relative transition-all duration-1000 delay-300 ${
                  isVisible('feature-6') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-pink-500/10 to-red-500/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="mb-6">
                    <div className="relative w-full h-48 mb-6 overflow-hidden rounded-2xl">
                      <img 
                        src="/images/enhance_prompting.png" 
                        alt="AI Enhancement" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-rose-500/20 rounded-xl">
                        <Sparkles className="h-6 w-6 text-rose-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">AI-Powered Insights</h3>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Get intelligent suggestions, query optimizations, and insights powered by advanced AI to enhance your analysis.
                  </p>
                  <div className="flex items-center text-rose-400 text-sm font-medium group-hover:text-rose-300 transition-colors">
                    <span>Get insights</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div 
              id="features-cta"
              data-animate
              className={`text-center mt-16 transition-all duration-1000 delay-400 ${
                isVisible('features-cta') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <Button size="lg" className="h-14 px-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-full shadow-lg shadow-blue-500/25" asChild>
                <a href="/dashboard" className="flex items-center gap-2">
                  Experience All Features
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-white/5 py-16 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-blue-500/5 blur-[100px] rounded-full"></div>
          
          <div 
            id="footer-content"
            data-animate
            className={`container mx-auto px-6 relative z-10 transition-all duration-1000 ${
              isVisible('footer-content') 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="flex flex-col gap-8">
              {/* Main footer content */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Brand section */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src="/icon.png" 
                      alt="ByeDB Icon" 
                      className="h-10 w-10 drop-shadow-lg"
                    />
                    <div className="absolute inset-0 h-8 w-8 bg-blue-400/30 blur-md rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-gray-300 bg-clip-text text-transparent">ByeDB</span>
                    <span className="text-sm text-gray-400">Natural Language to SQL Made Simple</span>
                  </div>
                </div>

                {/* GitHub link */}
                <div className="flex items-center gap-4">
                  <a 
                    href="https://github.com/MarcusMQF/ByeDB" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                  >
                    <svg className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">View on GitHub</span>
                  </a>
                </div>
              </div>
              
              {/* Developer credits */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Built with ❤️ by</span>
                  <AvatarGroup 
                    items={developers} 
                    size="sm"
                    className="flex-shrink-0"
                  />
                </div>
                
                {/* Copyright */}
                <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-gray-500">
                  <span>© 2025 ByeDB.</span>
                  <span className="hidden sm:inline">•</span>
                  <span>All rights reserved.</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
