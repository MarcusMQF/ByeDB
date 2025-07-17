'use client';

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Card } from "@/components/card";
import { InteractiveHoverButton } from "@/components/interactive-hover-button";
import GradientText from "@/components/gradient-text";
import { Database, MessageSquare, BarChart3, Shield, Zap, Users, ArrowRight, Sparkles } from "lucide-react";
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
          <div className="relative w-full max-w-[1200px] mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/5 rounded-lg px-4 py-2 text-sm text-gray-400">
                    https://byedb.com/dashboard
                  </div>
                </div>
              </div>

              {/* Actual Platform Image */}
              <div className="relative rounded-xl overflow-hidden">
                <img 
                  src="/byedb_capture.png" 
                  alt="ByeDB Platform Dashboard" 
                  className="w-full h-auto rounded-xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center">

             {/* Feature Highlights */}
             <div className="grid md:grid-cols-3 gap-8 mt-20">
               <div className="text-center">
                 <div className="relative inline-flex mb-4">
                   <MessageSquare className="h-8 w-8 text-blue-400" />
                   <div className="absolute inset-0 h-8 w-8 bg-blue-400/20 blur-md rounded-full"></div>
                 </div>
                 <h3 className="text-lg font-semibold mb-2 text-white">Interactive Disambiguation</h3>
                 <p className="text-gray-400 text-sm">
                   Smart clarification when your question could mean multiple things
                 </p>
               </div>
               
               <div className="text-center">
                 <div className="relative inline-flex mb-4">
                   <Shield className="h-8 w-8 text-green-400" />
                   <div className="absolute inset-0 h-8 w-8 bg-green-400/20 blur-md rounded-full"></div>
                 </div>
                 <h3 className="text-lg font-semibold mb-2 text-white">Explainable Results</h3>
                 <p className="text-gray-400 text-sm">
                   See the generated SQL and understand how results were calculated
                 </p>
               </div>
               
               <div className="text-center">
                 <div className="relative inline-flex mb-4">
                   <BarChart3 className="h-8 w-8 text-purple-400" />
                   <div className="absolute inset-0 h-8 w-8 bg-purple-400/20 blur-md rounded-full"></div>
                 </div>
                 <h3 className="text-lg font-semibold mb-2 text-white">Auto Visualizations</h3>
                 <p className="text-gray-400 text-sm">
                   Intelligent charts generated automatically based on your data
                 </p>
               </div>
             </div>
           </div>
         </section>

        {/* Features Section */}
        <section className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent"></div>
          <div className="container mx-auto px-6 relative">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Why Choose ByeDB?
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Built for both technical and non-technical users, with enterprise-grade security and performance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex items-start gap-6 group">
                <div className="relative">
                  <Zap className="h-10 w-10 text-yellow-400 mt-1" />
                  <div className="absolute inset-0 h-10 w-10 bg-yellow-400/20 blur-md rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Lightning Fast</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Get results in seconds, not minutes. Optimized for performance at scale.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6 group">
                <div className="relative">
                  <Users className="h-10 w-10 text-blue-400 mt-1" />
                  <div className="absolute inset-0 h-10 w-10 bg-blue-400/20 blur-md rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Conversational Context</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Ask follow-up questions naturally. "Now show me just the US data" just works.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6 group">
                <div className="relative">
                  <Shield className="h-10 w-10 text-red-400 mt-1" />
                  <div className="absolute inset-0 h-10 w-10 bg-red-400/20 blur-md rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Safety First</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Read-only by design. No risk of accidental data modification or deletion.
                  </p>
                </div>
              </div>
            </div>
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
          </div>
        </footer>
      </div>
    </div>
  );
}
