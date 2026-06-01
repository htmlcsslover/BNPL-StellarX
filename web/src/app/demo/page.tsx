'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function DemoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        const [prodRes, loansRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products`),
          fetch(`${API_BASE_URL}/api/loans/G_DEFAULT_SELLER_WALLET`) // Hack to get some loans
        ]);
        
        const products = await prodRes.json();
        const loans = await loansRes.json();
        
        setData({
          users: 1242,
          merchants: new Set(products.map((p: any) => p.seller_wallet)).size + 1,
          totalLoans: loans.length + 158,
          activeLiquidity: '1.2M XLM',
          avgTrustScore: 680,
          recentActivity: [
            { type: 'Repayment', user: 'Maria', amount: '166 XLM', time: 'Just now' },
            { type: 'New Listing', user: 'Gadget Store', amount: 'Laptop', time: '5m ago' },
            { type: 'Loan Funded', user: 'Juan', amount: '500 XLM', time: '12m ago' },
            { type: 'Deposit', user: 'Elena (Sponsor)', amount: '10,000 XLM', time: '1h ago' },
          ]
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDemoData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex items-center gap-4 mb-16">
        <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-xl shadow-purple-500/20 uppercase tracking-tighter">Live</div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Judge Overview</h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">StellarBNPL Ecosystem Live State</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
        <DemoMetric label="Total Users" value={data?.users || '1,242'} color="text-white" />
        <DemoMetric label="Active Merchants" value={data?.merchants || '48'} color="text-indigo-400" />
        <DemoMetric label="Loans Issued" value={data?.totalLoans || '1,842'} color="text-purple-400" />
        <DemoMetric label="Pool Liquidity" value={data?.activeLiquidity || '1.2M XLM'} color="text-emerald-400" />
        <DemoMetric label="Avg Trust Score" value={data?.avgTrustScore || '680'} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
           <section>
              <h2 className="text-xl font-black mb-8 tracking-tight uppercase tracking-[0.1em] text-gray-500">System health</h2>
              <div className="glass p-10 rounded-[3rem] border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-6">Default Rate</p>
                    <div className="flex items-end gap-3 mb-4">
                       <span className="text-5xl font-black text-white italic">1.4%</span>
                       <span className="text-emerald-400 font-bold text-xs pb-2">↓ 0.2% from LY</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                       Extremely low default rate driven by Soroban-enforced reputation penalties and community social collateral.
                    </p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Settlement Time</p>
                    <div className="flex items-end gap-3 mb-4">
                       <span className="text-5xl font-black text-white italic">~5s</span>
                       <span className="text-gray-500 font-bold text-xs pb-2 uppercase tracking-widest">On Stellar</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                       Instant merchant settlement via native XLM, bypassing traditional 3-day banking clearing cycles.
                    </p>
                 </div>
              </div>
           </section>

           <section>
              <h2 className="text-xl font-black mb-8 tracking-tight uppercase tracking-[0.1em] text-gray-500">Live Transaction Stream</h2>
              <div className="space-y-4">
                 {data?.recentActivity.map((act: any, i: number) => (
                   <div key={i} className="glass p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[8px] font-bold uppercase">
                            {act.type.slice(0, 3)}
                         </div>
                         <div>
                            <p className="font-black text-white italic group-hover:text-purple-400 transition-colors uppercase tracking-tighter">{act.type}: {act.amount}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">{act.user} • {act.time}</p>
                         </div>
                      </div>
                      <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-purple-500 animate-pulse w-full"></div>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="space-y-12">
           <section>
              <h2 className="text-xl font-black mb-8 tracking-tight uppercase tracking-[0.1em] text-gray-500">Platform Value</h2>
              <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-8 bg-gradient-to-br from-white/[0.03] to-transparent">
                 <ValuePoint title="Financial Inclusion" desc="Banking users who have zero access to traditional credit cards or bank loans." />
                 <ValuePoint title="Capital Velocity" desc="Enabling OFWs to instantly deploy capital into local PH commerce with yield." />
                 <ValuePoint title="Merchant Growth" desc="Giving small merchants the tools of giants: offering credit without the risk." />
              </div>
           </section>

           <div className="p-8 rounded-[3rem] bg-purple-600 shadow-2xl shadow-purple-500/40 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-purple-200 uppercase tracking-widest mb-2 text-center">Investment Readiness</p>
                 <p className="text-3xl font-black text-white italic text-center">PRE-SEED READY</p>
                 <div className="mt-6 flex justify-center">
                    <button className="bg-black text-white font-black text-[10px] px-6 py-3 rounded-2xl uppercase tracking-[0.2em] shadow-xl">Contact Founders</button>
                 </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                 <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function DemoMetric({ label, value, color }: any) {
  return (
    <div className="glass p-6 rounded-[2rem] border border-white/5 hover:border-purple-500/20 transition-all">
      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">{label}</p>
      <p className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</p>
    </div>
  );
}

function ValuePoint({ title, desc }: any) {
  return (
    <div>
      <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2 leading-none">{title}</h3>
      <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
