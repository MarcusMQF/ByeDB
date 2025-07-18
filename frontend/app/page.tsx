'use client';

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Card } from "@/components/card";
import { InteractiveHoverButton } from "@/components/interactive-hover-button";
import GradientText from "@/components/gradient-text";
import AvatarGroup from "@/components/avatar-group";
import { BentoCard, BentoGrid } from "@/components/bento-grid";
import { Database, MessageSquare, BarChart3, Shield, Zap, Users, ArrowRight, Sparkles, FileText, Brain, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300 font-medium">Powered by Advanced AI</span>
            </div>
            
            <h2 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
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
            
            <p className="text-xl text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed">
              Ask questions in plain English and get instant SQL queries, visualizations, and insights. 
              No coding required—just natural conversation with your data.
            </p>
          </div>
        </section>

        {/* Platform Screenshot - Full Width */}
        <section className="relative w-full px-4 lg:px-8 pb-20 -mt-35">
          <div className="relative w-full max-w-[1400px] mx-auto">
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

        {/* Bento Grid Section */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6 relative">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Discover What ByeDB Can Do
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Empower your data science workflow with AI-driven insights, advanced analytics, and seamless visualization—all through natural conversation.
              </p>
            </div>

            <BentoGrid className="max-w-6xl mx-auto">
              <BentoCard
                name="Smart Query Generation"
                className="col-span-3 lg:col-span-1"
                background={
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-blue-600/5"></div>
                    <div className="absolute top-4 left-4 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-4 right-4 w-24 h-24 bg-indigo-400/15 rounded-full blur-2xl"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
                  </div>
                }
                Icon={Brain}
                description="Transform any question into optimized SQL queries with intelligent context understanding."
                href="/dashboard"
                cta="Try Now"
              />
              
              <BentoCard
                name="Interactive Visualizations"
                className="col-span-3 lg:col-span-2"
                background={
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/8"></div>
                    <div className="absolute top-8 right-8 w-40 h-40 bg-emerald-400/18 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-8 left-8 w-32 h-32 bg-teal-400/12 rounded-full blur-2xl"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.12),transparent_60%)]"></div>
                    <img 
                      src="/chat.png" 
                      alt="Interactive Chat" 
                      className="absolute bottom-6 right-6 w-28 h-28 object-contain opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                    />
                  </div>
                }
                Icon={TrendingUp}
                description="Auto-generated charts and graphs that update in real-time as you refine your questions."
                href="/dashboard"
                cta="Explore"
              />

              <BentoCard
                name="Document Analysis"
                className="col-span-3 lg:col-span-2"
                background={
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-fuchsia-500/8"></div>
                    <div className="absolute top-4 left-1/2 w-36 h-36 bg-violet-400/18 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-4 right-1/4 w-28 h-28 bg-purple-400/12 rounded-full blur-2xl"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(139,92,246,0.12),transparent_65%)]"></div>
                    <div className="absolute bottom-8 left-8 flex gap-3 opacity-50 group-hover:opacity-70 transition-opacity duration-500">
                      <img src="/csv-file.png" alt="CSV" className="w-6 h-6" />
                      <img src="/xlsx-file.png" alt="XLSX" className="w-6 h-6" />
                    </div>
                  </div>
                }
                Icon={FileText}
                description="Upload CSV, Excel, or connect to databases. Ask questions about any data source instantly."
                href="/dashboard"
                cta="Upload Data"
              />

              <BentoCard
                name="Enterprise Security"
                className="col-span-3 lg:col-span-1"
                background={
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500/15 via-gray-500/10 to-zinc-500/8"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-slate-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(100,116,139,0.15),transparent_70%)]"></div>
                  </div>
                }
                Icon={Shield}
                description="Bank-grade security with read-only access. Your data stays safe and private."
                href="/dashboard"
                cta="Learn More"
              />
            </BentoGrid>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your Data Analysis?
                </h2>
                <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                  Join thousands of users who've made data analysis as simple as having a conversation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="h-14 px-10 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-full shadow-lg shadow-blue-500/25" asChild>
                    <a href="/dashboard" className="flex items-center gap-2">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" className="h-14 px-10 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/30 rounded-full transition-all duration-200" asChild>
                    <a href="/dashboard">Try Demo</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col gap-6">
              {/* Main footer content */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src="/icon.png" 
                      alt="ByeDB Icon" 
                      className="h-8 w-8"
                    />
                    <div className="absolute inset-0 h-6 w-6 bg-blue-400/20 blur-md rounded-full"></div>
                  </div>
                  <span className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">ByeDB</span>
                </div>
                <p className="text-gray-500">
                  © 2024 ByeDB. Natural Language to SQL Made Simple.
                </p>
              </div>
              
              {/* Developer credits */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/5">
                <span className="text-sm text-gray-400">Built with ❤️ by</span>
                <AvatarGroup 
                  items={developers} 
                  size="sm"
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
