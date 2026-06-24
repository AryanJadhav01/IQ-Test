'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Play, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  Wifi, 
  Brain, 
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { api } from '../../utils/api';

const rules = [
  { text: 'Complete the assessment in one sitting.', icon: CheckCircle2 },
  { text: 'The timer cannot be paused once started.', icon: Clock },
  { text: 'Each question carries equal weight in the score calculation.', icon: HelpCircle },
  { text: 'Ensure a stable internet connection before beginning.', icon: Wifi },
  { text: 'Solve questions independently without using external references or calculators.', icon: Brain },
  { text: 'Your intelligence report is compiled instantly upon submission.', icon: CheckCircle2 },
];

export default function InstructionsPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleStartTest = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/assessment/start', {});
      sessionStorage.setItem('active_assessment_id', data.assessmentId);
      router.push('/test');
    } catch (err: any) {
      console.error('[Start Test Error]:', err);
      setError(err.message || 'Failed to initialize the assessment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center items-center py-12 px-6 relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-red-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-rose-500/5 blur-[100px] pointer-events-none" />

      {/* Back to Home Link */}
      <Link href="/" className="absolute top-8 left-8 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5">
        <ChevronLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl glass-card rounded-3xl border border-slate-200 p-8 md:p-10 shadow-xl relative"
      >
        <div className="flex items-center gap-4 border-b border-slate-200/60 pb-6 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-slate-900">Assessment Instructions</h1>
            <p className="text-xs text-slate-500">College Simplified Advanced Intelligence Assessment</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-2">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Questions</div>
            <div className="text-lg font-display font-extrabold text-slate-850">60</div>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-2">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Duration</div>
            <div className="text-lg font-display font-extrabold text-slate-850">45 Mins</div>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-2">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Difficulty</div>
            <div className="text-xs font-display font-bold text-primary tracking-wide pt-1">EASY • MED • ADV</div>
          </div>
        </div>

        {/* Categories checklist */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Evaluated Domains</h2>
          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-650">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Logical Reasoning
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Pattern Recognition
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Numerical Intelligence
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Verbal Reasoning
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Analytical Thinking
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Problem Solving
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-650" />
            Crucial Guidelines
          </h2>
          <div className="space-y-4">
            {rules.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-650 leading-relaxed">{rule.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-650">
            {error}
          </div>
        )}

        <button
          onClick={handleStartTest}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-primary hover:bg-black text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Initializing session...' : 'Begin Assessment'}
          <Play className="w-4 h-4 fill-white" />
        </button>
      </motion.div>
    </div>
  );
}
