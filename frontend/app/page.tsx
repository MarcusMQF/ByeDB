import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Card } from "@/components/card";
import { Database, MessageSquare, BarChart3, Shield, Zap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ByeDB</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost">Features</Button>
            <Button variant="ghost">Docs</Button>
            <Button asChild>
              <a href="/dashboard">Get Started</a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Turn Natural Language into{" "}
            <span className="text-blue-600">Powerful SQL</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Ask questions in plain English and get instant SQL queries, visualizations, and insights. 
            No coding required - just natural conversation with your data.
          </p>
          
          {/* Demo Input */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <Input 
                placeholder="Try: 'Show me top 10 customers by revenue last month'"
                className="flex-1 h-12 text-base"
              />
              <Button size="lg" className="h-12 px-8" asChild>
                <a href="/dashboard">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask
                </a>
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="p-6 text-left">
              <MessageSquare className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive Disambiguation</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Smart clarification when your question could mean multiple things. Get exactly what you need.
              </p>
            </Card>
            
            <Card className="p-6 text-left">
              <Shield className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Explainable Results</h3>
              <p className="text-slate-600 dark:text-slate-300">
                See the generated SQL and understand exactly how your results were calculated.
              </p>
            </Card>
            
            <Card className="p-6 text-left">
              <BarChart3 className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Auto Visualizations</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Intelligent charts and graphs generated automatically based on your data type.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-slate-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose ByeDB?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Built for both technical and non-technical users, with enterprise-grade security and performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <Zap className="h-8 w-8 text-yellow-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Get results in seconds, not minutes. Optimized for performance at scale.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <Users className="h-8 w-8 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Conversational Context</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Ask follow-up questions naturally. "Now show me just the US data" just works.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-red-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Safety First</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Read-only by design. No risk of accidental data modification or deletion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Transform Your Data Analysis?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              Join thousands of users who've made data analysis as simple as having a conversation.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="h-12 px-8" asChild>
                <a href="/dashboard">Start Free Trial</a>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                <a href="/dashboard">Try Demo</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              <span className="text-lg font-semibold">ByeDB</span>
            </div>
            <p className="text-slate-400">
              © 2024 ByeDB. Natural Language to SQL Made Simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
