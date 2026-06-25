'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  Cpu, 
  Activity, 
  BarChart3, 
  ChevronRight, 
  CheckCircle2, 
  Award, 
  Clock, 
  ShieldCheck, 
  Compass, 
  Lightbulb, 
  Layers, 
  FileQuestion,
  HelpCircle,
  Sparkles
} from 'lucide-react';

const stats = [
  { value: '50,000+', label: 'Students Assessed', icon: Cpu },
  { value: '60', label: 'Expert Questions', icon: FileQuestion },
  { value: '45 Mins', label: 'Assessment Timer', icon: Clock },
  { value: 'AI-Powered', label: 'Intelligence Profile', icon: BrainCircuit },
];

const domains = [
  {
    title: 'Logical Reasoning',
    desc: 'Evaluate deductive capabilities, puzzle solving, heuristic modeling, and structural logic.',
    icon: Compass,
    color: 'from-red-500 to-rose-600',
  },
  {
    title: 'Pattern Recognition',
    desc: 'Test spatial-temporal sequencing, grid matrices, shape transformations, and structural order.',
    icon: Layers,
    color: 'from-red-500 to-rose-600',
  },
  {
    title: 'Numerical Intelligence',
    desc: 'Measure quantitative manipulation, rates of change, algebraic grids, and math sequences.',
    icon: Activity,
    color: 'from-rose-500 to-pink-600',
  },
  {
    title: 'Verbal Reasoning',
    desc: 'Refine textual comprehension, semantic analogies, logical arguments, and syntax relations.',
    icon: Lightbulb,
    color: 'from-red-600 to-rose-600',
  },
  {
    title: 'Analytical Thinking',
    desc: 'Challenge data sufficiency sorting, overlapping set configurations, and multi-variable grids.',
    icon: BarChart3,
    color: 'from-pink-600 to-rose-500',
  },
  {
    title: 'Problem Solving',
    desc: 'Evaluate algorithmic optimization, critical bottle-neck mitigation, and spatial calculations.',
    icon: BrainCircuit,
    color: 'from-rose-500 to-red-600',
  },
];

const steps = [
  { step: '01', title: 'Start Assessment', desc: 'Initialize your exam session securely.' },
  { step: '02', title: 'Answer 60 Questions', desc: 'Solve challenging CAT/GMAT-level logic and pattern queries.' },
  { step: '03', title: 'Generate Profile', desc: 'Wait for our local scoring engines to construct your cognitive breakdown.' },
  { step: '04', title: 'Unlock Premium Report', desc: 'Choose a report tier and review personalized career recommendations.' },
  { step: '05', title: 'Download Certificate', desc: 'Secure your unique verification ID and print your formal diploma.' },
];

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col bg-white text-black relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-500/5 blur-[150px] pointer-events-none" />
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-black text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-lg tracking-tight text-white">COLLEGE SIMPLIFIED</span>
              <span className="text-[10px] tracking-widest text-primary font-bold">IQ ASSESSMENT</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#why-take" className="hover:text-primary transition-colors">Why Assessment</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#faqs" className="hover:text-primary transition-colors">FAQs</a>
          </nav>
          
            <Link 
              href="/instructions" 
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#222222] border border-transparent hover:border-slate-800 text-white font-semibold text-sm transition-all duration-300 flex items-center gap-1.5"
            >
              Start Assessment
              <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-12 pb-20 md:py-28 flex flex-col lg:flex-row items-center gap-16 z-10">
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-4 h-4" />
              Scientifically Validated Student IQ Assessment
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-black tracking-tight leading-tight mb-6"
          >
            Measure Your Intelligence With{' '}
            <span className="text-gradient-red">College Simplified's</span> Advanced IQ Assessment
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-700 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0"
          >
            Discover your cognitive strengths through a scientifically structured assessment covering logical reasoning, numerical intelligence, analytical thinking, pattern recognition, verbal reasoning, and advanced problem-solving.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link
              href="/instructions"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-black text-white font-semibold shadow-lg shadow-red-500/10 text-center flex items-center justify-center gap-2 transition-all duration-300"
            >
              Start Free Test
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href="#why-take"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white border border-black hover:bg-black hover:text-white text-black font-semibold text-center transition-all shadow-sm"
            >
              Learn More
            </a>
          </motion.div>        </div>

        {/* Futuristic SVG Brain / Neural Net Visualization */}
        <div className="flex-1 w-full max-w-lg relative flex justify-center items-center">
          {/* Floating Analytics Card 1 */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-[-20px] z-20 glass-card px-4 py-3 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-primary border border-red-500/10">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Processing Speed</div>
              <div className="text-sm font-bold text-slate-800">128ms</div>
            </div>
          </motion.div>

          {/* Floating Analytics Card 2 */}
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-12 right-[-20px] z-20 glass-card px-4 py-3 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">National Rank</div>
              <div className="text-sm font-bold text-gradient-gold">Top 4.2%</div>
            </div>
          </motion.div>

          {/* Glowing Neural Network Base Grid */}
          <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
            {/* Pulsing light rings */}
            <div className="absolute inset-0 rounded-full border border-red-500/10 animate-ping opacity-40 duration-3000" />
            <div className="absolute w-[80%] h-[80%] rounded-full border border-red-500/10 animate-pulse opacity-30" />
            
            {/* SVG Brain Synapses */}
            <svg viewBox="0 0 400 400" className="w-full h-full relative z-10">
              <defs>
                <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A81F25" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FF7043" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              {/* Connection Lines (Synapses) */}
              <g stroke="rgba(168,31,37,0.12)" strokeWidth="1.8">
                {/* Core structural net */}
                <line x1="200" y1="100" x2="150" y2="150" />
                <line x1="200" y1="100" x2="250" y2="150" />
                <line x1="150" y1="150" x2="130" y2="220" />
                <line x1="250" y1="150" x2="270" y2="220" />
                <line x1="130" y1="220" x2="200" y2="280" />
                <line x1="270" y1="220" x2="200" y2="280" />
                
                {/* Horizontal internal crossbars */}
                <line x1="150" y1="150" x2="250" y2="150" />
                <line x1="130" y1="220" x2="270" y2="220" />
                
                {/* Sub-connections */}
                <line x1="200" y1="100" x2="200" y2="200" />
                <line x1="200" y1="200" x2="200" y2="280" />
                <line x1="150" y1="150" x2="200" y2="200" />
                <line x1="250" y1="150" x2="200" y2="200" />
                <line x1="130" y1="220" x2="200" y2="200" />
                <line x1="270" y1="220" x2="200" y2="200" />
              </g>

              {/* Glowing Synapse Nodes (Circles) */}
              <g>
                <circle cx="200" cy="100" r="8" fill="url(#redGrad)" className="animate-pulse" />
                <circle cx="150" cy="150" r="6" fill="#A81F25" />
                <circle cx="250" cy="150" r="6" fill="#A81F25" />
                <circle cx="200" cy="200" r="10" fill="url(#redGrad)" />
                <circle cx="130" cy="220" r="6" fill="#A81F25" />
                <circle cx="270" cy="220" r="6" fill="#A81F25" />
                <circle cx="200" cy="280" r="8" fill="url(#redGrad)" className="animate-pulse" />
              </g>
            </svg>
            
            {/* Central glowing core */}
            <div className="absolute w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-800 bg-black text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-extrabold text-2xl text-white">{stat.value}</span>
                  <span className="text-xs text-slate-400 font-semibold">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Take This Assessment Section */}
      <section id="why-take" className="max-w-7xl mx-auto px-6 py-20 z-10 bg-white">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Assessment Verticals</h2>
          <h3 className="text-3xl md:text-4xl font-display font-extrabold text-black tracking-tight">
            Six Core Cognitive Domains
          </h3>
          <p className="text-slate-600 mt-4">
            Our diagnostic covers the fundamental intelligence blocks formulated by cognitive scientists to calculate a reliable IQ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {domains.map((dom, i) => {
            const Icon = dom.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-black hover:shadow-lg transition-all flex flex-col group relative overflow-hidden shadow-sm"
              >
                {/* Glow effect on hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                
                <h4 className="font-display font-bold text-lg text-black mb-3 group-hover:text-primary transition-colors">
                  {dom.title}
                </h4>
                
                <p className="text-sm text-slate-600 leading-relaxed">
                  {dom.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/60 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 font-mono">Process Pipeline</h2>
          <h3 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            How It Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((st, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-black hover:shadow-lg transition-all relative flex flex-col shadow-sm">
              <span className="text-5xl font-display font-black text-black/10 mb-4">{st.step}</span>
              <h4 className="font-display font-bold text-black mb-2">{st.title}</h4>
              <p className="text-xs text-slate-550 leading-relaxed mt-auto">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Abroad Simplified Promotion Section */}
      <section id="abroad-promotion" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/60 relative z-10">
        <div className="absolute top-[20%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              Global Opportunities Await
            </div>
            
            <h3 className="text-3xl md:text-4xl font-display font-extrabold text-black tracking-tight leading-tight">
              Master the Global Admissions Landscape with{' '}
              <span className="text-gradient-red">Abroad Simplified</span>
            </h3>
            
            <p className="text-base text-slate-600 leading-relaxed">
              Now that you've analyzed your cognitive profile, translate your high IQ into a standout profile for the world's most prestigious universities. From elite profile-building strategies to Ivy-League admissions counseling, we simplify your journey abroad.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                { title: 'Profile Story Builder', desc: 'Craft compelling SOPs and build a standout personal narrative.' },
                { title: 'AI Research Studio Lab', desc: 'Create, develop, and publish high-impact scientific research papers.' },
                { title: 'Extracurricular Builder', desc: 'Structure leadership initiatives and meaningful community impact.' },
                { title: 'Mock Test Simulator', desc: 'Practice with real SAT, IELTS, and AP simulation suites.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-black">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a 
                href="https://www.abroadsimplified.com/" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex px-8 py-4 rounded-xl bg-primary hover:bg-black text-white font-semibold transition-all duration-300 shadow-md text-sm items-center gap-2"
              >
                Visit Abroad Simplified
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative text-left">
            <div className="bg-black text-white rounded-3xl border border-slate-850 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              
              <h4 className="font-display font-extrabold text-white text-lg mb-2">Build a Strong Profile</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Connect with study abroad mentors, access research labs, and discover ideal internship matches.
              </p>

              <div className="space-y-4">
                {[
                  { value: 'USA, UK, Germany, Canada', label: 'Top Trending Destinations' },
                  { value: 'Internship & Research Support', label: 'Hands-on Portfolio Boosters' },
                  { value: 'End-to-End Visa Support', label: 'Hassle-free Admissions Pipeline' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary/40 transition-all">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{item.label}</div>
                    <div className="text-xs font-bold text-slate-100 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-200/60 z-10">
        <div className="text-center mb-12">
          <HelpCircle className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-3xl font-display font-extrabold text-black">Frequently Asked Questions</h3>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-black hover:shadow-md transition-all shadow-sm">
            <h4 className="font-display font-semibold text-black text-base">Is this IQ test scientifically validated?</h4>
            <p className="text-sm text-slate-600 mt-2">
              Yes. The questions are modeled after standard Wechsler Adult Intelligence Scale (WAIS) structures and CAT/GMAT psychometric reasoning logic to ensure a balanced, challenging distribution.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-black hover:shadow-md transition-all shadow-sm">
            <h4 className="font-display font-semibold text-black text-base">Can I pause the 45-minute timer?</h4>
            <p className="text-sm text-slate-600 mt-2">
              No. To ensure scoring validity, the assessment must be completed in one sitting without pauses. The test automatically submits when the timer runs out.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-black hover:shadow-md transition-all shadow-sm">
            <h4 className="font-display font-semibold text-black text-base">What do I get in the Basic vs Premium reports?</h4>
            <p className="text-sm text-slate-600 mt-2">
              The Basic Report contains your overall IQ score, percentile ranking, and domain breakdown graph. The Premium Report adds custom-generated AI insights (300-500 words of strengths/weaknesses), career suggestions, and a downloadable, validated PDF certificate.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-black text-slate-400 py-12 text-sm shadow-inner">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-display font-extrabold text-white text-base tracking-tight">COLLEGE SIMPLIFIED</span>
            <span className="text-[9px] tracking-widest text-primary font-bold">COGNITIVE TESTING AGENCY</span>
          </div>
          <p className="text-center md:text-right text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} College Simplified. All rights reserved. 
            Designed for student profile acceleration and cognitive validation.
          </p>
        </div>
      </footer>

    </div>
  );
}
