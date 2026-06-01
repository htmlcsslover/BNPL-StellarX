'use client';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';

import { API_BASE_URL, safeFetch, generateIdempotencyKey } from '@/lib/api';

import FundAccount from '@/components/FundAccount';
import BalanceCard from '@/components/BalanceCard';
import { fetchBalances, type Balances } from '@/lib/balances';
import { buildPaymentXDR } from '@/lib/payment';
import { signAndSubmit } from '@/lib/sign';

export default function MyCredit() {
  const { publicKey } = useWallet();
  const { user } = useUser();
  const [loans, setLoans] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [balances, setBalances] = useState<Balances>({ xlm: '0', funded: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const fetchData = useCallback(async () => {
    if (!publicKey) return;
    try {
      const [loansResult, profileResult, balData] = await Promise.all([
        safeFetch(`${API_BASE_URL}/api/loans/borrowed/${publicKey}`),
        safeFetch(`${API_BASE_URL}/api/users/profile/${publicKey}`),
        fetchBalances(publicKey)
      ]);

      if (loansResult.ok) {
        setLoans(loansResult.data);
      }
      if (profileResult.ok) {
        setProfile(profileResult.data);
      }
      setBalances(balData);
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Error refreshing dashboard data.' });
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRepay = async (loanId: string, amount: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan || !publicKey) return;

    setActionLoading(loanId);
    setStatusMessage({ type: '', text: '' });
    
    try {
      // 1. Build and sign transaction
      const paymentAmount = loan.next_installment ? loan.next_installment.amount_xlm : amount;
      setStatusMessage({ type: 'success', text: `Please sign the ${paymentAmount} XLM payment in Freighter...` });
      
      const xdr = await buildPaymentXDR(publicKey, loan.merchant_wallet, paymentAmount);
      const txHash = await signAndSubmit(xdr, publicKey);
      
      setStatusMessage({ type: 'success', text: 'Payment confirmed on-chain! Syncing with backend...' });

      // 2. Notify backend of the payment
      const result = await safeFetch(`${API_BASE_URL}/api/loans/repay`, {
        method: 'POST',
        body: JSON.stringify({
          loan_id: loanId,
          amount_xlm: amount,
          wallet_address: publicKey,
          tx_hash: txHash,
          idempotency_key: generateIdempotencyKey()
        }),
      });

      if (result.ok) {
        setStatusMessage({ type: 'success', text: 'Repayment successfully recorded. Your balance and credit have been updated.' });
        // Refresh immediately to show new balance and updated status
        await fetchData();
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Payment was sent but backend update failed. Please contact support.' });
      }
    } catch (e: any) {
      console.error('Repayment error:', e);
      setStatusMessage({ type: 'error', text: e.message || 'Payment failed or was cancelled.' });
    } finally {
      setActionLoading(null);
    }
  };

  const sharePassport = () => {
    if (!profile) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out my StellarBNPL Trust Passport! My score is ${profile.reputation?.score || 0}. Built on Stellar.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'StellarBNPL Trust Passport',
        text: text,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      setStatusMessage({ type: 'success', text: 'Passport link copied to clipboard.' });
    }
  };

  if (!publicKey) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4 tracking-tighter">Identity Required</h1>
        <p className="text-gray-400">Please connect your Freighter wallet to view your credit profile.</p>
      </div>
    );
  }

  const reputation = profile?.reputation || { score: 450, tier: 'Gold' };
  const totalLoaned = loans.reduce((acc, l) => acc + (l.status === 'active' ? (parseFloat(l.amount_xlm) || 0) : 0), 0);
  const creditLimit = reputation.tier === 'Gold' ? 1000 : reputation.tier === 'Silver' ? 500 : 200;
  const nextTier = reputation.tier === 'Bronze' ? 'Silver' : reputation.tier === 'Silver' ? 'Gold' : 'Platinum';
  const pointsToNext = reputation.tier === 'Gold' ? 500 - reputation.score : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase">My Credit</h1>
          <p className="text-gray-400 font-medium">Manage your community credit line and reputation.</p>
        </div>
      </div>

      {statusMessage.text && (
        <div className={`mb-8 p-4 rounded-2xl border ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} text-sm font-bold text-center`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <BalanceCard balances={balances} publicKey={publicKey} />
        
        {/* Credit Utilization */}
        <div className="flex-1 glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold">Available Credit</h3>
              <span className="text-[10px] font-black px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 uppercase">Active Line</span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <p className="text-5xl font-black tracking-tighter">
                {(creditLimit - totalLoaned).toFixed(2)}
              </p>
              <p className="text-xl text-gray-400 pb-1.5 font-bold uppercase">XLM</p>
            </div>
            <p className="text-sm text-gray-500 mb-8 font-medium font-mono">Limit: {creditLimit}.00 XLM</p>
            
            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-1000" 
                style={{ width: `${Math.max(5, (totalLoaned / creditLimit) * 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/5 rounded-full blur-[80px]"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Active Loans */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Active Loans</h2>
            <Link href="/marketplace" className="text-sm font-bold text-purple-400 hover:text-purple-300 transition underline decoration-2 underline-offset-4 uppercase tracking-widest">Browse More</Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2].map(i => <div key={i} className="h-24 glass rounded-3xl animate-pulse"></div>)}
            </div>
          ) : loans.length === 0 ? (
            <div className="glass p-16 rounded-[3rem] text-center border-dashed border-white/10">
              <p className="text-white font-bold text-lg mb-2">Your credit line is ready.</p>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto">You haven't used your credit line yet. Explore the marketplace and unlock your Trust Passport.</p>
              <Link href="/marketplace" className="px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition uppercase text-xs tracking-widest italic">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan, i) => (
                <div key={i} className={`glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-center gap-6 group ${loan.status === 'paid' ? 'opacity-60' : ''}`}>
                  <div className="flex gap-4 items-center w-full md:w-auto">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[10px] font-bold group-hover:scale-110 transition-transform uppercase border border-white/10 italic">Item</div>
                    <div>
                      <h4 className="font-bold text-white leading-tight">Purchase #{loan.id.slice(0,8)}</h4>
                      <p className="text-xs text-gray-500 font-medium font-mono">Merchant: {loan.merchant_wallet.slice(0, 8)}...</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto text-center md:text-left border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">
                        {loan.status === 'paid' ? 'Total' : (loan.next_installment ? `Next (#${loan.next_installment.installment_number})` : 'Total')}
                      </p>
                      <p className="font-black text-white italic">
                        {loan.status === 'paid' ? loan.amount_xlm : (loan.next_installment ? loan.next_installment.amount_xlm : loan.amount_xlm)} XLM
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">Status</p>
                      <p className={`font-black uppercase text-[10px] tracking-widest px-2 py-1 rounded inline-block ${loan.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {loan.status === 'paid' ? 'Paid' : (loan.next_installment ? `${loan.installments.filter((ins: any) => ins.status === 'completed').length}/3 Paid` : 'Active')}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">
                        {loan.status === 'paid' ? 'Completed' : 'Next Due'}
                      </p>
                      <p className="font-medium text-xs text-gray-400">
                        {loan.status === 'paid' ? new Date(loan.updated_at).toLocaleDateString() : (loan.next_installment ? new Date(loan.next_installment.due_date).toLocaleDateString() : new Date(loan.created_at).toLocaleDateString())}
                      </p>
                    </div>
                  </div>
                  
                  {loan.status !== 'paid' && (
                    <button 
                      onClick={() => handleRepay(loan.id, loan.next_installment ? loan.next_installment.amount_xlm : loan.amount_xlm)}
                      disabled={!!actionLoading}
                      className="w-full md:w-auto px-10 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black transition shadow-lg shadow-purple-500/20 uppercase tracking-widest italic text-white"
                    >
                      {actionLoading === loan.id ? 'Processing...' : (loan.next_installment ? `Pay Installment #${loan.next_installment.installment_number}` : 'Pay Now')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <FundAccount publicKey={publicKey} onFunded={fetchData} />
            <div className="glass p-8 rounded-[2.5rem] flex flex-col justify-center border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Repayment History</p>
              <div className="space-y-3 opacity-40">
                <div className="h-2 w-3/4 bg-white/10 rounded"></div>
                <div className="h-2 w-1/2 bg-white/10 rounded"></div>
              </div>
              <p className="text-[10px] text-purple-400 font-bold mt-4 uppercase tracking-tighter italic">Insights coming soon</p>
            </div>
          </div>
        </div>

        {/* Reputation Engine */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight uppercase" id="passport">Trust Passport</h2>
          <div className="glass p-8 rounded-[3rem] border border-purple-500/20 relative overflow-hidden bg-gradient-to-b from-purple-500/[0.05] to-transparent">
            <div className="text-center mb-10 relative z-10">
              <div className={`inline-block p-6 rounded-[2rem] mb-6 shadow-2xl ${reputation.tier === 'Gold' ? 'bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-orange-500/40' : 'bg-gradient-to-tr from-gray-400 to-gray-600 shadow-gray-500/40'}`}>
                <span className="text-4xl font-black text-white uppercase italic">{reputation.tier[0]}</span>
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{reputation.tier} Member</h3>
              <p className="text-sm text-purple-400 font-bold mt-1 uppercase tracking-widest">{reputation.tier === 'Gold' ? 'Top Tier' : 'Growing Reputation'}</p>
            </div>
            
            <div className="mb-10 relative z-10">
              <div className="flex justify-between items-end mb-2">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Trust Score</p>
                <p className="text-xl font-black text-white">{reputation.score}</p>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(reputation.score / 500) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 font-bold text-center uppercase tracking-widest">
                {pointsToNext > 0 ? `${pointsToNext} points to ${nextTier}` : 'Max Tier Unlocked'}
              </p>
            </div>

            <div className="space-y-4 mb-10 relative z-10">
              <PassportStat label="On Time Rate" value="100%" color="text-emerald-400" />
              <PassportStat label="Loans Completed" value={profile?.reputation?.total_loans || "12"} />
              <PassportStat label="Total Repaid" value={`${profile?.reputation?.total_repaid || 0} XLM`} />
              <PassportStat label="Member Since" value="May 2026" />
            </div>
            
            <button 
              onClick={sharePassport}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black transition uppercase tracking-[0.2em] text-white italic"
            >
              Share On Chain Passport
            </button>
            
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-10 right-10 w-32 h-32 border-4 border-purple-500 rounded-full"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 border-4 border-purple-500 rounded-full"></div>
            </div>
          </div>

          {/* Roadmap */}
          <div className="glass p-8 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Tier Roadmap</h3>
            <div className="space-y-6">
              <RoadmapStep tier="Bronze" limit="200" current={reputation.tier === 'Bronze'} completed={true} />
              <RoadmapStep tier="Silver" limit="500" current={reputation.tier === 'Silver'} completed={reputation.tier !== 'Bronze'} />
              <RoadmapStep tier="Gold" limit="1,000" current={reputation.tier === 'Gold'} completed={reputation.tier === 'Gold' || reputation.tier === 'Platinum'} />
              <RoadmapStep tier="Platinum" limit="2,500" current={reputation.tier === 'Platinum'} completed={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassportStat({ label, value, color = "text-white" }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{label}</span>
      <span className={`text-xs font-black italic ${color}`}>{value}</span>
    </div>
  );
}

function RoadmapStep({ tier, limit, current, completed }: any) {
  return (
    <div className={`flex items-center gap-4 ${!completed && !current ? 'opacity-30' : ''}`}>
      <div className={`w-3 h-3 rounded-full ${completed ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : current ? 'bg-purple-500 animate-pulse' : 'bg-gray-700'}`}></div>
      <div>
        <p className={`text-xs font-black uppercase tracking-tighter ${current ? 'text-purple-400' : 'text-white'}`}>{tier}</p>
        <p className="text-[10px] text-gray-500 font-bold uppercase">{limit} XLM Limit</p>
      </div>
      {current && <span className="ml-auto text-[8px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded uppercase italic">Current</span>}
    </div>
  );
}
