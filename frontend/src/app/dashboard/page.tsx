'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Award, 
  Download, 
  History, 
  Brain, 
  Briefcase, 
  Activity, 
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  LogOut,
  Lock
} from 'lucide-react';
import { api } from '../../utils/api';

interface HistoryItem {
  assessment_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  overall_iq: number | null;
  category: string | null;
  percentile: number | null;
  plan_type: 'basic' | 'premium' | null;
  payment_status: string | null;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [activeResult, setActiveResult] = useState<any>(null);
  const [resultLoading, setResultLoading] = useState<boolean>(false);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>('');
  const [certName, setCertName] = useState<string>('');



  useEffect(() => {
    const paramAid = searchParams.get('assessmentId');
    if (!paramAid) {
      router.push('/');
      return;
    }

    const loadDashboardData = async () => {
      try {
        setActiveAssessmentId(paramAid);
        await loadResultDetails(paramAid);
      } catch (err: any) {
        console.error('[Dashboard Load Error]:', err);
        setError(err.message || 'Failed to load dashboard metrics.');
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [searchParams, router]);

  const loadResultDetails = async (aid: string) => {
    setResultLoading(true);
    try {
      const data = await api.get(`/result/${aid}`);
      setActiveResult(data);
      setLoading(false);
      setResultLoading(false);
    } catch (err) {
      console.error('[Load Result Details Error]:', err);
      setResultLoading(false);
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = (aid: string) => {
    setActiveAssessmentId(aid);
    loadResultDetails(aid);
  };

  const renderRadarChart = (scores: Record<string, number>) => {
    const categories = Object.keys(scores);
    const center = 150;
    const rMax = 100;
    const vertexCount = 6;
    
    const points: string[] = [];
    const gridPolygons: string[] = [];
    const gridRatios = [0.2, 0.4, 0.6, 0.8, 1.0];
    
    for (const ratio of gridRatios) {
      const gridPoints: string[] = [];
      for (let i = 0; i < vertexCount; i++) {
        const angle = (i * 2 * Math.PI) / vertexCount - Math.PI / 2;
        const x = center + rMax * ratio * Math.cos(angle);
        const y = center + rMax * ratio * Math.sin(angle);
        gridPoints.push(`${x},${y}`);
      }
      gridPolygons.push(gridPoints.join(' '));
    }

    for (let i = 0; i < vertexCount; i++) {
      const cat = categories[i];
      const score = scores[cat] || 0;
      const angle = (i * 2 * Math.PI) / vertexCount - Math.PI / 2;
      const x = center + rMax * (score / 100) * Math.cos(angle);
      const y = center + rMax * (score / 100) * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    const scorePoly = points.join(' ');

    return (
      <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto z-10">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A81F25" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#A81F25" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid Guides */}
        {gridPolygons.map((poly, idx) => (
          <polygon
            key={idx}
            points={poly}
            fill="none"
            stroke="rgba(0, 0, 0, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Diagonal Guide Lines */}
        {Array.from({ length: vertexCount }).map((_, i) => {
          const angle = (i * 2 * Math.PI) / vertexCount - Math.PI / 2;
          const x = center + rMax * Math.cos(angle);
          const y = center + rMax * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(0, 0, 0, 0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Shaded Area of Radar Chart */}
        <polygon
          points={scorePoly}
          fill="url(#radarGlow)"
          stroke="#A81F25"
          strokeWidth="2.5"
        />

        {/* Radar Nodes */}
        {points.map((pt, i) => {
          const [x, y] = pt.split(',');
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#FFFFFF"
              stroke="#A81F25"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Category Labels */}
        {categories.map((cat, i) => {
          const angle = (i * 2 * Math.PI) / vertexCount - Math.PI / 2;
          const labelDist = rMax + 20;
          const x = center + labelDist * Math.cos(angle);
          const y = center + labelDist * Math.sin(angle);
          
          let textAnchor: "middle" | "start" | "end" = 'middle';
          if (Math.cos(angle) > 0.1) textAnchor = 'start';
          if (Math.cos(angle) < -0.1) textAnchor = 'end';

          const labelText = cat === 'Numerical Intelligence' ? 'Numerical' :
                            cat === 'Pattern Recognition' ? 'Patterns' :
                            cat === 'Logical Reasoning' ? 'Logical' :
                            cat === 'Verbal Reasoning' ? 'Verbal' :
                            cat === 'Analytical Thinking' ? 'Analytical' : 'Problem Solv.';

          return (
            <text
              key={i}
              x={x}
              y={y + 4}
              fill="#4B5563"
              fontSize="9"
              fontWeight="bold"
              textAnchor={textAnchor}
            >
              {labelText}
            </text>
          );
        })}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-slate-500">Loading student personal dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4 px-6 text-center">
        <AlertCircle className="w-12 h-12 text-primary" />
        <h1 className="text-xl font-bold text-slate-800">Dashboard Error</h1>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      
      {/* Dynamic Dashboard Navbar */}
      <header className="sticky top-0 z-50 bg-black text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-sm tracking-tight text-white">COLLEGE SIMPLIFIED</span>
              <span className="text-[9px] tracking-widest text-primary font-bold">STUDENT PORTAL</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-slate-350 hover:text-white transition-colors font-semibold">
              Return to Home
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* RIGHT AREA: Expanded Report / Results View */}
        <section className="lg:col-span-12 flex flex-col gap-6">
          {resultLoading ? (
            <div className="glass-card rounded-3xl border border-slate-200/80 p-20 flex flex-col justify-center items-center gap-4 min-h-[60vh] bg-white/70 shadow-sm">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-slate-500">Retrieving intelligence statistics...</span>
            </div>
          ) : activeResult ? (
            <div className="space-y-6">
              
              {/* LOCKED VIEW WARNING */}
              {activeResult.locked ? (
                <div className="glass-card rounded-3xl border border-red-250 p-8 flex flex-col justify-center items-center gap-4 text-center min-h-[50vh] bg-white/70 shadow-sm">
                  <Lock className="w-10 h-10 text-primary animate-bounce" />
                  <h3 className="font-display font-extrabold text-slate-900 text-lg">Results Locked</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    This test score has not been unlocked yet. Please process the mock checkout to view this report.
                  </p>
                  <Link
                    href={`/result-locked?assessmentId=${activeResult.assessmentId}`}
                    className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-primary-hover btn-glow-primary shadow-sm"
                  >
                    Unlock Assessment Now
                  </Link>
                </div>
              ) : (
                <>
                  {/* OVERALL SCORE SUMMARY PANEL */}
                  <div className="glass-card rounded-3xl border border-slate-200 p-6 md:p-8 bg-white shadow-md relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
                    
                    {/* Circle Score Display */}
                    <div className="relative w-36 h-36 rounded-full border-4 border-primary/20 flex flex-col justify-center items-center bg-slate-50/60 shadow-inner shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-1">IQ Score</span>
                      <span className="text-4xl font-display font-black text-slate-900">{activeResult.overallIq}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold mt-2 uppercase tracking-wide">
                        {activeResult.category}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider shadow-sm">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        National Percentile: {activeResult.percentile}th percentile
                      </div>
                      <h2 className="text-2xl font-display font-extrabold text-slate-900">Your Cognitive Blueprint</h2>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                        Congratulations. You have completed our advance student assessment. Your score places you in the{' '}
                        <strong className="text-slate-800 font-semibold">{activeResult.category.toLowerCase()}</strong> tier. 
                        A complete analysis of your profile is unlocked below.
                      </p>

                      {/* Performance metrics grid */}
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 w-full max-w-lg mt-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center md:items-start transition-all hover:scale-[1.02] hover:shadow-xs">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Attempted</span>
                          <span className="text-sm md:text-base font-black text-slate-800 font-mono mt-1">
                            {activeResult.attemptedCount ?? 0} <span className="text-[10px] text-slate-400 font-normal">/ {activeResult.totalCount ?? 60}</span>
                          </span>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col items-center md:items-start transition-all hover:scale-[1.02] hover:shadow-xs">
                          <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Correct</span>
                          <span className="text-sm md:text-base font-black text-emerald-700 font-mono mt-1">
                            {activeResult.correctCount ?? 0}
                          </span>
                        </div>
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex flex-col items-center md:items-start transition-all hover:scale-[1.02] hover:shadow-xs">
                          <span className="text-[9px] text-rose-600 font-bold uppercase tracking-wider">Incorrect</span>
                          <span className="text-sm md:text-base font-black text-primary font-mono mt-1">
                            {activeResult.wrongCount ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DOUBLE COLUMN: Radar Chart vs Score breakdown list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Visual Radar Card */}
                    <div className="glass-card rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[340px] bg-white shadow-md">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest self-start mb-4">
                        Cognitive Footprint
                      </h4>
                      {renderRadarChart(activeResult.domainScores)}
                    </div>

                    {/* Numerical list Breakdown */}
                    <div className="glass-card rounded-3xl border border-slate-200 p-6 flex flex-col justify-between min-h-[340px] bg-white shadow-md">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Domain Analysis
                      </h4>
                      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                        {Object.entries(activeResult.domainScores).map(([domain, val]: any) => (
                          <div key={domain}>
                            <div className="flex justify-between items-center text-xs font-semibold mb-1">
                              <span className="text-slate-650">{domain}</span>
                              <span className="text-slate-900 font-mono font-bold">{val}/100</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${val}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* PREMIUM SECTION: AI INSIGHTS & RECOMMENDATIONS */}
                  {activeResult.planType === 'premium' ? (
                    <div className="space-y-6">
                      
                      {/* AI Detailed Insights */}
                      <div className="glass-card rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 bg-white shadow-md">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 font-mono">
                          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                          Personalized AI Diagnostic
                        </h4>

                        <div className="text-xs text-slate-700 leading-relaxed space-y-4">
                          {activeResult.aiInsights.split('\n\n').map((paragraph: string, idx: number) => (
                            <p key={idx} className="whitespace-pre-wrap leading-relaxed">{paragraph}</p>
                          ))}
                        </div>
                      </div>

                      {/* Career Paths Card */}
                      <div className="glass-card rounded-3xl border border-slate-200 p-6 md:p-8 bg-white shadow-md">
                        <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <Briefcase className="w-4.5 h-4.5 text-primary" />
                          Recommended Career Tracts
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                          Based on your dominant cognitive traits, our scoring algorithms recommend alignment with the following intellectual domains:
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {activeResult.careers.map((c: string, idx: number) => (
                            <div 
                              key={idx} 
                              className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-primary/45 transition-colors font-bold text-xs text-slate-800 shadow-sm"
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PDF Certificate card */}
                      <div className="glass-card rounded-3xl border border-slate-200 p-6 md:p-8 flex flex-col gap-6 bg-white shadow-md relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                          <div className="space-y-1.5 text-center sm:text-left">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-center sm:justify-start">
                              <Award className="w-4.5 h-4.5 text-primary" />
                              Official Validation Diploma
                            </h4>
                            <h3 className="font-display font-extrabold text-slate-900 text-base">Certificate of Cognitive Achievement</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Includes verified Certificate UUID, scores, and College Simplified stamp.</p>
                          </div>
                        </div>

                        {/* Guest Name Input for Custom Certificate */}
                        <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
                          <div className="w-full md:max-w-md">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
                              Enter Name for Certificate
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Rahul Sharma"
                              value={certName}
                              onChange={e => setCertName(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none text-xs text-slate-800 font-medium placeholder:text-slate-400"
                            />
                          </div>
                          
                          <a
                            href={`http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000/api/certificate/download?assessmentId=${activeResult.assessmentId}&studentName=${encodeURIComponent(certName || 'Valued Student')}`}
                            className="px-5 py-3 bg-primary hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all duration-300 cursor-pointer w-full md:w-auto text-center justify-center shadow-md shadow-red-500/10 shrink-0 h-10"
                          >
                            <Download className="w-4 h-4" />
                            Download Certificate PDF
                          </a>
                        </div>
                      </div>

                    </div>
                  ) : (
                    // BASIC REPORT: PREMIUM UPGRADE BANNER
                    <div className="glass-card rounded-3xl border border-primary/20 p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden bg-primary/5 shadow-md">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
                      <div className="space-y-2 text-center md:text-left">
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-primary flex items-center justify-center md:justify-start gap-1 font-mono">
                          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                          Upgrade Available
                        </span>
                        <h3 className="font-display font-extrabold text-slate-800 text-lg">Unlock AI Analysis & Certificate</h3>
                        <p className="text-xs text-slate-650 max-w-md leading-relaxed">
                          Get 500 words of personalized psychometric strengths/weaknesses profiling, 3 career alignments, and a validated PDF certificate for only ₹50.
                        </p>
                      </div>
                      
                      <Link
                        href={`/result-locked?assessmentId=${activeResult.assessmentId}`}
                        className="px-6 py-3.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-all btn-glow-primary cursor-pointer shrink-0 self-stretch md:self-auto text-center shadow-sm"
                      >
                        Upgrade to Premium
                      </Link>
                    </div>
                  )}
                </>
              )}

            </div>
          ) : (
            <div className="glass-card rounded-3xl border border-slate-200 p-20 flex flex-col justify-center items-center gap-4 text-center min-h-[60vh] bg-white shadow-md">
              <HelpCircle className="w-12 h-12 text-slate-300" />
              <h3 className="font-display font-bold text-slate-800 text-base">Select an Assessment</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Please select a completed or paid attempt from your history list on the left to review the results here.
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-slate-500">Loading student personal dashboard...</span>
      </div>
    }>
      <DashboardContent />
    </React.Suspense>
  );
}
