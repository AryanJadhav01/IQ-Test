'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Database, 
  FileSpreadsheet, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award, 
  Search, 
  ArrowLeft,
  Settings,
  Upload,
  Loader2
} from 'lucide-react';
import { api } from '../../utils/api';

interface QuestionItem {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  category: string;
  explanation: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState<any>(null);
  const [categoryAverages, setCategoryAverages] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'analytics' | 'questions'>('analytics');

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('A');
  const [qDifficulty, setQDifficulty] = useState('medium');
  const [qCategory, setQCategory] = useState('logical_reasoning');
  const [qExplanation, setQExplanation] = useState('');
  const [qLoading, setQLoading] = useState(false);

  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('cs_iq_token');
    const localUser = localStorage.getItem('cs_iq_user');
    
    if (!token || !localUser) {
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(localUser);
      if (parsed.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      loadAdminData();
    } catch {
      router.push('/');
    }
  }, [router]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const stats = await api.get('/admin/stats');
      setMetrics(stats.metrics);
      setCategoryAverages(stats.categoryAverages);
      setRecentPayments(stats.recentPayments);

      const qList = await api.get('/admin/questions');
      setQuestions(qList);
      
      setLoading(false);
    } catch (error) {
      console.error('[Load Admin Data Error]:', error);
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQLoading(true);
    const payload = {
      question: qText,
      optionA: qOptA,
      optionB: qOptB,
      optionC: qOptC,
      optionD: qOptD,
      correctAnswer: qCorrect,
      difficulty: qDifficulty,
      category: qCategory,
      explanation: qExplanation
    };

    try {
      if (modalMode === 'create') {
        await api.post('/admin/questions', payload);
      } else if (modalMode === 'edit' && selectedQuestion) {
        await api.put(`/admin/questions/${selectedQuestion.id}`, payload);
      }
      setShowQuestionModal(false);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to save question.');
    } finally {
      setQLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete question.');
    }
  };

  const openEditModal = (q: QuestionItem) => {
    setSelectedQuestion(q);
    setQText(q.question);
    setQOptA(q.option_a);
    setQOptB(q.option_b);
    setQOptC(q.option_c);
    setQOptD(q.option_d);
    setQCorrect(q.correct_answer);
    setQDifficulty(q.difficulty);
    setQCategory(q.category);
    setQExplanation(q.explanation || '');
    setModalMode('edit');
    setShowQuestionModal(true);
  };

  const openCreateModal = () => {
    setSelectedQuestion(null);
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect('A');
    setQDifficulty('medium');
    setQCategory('logical_reasoning');
    setQExplanation('');
    setModalMode('create');
    setShowQuestionModal(true);
  };

  const handleBulkUpload = async () => {
    setBulkError('');
    setBulkSuccess('');
    setBulkLoading(true);

    if (!bulkText.trim()) {
      setBulkError('Please paste a JSON array of questions.');
      setBulkLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(bulkText);
      if (!Array.isArray(parsed)) {
        throw new Error('Root element must be a JSON array.');
      }
      const response = await api.post('/admin/questions/bulk-upload', { questions: parsed });
      setBulkSuccess(response.message || 'Bulk upload complete!');
      setBulkText('');
      loadAdminData();
    } catch (err: any) {
      console.error('[Bulk Error]:', err);
      setBulkError(err.message || 'Invalid JSON syntax. Ensure format matches the template.');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-slate-500">Loading admin console dashboard...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4 text-center px-6">
        <ShieldCheck className="w-16 h-16 text-primary animate-pulse" />
        <h1 className="text-2xl font-display font-extrabold text-slate-900">Administrator Access Required</h1>
        <p className="text-sm text-slate-500 max-w-sm">
          Please log in as an administrator to access the dashboards.
        </p>
        <Link href="/" className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover shadow-sm">
          Go Back Home
        </Link>
      </div>
    );
  }

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      
      <header className="sticky top-0 z-40 glass-card border-b border-slate-205 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </Link>
            <div>
              <span className="font-display font-extrabold text-sm text-slate-850 block">CS Assessment Console</span>
              <span className="text-[9px] tracking-widest text-primary font-bold">ADMIN CONTROL PANEL</span>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            User Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-1 flex flex-col gap-8">
        
        <div className="flex border-b border-slate-200 gap-4">
          {[
            { id: 'analytics', label: 'Revenue & Metrics', icon: TrendingUp },
            { id: 'questions', label: 'Questions CRUD Editor', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'analytics' && metrics && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-md flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Registered Users</div>
                  <div className="text-xl font-display font-extrabold text-slate-900 mt-1">{metrics.totalUsers}</div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-md flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed IQ Tests</div>
                  <div className="text-xl font-display font-extrabold text-slate-900 mt-1">{metrics.completedTests}</div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-md flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Sandbox Revenue</div>
                  <div className="text-xl font-display font-extrabold text-slate-900 mt-1">₹{metrics.totalRevenue}</div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-md flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Average Score IQ</div>
                  <div className="text-xl font-display font-extrabold text-slate-900 mt-1">{metrics.averageIq}</div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-md">
                <h3 className="font-display font-bold text-slate-800 text-sm mb-4">Question Category Performance Averages</h3>
                <div className="space-y-4">
                  {Object.entries(categoryAverages).map(([dom, val]: any) => (
                    <div key={dom}>
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span className="text-slate-550 capitalize">{dom.replace('_', ' ')}</span>
                        <span className="text-slate-900 font-mono font-bold">{Math.round(val)}% Avg</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-4">Recent Sandbox Transactions</h3>
                  {recentPayments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-10 text-center">No payment transactions recorded.</p>
                  ) : (
                    <div className="divide-y divide-slate-150">
                      {recentPayments.map((p, idx) => (
                        <div key={idx} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{p.full_name}</div>
                            <div className="text-[10px] text-slate-450">{p.email}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-600 font-bold font-mono">+₹{p.amount}</span>
                            <div className="text-[8px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">{p.plan_type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'questions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            
            <div className="lg:col-span-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by text, category..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 focus:border-primary focus:outline-none text-xs"
                  />
                </div>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 btn-glow-primary cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Create Question
                </button>
              </div>

              <div className="glass-card rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden divide-y divide-slate-150">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-20 text-xs text-slate-500">No questions match your query.</div>
                ) : (
                  filteredQuestions.map((q) => (
                    <div key={q.id} className="p-5 flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex gap-2 items-center text-[9px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400">#{q.id}</span>
                          <span className="text-primary">{q.category.replace('_', ' ')}</span>
                          <span className="text-slate-500 border border-slate-200 bg-slate-50 px-1 rounded">{q.difficulty}</span>
                          <span className="text-emerald-600">Correct: {q.correct_answer}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-relaxed">{q.question}</h4>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                          <span>A: {q.option_a}</span>
                          <span>B: {q.option_b}</span>
                          <span>C: {q.option_c}</span>
                          <span>D: {q.option_d}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-center shrink-0">
                        <button
                          onClick={() => openEditModal(q)}
                          className="w-8 h-8 rounded-lg bg-slate-105 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-primary flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-4 glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-md space-y-6">
              <h3 className="font-display font-bold text-slate-850 text-sm flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Bulk Question Upload
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste a JSON array containing your questions. All fields must conform to:
              </p>

              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[9px] text-slate-655 font-mono overflow-x-auto leading-relaxed shadow-inner">
{`[
  {
    "question": "A is father of B...",
    "optionA": "Uncle",
    "optionB": "Brother",
    "optionC": "Daughter",
    "optionD": "Son",
    "correctAnswer": "C",
    "difficulty": "easy",
    "category": "logical_reasoning",
    "explanation": "Optional logic notes"
  }
]`}
              </pre>

              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder="Paste JSON array here..."
                rows={10}
                className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none rounded-xl text-xs font-mono placeholder:text-slate-350 shadow-inner"
              />

              {bulkError && <p className="text-[10px] text-red-550 font-semibold">{bulkError}</p>}
              {bulkSuccess && <p className="text-[10px] text-emerald-650 font-semibold">{bulkSuccess}</p>}

              <button
                onClick={handleBulkUpload}
                disabled={bulkLoading}
                className="w-full py-3 bg-primary hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm"
              >
                {bulkLoading ? 'Processing questions...' : 'Import Bulk Questions'}
              </button>
            </div>

          </div>
        )}

      </main>

      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-slate-200/85 rounded-3xl p-6 md:p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-display font-extrabold text-slate-900 mb-6">
              {modalMode === 'create' ? 'Create Question' : 'Edit Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Question Text</label>
                <textarea
                  required
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none placeholder:text-slate-400"
                  placeholder="Insert question details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Option A</label>
                  <input
                    type="text" required value={qOptA} onChange={e => setQOptA(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Option B</label>
                  <input
                    type="text" required value={qOptB} onChange={e => setQOptB(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Option C</label>
                  <input
                    type="text" required value={qOptC} onChange={e => setQOptC(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Option D</label>
                  <input
                    type="text" required value={qOptD} onChange={e => setQOptD(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Correct Answer</label>
                  <select
                    value={qCorrect} onChange={e => setQCorrect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-primary focus:outline-none"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Difficulty</label>
                  <select
                    value={qDifficulty} onChange={e => setQDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-primary focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Category</label>
                  <select
                    value={qCategory} onChange={e => setQCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-primary focus:outline-none"
                  >
                    <option value="logical_reasoning">Logical Reasoning</option>
                    <option value="pattern_recognition">Pattern Recognition</option>
                    <option value="numerical_intelligence">Numerical Intelligence</option>
                    <option value="verbal_reasoning">Verbal Reasoning</option>
                    <option value="analytical_thinking">Analytical Thinking</option>
                    <option value="problem_solving">Problem Solving</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Explanation (Optional)</label>
                <textarea
                  value={qExplanation}
                  onChange={e => setQExplanation(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  disabled={qLoading}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-550 font-semibold cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={qLoading}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-1.5 btn-glow-primary cursor-pointer text-center"
                >
                  {qLoading ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
