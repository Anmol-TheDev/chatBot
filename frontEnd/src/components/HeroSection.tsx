import { motion } from 'framer-motion';
import { ChatbotVisual } from './ChatbotVisual';
import { Shield, Clock, Database } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-12 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute left-0 top-1/4 w-32 h-96 opacity-[0.03] pointer-events-none hidden lg:block">
        <svg viewBox="0 0 100 300" fill="currentColor" className="text-foreground">
          {/* Ancient Column */}
          <rect x="20" y="0" width="60" height="20" />
          <rect x="25" y="20" width="50" height="260" />
          <rect x="20" y="280" width="60" height="20" />
        </svg>
      </div>

      <div className="absolute left-8 top-1/3 w-24 opacity-[0.04] pointer-events-none hidden lg:block">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-foreground">
          {/* Leaves */}
          <path d="M50 10 Q30 30 50 50 Q70 30 50 10" />
          <path d="M50 30 Q30 50 50 70 Q70 50 50 30" />
          <path d="M50 50 Q30 70 50 90 Q70 70 50 50" />
        </svg>
      </div>

      <div className="absolute right-0 top-1/4 w-40 h-64 opacity-[0.03] pointer-events-none hidden lg:block">
        <svg viewBox="0 0 150 250" fill="currentColor" className="text-foreground">
          {/* Broken Arch */}
          <path d="M10 250 L10 100 Q75 0 140 100 L140 150" />
          <path d="M0 250 L150 250" />
        </svg>
      </div>

      {/* Radial Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1400px] w-full mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 text-center lg:text-left"
          >
  

            {/* Headline */}
            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
              >
                <div className="text-foreground">Meet your intelligent</div>
                <div className="bg-linear-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  Ancient AI Assistant
                </div>
              </motion.h1>
            </div>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto lg:mx-0 bg-background/30 rounded-sm px-2"
            >
              Powered by your company's knowledge base, documents, and workflows. 
              Deliver instant answers with a premium AI support experience.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                Start Chatting
              </button>
              <button className="px-8 py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-base hover:bg-accent transition-colors border border-border">
                View Demo
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-6 justify-center lg:justify-start pt-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-foreground">Instant Answers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Secure Knowledge Base</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Chatbot Visual */}
          <div className="flex justify-center lg:justify-end">
            <ChatbotVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
