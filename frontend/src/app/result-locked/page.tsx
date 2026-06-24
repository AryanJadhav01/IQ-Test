'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Lock, 
  UserPlus, 
  CreditCard, 
  Sparkles, 
  Activity, 
  Award, 
  Tag, 
  ArrowRight,
  TrendingUp,
  Brain,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { api } from '../../utils/api';

const generationTasks = [
  'Validating question submissions...',
  'Calculating overall IQ metrics (Mean=100, SD=15)...',
  'Analyzing domain-specific cognitive agility...',
  'Running carrier suitability matching algorithms...',
  'Composing personalized AI insights outline...',
  'Drafting and signing official certificate ID...'
];

function ResultLockedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [viewState, setViewState] = useState<'generating' | 'locked'>('generating');
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  
  const [user, setUser] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'register' | 'payment'>('payment');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const [plan, setPlan] = useState<'basic' | 'premium'>('premium');
  const [coupon, setCoupon] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const aid = searchParams.get('assessmentId') || sessionStorage.getItem('active_assessment_id');
    if (!aid) {
      router.push('/');
      return;
    }
    setAssessmentId(aid);



    const taskTimer = setInterval(() => {
      setCurrentTaskIndex(prev => {
        if (prev >= generationTasks.length - 1) {
          clearInterval(taskTimer);
          setViewState('locked');
          return prev;
        }
        return prev + 1;
      });
    }, 900);

    return () => clearInterval(taskTimer);
  }, [searchParams, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match.');
      setRegisterLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        fullName,
        email,
        password,
        phone,
        age: age ? Number(age) : null,
        assessmentId
      });

      localStorage.setItem('cs_iq_token', response.token);
      localStorage.setItem('cs_iq_user', JSON.stringify(response.user));
      setUser(response.user);
      setAuthStep('payment');
    } catch (err: any) {
      console.error('[Register Error]:', err);
      setRegisterError(err.message || 'Failed to create account.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');
    if (!coupon.trim()) return;

    try {
      const data = await api.post('/payment/apply-coupon', { code: coupon });
      setAppliedDiscount(data.discountPercent);
      setCouponSuccess(`Coupon applied! ${data.discountPercent}% Discount.`);
    } catch (err: any) {
      console.error('[Coupon Error]:', err);
      setCouponError(err.message || 'Invalid or expired coupon code.');
      setAppliedDiscount(0);
    }
  };

  const handleCheckout = async () => {
    if (!assessmentId) return;
    setPaymentLoading(true);

    try {
      const orderData = await api.post('/payment/create-order', {
        assessmentId,
        planType: plan,
        couponCode: coupon || null
      });

      if (orderData.freeUnlock) {
        router.push(`/dashboard?assessmentId=${assessmentId}`);
        return;
      }

      await api.post('/payment/verify', {
        assessmentId,
        razorpayOrderId: orderData.orderId,
        razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(2, 10)
      });

      router.push(`/dashboard?assessmentId=${assessmentId}`);
    } catch (err: any) {
      console.error('[Checkout Error]:', err);
      alert(err.message || 'Payment simulation failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const baseCost = plan === 'premium' ? 149 : 99;
  const discountVal = Math.round((baseCost * appliedDiscount) / 100);
  const finalCost = baseCost - discountVal;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans relative overflow-x-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-rose-500/5 blur-[150px] pointer-events-none" />

      {/* HEADER LOGO */}
      <header className="h-18 border-b border-slate-800 bg-black text-white px-6 flex items-center shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-sm text-white">COLLEGE SIMPLIFIED</span>
        </div>
      </header>

      {/* VIEW STATE: GENERATING CHECKLIST */}
      {viewState === 'generating' && (
        <div className="flex-1 flex flex-col justify-center items-center py-20 px-6">
          <div className="w-full max-w-lg glass-card border border-slate-200 rounded-3xl p-8 shadow-xl bg-white/85">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary animate-pulse">
                <Activity className="w-8 h-8 animate-spin text-primary" />
              </div>
              <h2 className="text-2xl font-display font-extrabold text-slate-900">Assessment Complete</h2>
              <p className="text-sm text-slate-500 mt-2">Compiling your standardized cognitive profile details...</p>
            </div>

            {/* Checklist progress tracker */}
            <div className="space-y-4">
              {generationTasks.map((task, idx) => {
                const isFinished = idx < currentTaskIndex;
                const isActive = idx === currentTaskIndex;
                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-3 text-xs leading-relaxed transition-all duration-300 ${
                      isFinished ? 'text-emerald-600' :
                      isActive ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-4.5 h-4.5 shrink-0 ${
                      isFinished ? 'text-emerald-500 fill-emerald-50' :
                      isActive ? 'text-primary animate-pulse' : 'text-slate-200'
                    }`} />
                    <span>{task}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW STATE: LOCKED RESULTS VIEW */}
      {viewState === 'locked' && (
        <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start z-10">
          
          {/* LEFT: Blurred Preview panel */}
          <div className="lg:col-span-6 flex flex-col gap-6 relative">
            
            {/* Lock overlay banner */}
            <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-md rounded-3xl z-20 flex flex-col justify-center items-center p-8 border border-red-200/60 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-red-500/20 mb-4 animate-bounce">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-slate-900 text-center">
                Your IQ Report Has Been Generated
              </h3>
              <p className="text-xs text-slate-500 text-center mt-2 max-w-sm">
                Unlock your full basic or premium score profile, domain accuracy statistics, AI career advice, and certificate.
              </p>
            </div>

            {/* Blurred Visual Elements */}
            <div className="p-6 glass-card rounded-3xl border border-slate-205 select-none opacity-40 filter blur-xs space-y-8 pointer-events-none shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-6 w-28 bg-slate-200 rounded-lg" />
                <div className="h-4 w-16 bg-slate-200 rounded-lg" />
              </div>

              {/* Blurred score card */}
              <div className="flex items-center gap-6 p-6 bg-slate-100/50 rounded-2xl border border-slate-205">
                <div className="w-20 h-20 rounded-full bg-slate-200" />
                <div className="space-y-3 flex-1">
                  <div className="h-6 w-24 bg-slate-200 rounded" />
                  <div className="h-4 w-40 bg-slate-150 rounded" />
                </div>
              </div>

              {/* Blurred bar chart placeholder */}
              <div className="space-y-4">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-xs text-slate-400">Logical</span>
                    <div className="h-3 bg-slate-200 flex-1 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-xs text-slate-400">Patterns</span>
                    <div className="h-3 bg-slate-200 flex-1 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-xs text-slate-400">Numerical</span>
                    <div className="h-3 bg-slate-200 flex-1 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-slate-200 rounded-xl" />
                  <div className="h-8 w-32 bg-slate-200 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Account Creation & Checkout panels */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden min-h-[50vh] flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

            <div className="flex items-center gap-3 border-b border-slate-200 pb-6 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CreditCard className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-lg">
                  Unlock Report
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access your full IQ report and verified certification.
                </p>
              </div>
            </div>

            <div className="space-y-6 flex-1 flex flex-col text-slate-800">
              {/* Plan Tiers grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Basic Plan */}
                <button
                  onClick={() => setPlan('basic')}
                  className={`p-4 rounded-2xl border text-left flex flex-col transition-all cursor-pointer relative overflow-hidden shadow-sm ${
                    plan === 'basic' 
                      ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-200/50' 
                      : 'border-slate-200 bg-white hover:border-slate-350'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-500">Basic Report</span>
                  <span className="text-xl font-display font-extrabold text-slate-900 mt-1">₹99</span>
                  <ul className="mt-4 space-y-2 text-[10px] text-slate-500">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> IQ Score</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Percentile</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Chart Breakdown</li>
                  </ul>
                </button>

                {/* Premium Plan */}
                <button
                  onClick={() => setPlan('premium')}
                  className={`p-4 rounded-2xl border text-left flex flex-col transition-all cursor-pointer relative overflow-hidden shadow-sm ${
                    plan === 'premium' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-slate-200 bg-white hover:border-slate-350'
                  }`}
                >
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-[8px] font-bold text-white uppercase tracking-wider rounded-bl-lg">
                    Best Value
                  </div>
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                    Premium Report
                  </span>
                  <span className="text-xl font-display font-extrabold text-slate-900 mt-1">₹149</span>
                  <ul className="mt-4 space-y-2 text-[10px] text-slate-600">
                    <li className="flex items-center gap-1.5 text-primary"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Everything in Basic</li>
                    <li className="flex items-center gap-1.5 text-primary"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> AI Report Analysis</li>
                    <li className="flex items-center gap-1.5 text-primary"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Career Matches</li>
                    <li className="flex items-center gap-1.5 text-primary"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> PDF Diploma</li>
                  </ul>
                </button>

              </div>

              {/* Coupon Section */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Have a coupon code?</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. IQFREE"
                      value={coupon}
                      onChange={e => setCoupon(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none text-xs font-mono transition-all uppercase placeholder:text-slate-350"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
                {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold">{couponSuccess}</p>}
                <p className="text-[9px] text-slate-500 font-medium">Tip: Use coupon code <strong className="text-slate-700">IQFREE</strong> to unlock report for ₹0 in sandbox mode.</p>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800 font-semibold">₹{baseCost}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-605">
                    <span>Discount ({appliedDiscount}%)</span>
                    <span className="font-semibold">-₹{discountVal}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-205 pt-2 font-bold">
                  <span className="text-slate-800">Amount Due</span>
                  <span className="text-primary text-base">₹{finalCost}</span>
                </div>
              </div>

              {/* Sandbox Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={paymentLoading}
                className="w-full py-4 rounded-xl bg-primary hover:bg-black text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-auto"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating security token...
                  </>
                ) : (
                  <>
                    <span>Unlock My Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 self-center mt-2 font-semibold"
              >
                Return to Home
              </Link>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}

export default function ResultLockedPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-white text-black flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-slate-500">Generating standardized cognitive profile...</span>
      </div>
    }>
      <ResultLockedContent />
    </React.Suspense>
  );
}
