'use client';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { API_BASE_URL, safeFetch, generateIdempotencyKey } from '@/lib/api';

const COMMUNITIES = ['Quezon City', 'Fairview', 'Bulacan', 'Manila'];

export default function CommunityPool() {
  const { publicKey } = useWallet();
  const [isSponsorMode, setIsSponsorMode] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState('Quezon City');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({
    total_liquidity: 0,
    active_loans: 0,
    repayment_success_rate: 0,
    total_funded: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const result = await safeFetch(`${API_BASE_URL}/api/pool/stats`);
      if (result.ok) {
        setStats(result.data);
      }
    } catch (e) {
      console.error('Failed to fetch pool stats:', e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const result = await safeFetch(`${API_BASE_URL}/api/pool/deposit`, {
        method: 'POST',
        body: JSON.stringify({
          wallet_address: publicKey,
          amount_xlm: amount,
          idempotency_key: generateIdempotencyKey()
        }),
      });

      if (result.ok) {
        setStatusMessage({ type: 'success', text: 'Liquidity provided successfully. Updating records...' });
        setAmount('');
        // Small delay to allow simulation to update
        setTimeout(async () => {
          await fetchStats();
          setLoading(false);
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Failed to provide liquidity' });
        setLoading(false);
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Connection error during deposit.' });
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4 tracking-tighter">Identity Required</h1>
        <p className="text-gray-400">You need to connect your Freighter wallet to participate in the community pool.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase">Community Pool</h1>
          <p className="text-gray-400 font-medium italic">Empower local commerce with community funded credit.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button 
            onClick={() => setIsSponsorMode(false)}
            className={`text-xs font-black px-5 py-2.5 rounded-xl transition-all uppercase tracking-widest ${!isSponsorMode ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Standard Yield
          </button>
          <button 
            onClick={() => setIsSponsorMode(true)}
            className={`text-xs font-black px-5 py-2.5 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 ${isSponsorMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Impact Mode
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <PoolMetric label="Total Liquidity" value={`${stats.total_liquidity.toLocaleString()} XLM`} sub="Community Owned" color="text-white" />
        <PoolMetric label="Loans Funded" value={stats.total_funded.toLocaleString()} sub="Across PH" color="text-purple-400" />
        <PoolMetric label="Average Yield" value="12.4%" sub="Variable APY" color="text-emerald-400" />
        <PoolMetric label="Communities" value="14" sub="Active Regions" color="text-indigo-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Manage Funds */}
        <div className="lg:col-span-2 space-y-10">
          <section>
             <h2 className="text-2xl font-black mb-8 tracking-tight flex items-center gap-3">
               <span className="w-10 h-10 rounded-2xl bg-purple-600/10 flex items-center justify-center text-xl font-bold uppercase border border-purple-500/20 italic">Liquidity</span>
               Manage Your Liquidity
             </h2>
             <div className="glass p-10 rounded-[3rem] border border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
                 <span className="text-9xl font-black italic uppercase">DEPOSIT</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Amount to Provide (XLM)</label>
                    <div className="relative mb-6">
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00" 
                        className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-6 focus:outline-none focus:border-purple-500 text-3xl font-black text-white placeholder:text-white/10" 
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-500 uppercase">XLM</div>
                    </div>

                    {statusMessage.text && (
                      <p className={`text-xs font-bold mb-6 ${statusMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {statusMessage.text}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={handleDeposit}
                        disabled={loading}
                        className="py-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-[1.5rem] transition-all shadow-xl shadow-purple-500/20 uppercase tracking-widest italic text-xs"
                      >
                        {loading ? 'Processing...' : 'Provide XLM'}
                      </button>
                      <button className="py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-[1.5rem] transition-all uppercase tracking-widest text-xs">Withdraw</button>
                    </div>
                 </div>

                 <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-center">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Your Impact</p>
                    <p className="text-white font-bold leading-relaxed mb-6">
                      Your current liquidity has helped fund <span className="text-purple-400 text-xl font-black italic mx-1">8</span> successful purchases this month.
                    </p>
                    <div className="space-y-4 pt-6 border-t border-white/5">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-bold uppercase">Estimated Monthly Yield</span>
                          <span className="text-emerald-400 font-black">+42.50 XLM</span>
                       </div>
                    </div>
                 </div>
               </div>
             </div>
          </section>

          {isSponsorMode && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <h2 className="text-2xl font-black mb-8 tracking-tight flex items-center gap-3">
                 <span className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-xl font-bold uppercase border border-indigo-500/20 italic">Target</span>
                 Select Target Community
               </h2>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {COMMUNITIES.map(city => (
                   <button 
                    key={city}
                    onClick={() => setSelectedCommunity(city)}
                    className={`p-6 rounded-[2rem] border transition-all text-left group ${selectedCommunity === city ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20' : 'bg-white/5 border-white/5 hover:border-indigo-500/30'}`}
                   >
                     <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedCommunity === city ? 'text-indigo-200' : 'text-gray-500'}`}>Sponsor</p>
                     <p className={`font-black tracking-tight ${selectedCommunity === city ? 'text-white' : 'text-gray-400'}`}>{city}</p>
                   </button>
                 ))}
               </div>
            </section>
          )}
        </div>

        {/* Pool Activity */}
        <div className="space-y-10">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-xl font-bold uppercase border border-emerald-500/20 italic">Activity</span>
            Pool Activity
          </h2>
          <div className="glass p-8 rounded-[3rem] border border-white/10 space-y-6 relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
            {[
              { type: 'Loan Funded', amount: '-300 XLM', date: '2 hours ago', status: 'Active', user: 'Maria' },
              { type: 'Repayment Received', amount: '+100 XLM', date: '5 hours ago', status: 'Success', user: 'User' },
              { type: 'Yield Distributed', amount: '+15.4 XLM', date: '1 day ago', status: 'Done', user: 'System' },
              { type: 'Loan Funded', amount: '-120 XLM', date: '2 days ago', status: 'Active', user: 'Juan' },
            ].map((activity, i) => (
              <div key={i} className="flex justify-between items-center pb-6 border-b border-white/5 last:border-0 last:pb-0 group cursor-default">
                <div>
                  <p className="font-black text-sm text-white group-hover:text-purple-400 transition-colors uppercase tracking-tighter italic">{activity.type}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{activity.date} • {activity.user}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-lg tracking-tighter ${activity.amount.startsWith('+') ? 'text-emerald-400' : 'text-red-500'}`}>{activity.amount}</p>
                  <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${activity.status === 'Active' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{activity.status}</p>
                </div>
              </div>
            ))}
            
            <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black text-gray-400 hover:text-white transition uppercase tracking-[0.2em]">View All Analytics</button>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-tr from-indigo-500/[0.05] to-transparent">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Risk Management</h3>
            <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-tighter">
              Loans are 100% collateralized by on chain reputation. In case of default, the borrower trust passport is blacklisted across the Stellar credit network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PoolMetric({ label, value, sub, color }: any) {
  return (
    <div className="glass p-7 rounded-[2.5rem] border border-white/5 flex flex-col justify-between hover:border-purple-500/20 transition-all duration-500">
      <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">{label}</p>
      <div>
        <p className={`text-3xl font-black mb-1 tracking-tighter ${color}`}>{value}</p>
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">{sub}</p>
      </div>
    </div>
  );
}
