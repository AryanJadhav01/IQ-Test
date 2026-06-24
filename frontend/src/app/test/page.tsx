'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Clock, 
  Check, 
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../utils/api';

interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  category: string;
  image_url?: string;
  selected_option?: string | null;
}

const CATEGORY_NAMES: Record<string, string> = {
  'logical_reasoning': 'Logical',
  'pattern_recognition': 'Patterns',
  'numerical_intelligence': 'Math',
  'verbal_reasoning': 'Verbal',
  'analytical_thinking': 'Analytical',
  'problem_solving': 'Problems'
};

export default function TestPage() {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const aid = sessionStorage.getItem('active_assessment_id');
    if (!aid) {
      router.push('/instructions');
      return;
    }
    setAssessmentId(aid);

    const loadQuestions = async () => {
      try {
        const data = await api.get(`/assessment/${aid}/questions`);
        if (data.status === 'completed' || data.status === 'paid') {
          router.push(`/result-locked?assessmentId=${aid}`);
          return;
        }
        setQuestions(data.questions);
        setLoading(false);
      } catch (err: any) {
        console.error('[Load Questions Error]:', err);
        setError(err.message || 'Failed to load assessment questions.');
        setLoading(false);
      }
    };

    loadQuestions();
  }, [router]);

  useEffect(() => {
    if (loading || error || showSubmitModal || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, showSubmitModal, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveAnswer = async (qIndex: number, option: string | null) => {
    if (!assessmentId) return;
    setSaveStatus('saving');
    const targetQuestion = questions[qIndex];
    try {
      await api.post('/assessment/save-answer', {
        assessmentId,
        questionId: targetQuestion.id,
        selectedOption: option,
        markedForReview: false // Removed mark for review parameter
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('[Save Answer API Error]:', err);
      setSaveStatus('error');
    }
  };

  const handleSelectOption = (optionLetter: string) => {
    if (submitting) return;
    const updated = [...questions];
    const prevOption = updated[currentIndex].selected_option;
    const newOption = prevOption === optionLetter ? null : optionLetter;
    updated[currentIndex].selected_option = newOption;
    setQuestions(updated);
    saveAnswer(currentIndex, newOption);
  };

  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || submitting || loading) return;
      const key = e.key.toLowerCase();
      if (key === 'a') handleSelectOption('A');
      else if (key === 'b') handleSelectOption('B');
      else if (key === 'c') handleSelectOption('C');
      else if (key === 'd') handleSelectOption('D');
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, showSubmitModal, submitting, loading, goNext, goPrev]);

  const handleManualSubmitClick = () => {
    setShowSubmitModal(true);
  };

  const executeSubmission = async () => {
    if (!assessmentId) return;
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      const localUser = localStorage.getItem('cs_iq_user');
      let name = 'Guest Candidate';
      if (localUser) {
        try { name = JSON.parse(localUser).fullName; } catch {}
      }
      await api.post('/assessment/submit', { assessmentId, studentName: name });
      router.push(`/result-locked?assessmentId=${assessmentId}`);
    } catch (err: any) {
      console.error('[Submission Error]:', err);
      alert(err.message || 'Failed to submit test. Please check connection and try again.');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!assessmentId || submitting) return;
    setSubmitting(true);
    try {
      const localUser = localStorage.getItem('cs_iq_user');
      let name = 'Guest Candidate';
      if (localUser) {
        try { name = JSON.parse(localUser).fullName; } catch {}
      }
      await api.post('/assessment/submit', { assessmentId, studentName: name });
      router.push(`/result-locked?assessmentId=${assessmentId}`);
    } catch (err) {
      console.error('[Auto-Submit Error]:', err);
      router.push(`/result-locked?assessmentId=${assessmentId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-slate-500">Loading your secure assessment session...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4 px-6 text-center">
        <AlertCircle className="w-12 h-12 text-primary" />
        <h1 className="text-xl font-bold text-slate-800">Initialization Error</h1>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <button onClick={() => router.push('/instructions')} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
          Retry
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter(q => q.selected_option !== null).length;
  const progressPercent = (answeredCount / questions.length) * 100;
  const uniqueCategories = ['all', ...Array.from(new Set(questions.map(q => q.category)))];

  const getQuestionButtonClass = (index: number, q: Question) => {
    const isCurrent = index === currentIndex;
    const isAnswered = q.selected_option !== null;

    let base = "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ";
    
    if (isCurrent) {
      base += "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 ";
    } else if (isAnswered) {
      base += "border-emerald-300 bg-emerald-50 text-emerald-700 ";
    } else {
      base += "border-slate-200 bg-slate-50/40 text-slate-400 hover:border-slate-350 hover:text-slate-700 ";
    }

    return base;
  };
  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans overflow-hidden select-none">
      
      {/* Test Page Top Header - Clean minimalist header */}
      <header className="h-16 border-b border-slate-800 bg-black text-white px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-sm text-white">COLLEGE SIMPLIFIED</span>
        </div>
      </header>      {/* Main Grid: Question Space + Navigation Panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Question Area */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto relative">
          <div className="max-w-3xl w-full mx-auto my-auto flex flex-col justify-between min-h-[70vh]">
            
            {/* Header info - Displays Domain, Answer Progress and Timer side-by-side */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 font-bold uppercase tracking-wider mb-6 pb-4 border-b border-slate-200/50">
                <span>Domain: {CATEGORY_NAMES[currentQuestion.category] || currentQuestion.category}</span>
                
                <div className="flex items-center gap-4">
                  <span className="text-slate-650">Progress: {answeredCount} of 60 Answered ({progressPercent.toFixed(0)}%)</span>
                  
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-primary shadow-sm font-bold">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span className="font-mono text-sm tracking-wide">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg md:text-xl font-display font-semibold text-slate-900 leading-relaxed mb-10 whitespace-pre-wrap">
                {currentIndex + 1}. {currentQuestion.question}
              </h2>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                {[
                  { key: 'A', text: currentQuestion.option_a },
                  { key: 'B', text: currentQuestion.option_b },
                  { key: 'C', text: currentQuestion.option_c },
                  { key: 'D', text: currentQuestion.option_d },
                ].map((opt) => {
                  const isSelected = currentQuestion.selected_option === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      disabled={submitting}
                      className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all duration-200 group shadow-sm ${
                        isSelected 
                          ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary ring-2 ring-primary/10' 
                          : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-4 pr-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-550 group-hover:bg-slate-205 group-hover:text-slate-800'
                        }`}>
                          {opt.key}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 leading-relaxed">
                          {opt.text}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Actions */}
            <div className="border-t border-slate-200/60 pt-6 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-bold font-mono">
                Question {currentIndex + 1} of 60
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0 || submitting}
                  className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center disabled:opacity-30 cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIndex === questions.length - 1 || submitting}
                  className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center disabled:opacity-30 cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Right Side: Sidebar Navigation Grid */}
        <aside className="w-80 border-l border-slate-200 bg-white/70 backdrop-blur-md flex flex-col overflow-hidden shrink-0 hidden lg:flex">
          
          {/* Domain Quick Filters */}
          <div className="p-4 border-b border-slate-205">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2.5">
              Category Filter
            </span>
            <div className="flex flex-wrap gap-1.5">
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide border transition-all cursor-pointer ${
                    selectedFilter === cat
                      ? 'bg-primary border-primary text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'All' : (CATEGORY_NAMES[cat] || cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Question Links */}
          <div className="flex-1 overflow-y-auto p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3">
              Questions Map
            </span>
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                if (selectedFilter !== 'all' && q.category !== selectedFilter) {
                  return null;
                }
                return (
                  <button
                    key={q.id}
                    onClick={() => { if (!submitting) setCurrentIndex(idx); }}
                    className={getQuestionButtonClass(idx, q)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action Footer Panel (No answered/unanswered legend) */}
          <div className="p-4 bg-slate-50/60 border-t border-slate-200/85">
            <button
              onClick={handleManualSubmitClick}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-black text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              Submit Assessment
            </button>
          </div>

        </aside>
      </div>

      {/* Confirmation Submit Modal overlay */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-2xl relative"
            >
              <h3 className="text-xl font-display font-extrabold text-slate-900 mb-2">Submit Assessment?</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Are you sure you want to end your test? You have answered{' '}
                <strong className="text-slate-800 font-bold">{answeredCount} of 60</strong> questions.{' '}
                You will not be able to change your selections after submission.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSubmission}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
