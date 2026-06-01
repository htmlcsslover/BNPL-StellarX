'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const { user } = useUser();
  const [stats] = useState({
    availableCredit: 1000,
    trustScore: 450,
    currentTier: 'Gold',
    communityImpact: 12,
    totalRepaid: 830,
    totalSales: 5
  });

  if (user) {
    return <UnifiedDashboard user={user} stats={stats} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      {/* Hero Section */}
      <div className="text-center mb-24">
        <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
          Community-Powered Credit Infrastructure
        </div>
        <h1 className="text-5xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-none uppercase">
          Banking the <span className="bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">Unbanked</span> <br/>
          on Stellar.
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          The first decentralized credit network for the Philippines. 
          Access community-funded credit and build a global reputation using Stellar's high-speed rail.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/marketplace" className="w-full sm:w-auto px-12 py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all hover:scale-105 shadow-xl shadow-purple-500/20 uppercase tracking-wider italic">
            Explore Marketplace
          </Link>
          <Link href="/dashboard/lp" className="w-full sm:w-auto px-12 py-5 glass text-white font-bold rounded-2xl hover:bg-white/10 transition-all uppercase tracking-wider">
            Become a Sponsor
          </Link>
        </div>
      </div>

      {/* Stellar Showcase */}
      <div className="mb-32">
        <p className="text-center text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-12">Powered by Stellar Ecosystem</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 opacity-50 grayscale hover:opacity-100 transition-all duration-700">
          {[
            { name: 'Soroban', desc: 'Smart Contracts' },
            { name: 'Freighter', desc: 'Wallet ID' },
            { name: 'Horizon', desc: 'Data Indexer' },
            { name: 'Friendbot', desc: 'Testnet Faucet' },
            { name: 'Native XLM', desc: 'Gas & Asset' },
          ].map((tech) => (
            <div key={tech.name} className="text-center p-6 glass rounded-3xl border border-white/5 uppercase">
              <p className="font-black text-white mb-1 tracking-tighter">{tech.name}</p>
              <p className="text-[10px] text-gray-400 font-bold tracking-widest">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Stories */}
      <div className="mb-32">
        <h2 className="text-3xl font-bold mb-12 text-center uppercase tracking-widest">Impact Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Maria', story: 'Purchased a laptop for her online classes. Repaid in 3 months and unlocked Gold Tier status.', status: 'Gold Member' },
            { name: 'Juan', story: 'Used StellarBNPL to fund inventory for his small store during peak season. Grew sales by 40%.', status: 'Merchant' },
            { name: 'Elena', story: 'Repatriated funds from Dubai as a Sponsor. Earning 12% APY while helping her hometown.', status: 'Sponsor' },
          ].map((impact, i) => (
            <div key={i} className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-500 absolute top-0 left-0 w-0 group-hover:w-full transition-all duration-700"></div>
              <p className="text-gray-300 mb-8 italic leading-relaxed">"{impact.story}"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-purple-400 border border-purple-500/20">{impact.name[0]}</div>
                <div>
                  <p className="font-bold text-white uppercase tracking-tight">{impact.name}</p>
                  <p className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter italic">{impact.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="glass p-12 rounded-[3rem] border border-white/5">
        <h2 className="text-3xl font-bold mb-12 text-center uppercase tracking-widest">The Vision</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { phase: '1', title: 'BNPL Infrastructure', status: 'Live' },
            { phase: '2', title: 'On-chain Reputation', status: 'Current' },
            { phase: '3', title: 'Merchant Financing', status: 'Upcoming' },
            { phase: '4', title: 'Cross-border Lending', status: '2026' },
            { phase: '5', title: 'Credit Protocol', status: 'Long-term' },
          ].map((item) => (
            <div key={item.phase} className="p-6 rounded-2xl bg-white/5 border border-white/5 relative">
              <p className="text-[10px] font-black text-purple-500 mb-2 uppercase">Phase {item.phase}</p>
              <p className="font-bold text-sm text-white mb-4 leading-tight uppercase tracking-tight">{item.title}</p>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${item.status === 'Live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UnifiedDashboard({ user, stats }: { user: any, stats: any }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase">Member Hub</h1>
          <p className="text-gray-400 font-medium italic">Community-powered credit at your fingertips.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/marketplace" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition shadow-lg shadow-purple-500/20 text-sm uppercase tracking-widest italic">
            Browse Marketplace
          </Link>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
        <MetricCard label="Available Credit" value={`${stats.availableCredit} XLM`} sub="0% Interest" color="text-emerald-400" />
        <MetricCard label="Trust Score" value={stats.trustScore} sub="Goal: 500" color="text-purple-400" />
        <MetricCard label="Current Tier" value={stats.currentTier} sub="Gold Status" color="text-yellow-500" />
        <MetricCard label="Impact" value={stats.communityImpact} sub="People Funded" color="text-blue-400" />
        <MetricCard label="Total Repaid" value={`${stats.totalRepaid} XLM`} sub="100% On-time" color="text-indigo-400" />
        <MetricCard label="Sales" value={stats.totalSales} sub="Orders" color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation / Hub */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <HubCard 
            title="My Credit" 
            desc="Track active loans and repayment progress." 
            href="/dashboard/borrower" 
            icon="CARD"
            stats={{ label: 'Active Loans', value: '1' }}
          />
          <HubCard 
            title="My Store" 
            desc="Manage your listings and view sales analytics." 
            href="/dashboard/seller" 
            icon="STORE"
            stats={{ label: 'Store Rating', value: '4.9/5' }}
          />
          <HubCard 
            title="Community Pool" 
            desc="Provide liquidity and earn impact yield." 
            href="/dashboard/lp" 
            icon="POOL"
            stats={{ label: 'Average Yield', value: '12.4%' }}
          />
          <HubCard 
            title="Trust Passport" 
            desc="Share your verified credit history." 
            href="/dashboard/borrower#passport" 
            icon="PASS"
            stats={{ label: 'Verification', value: 'On-chain' }}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-widest">
            Quick Actions
          </h2>
          <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-4">
            <Link href="/dashboard/seller/create" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition border border-white/5 group">
              <span className="font-bold text-sm uppercase tracking-tight">Create New Listing</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/marketplace" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition border border-white/5 group">
              <span className="font-bold text-sm uppercase tracking-tight">Use BNPL Credit</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/dashboard/lp" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition border border-white/5 group">
              <span className="font-bold text-sm uppercase tracking-tight">Deposit to Pool</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          
          <div className="glass p-8 rounded-[2.5rem] border border-purple-500/20 bg-purple-500/5">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-4">Stellar Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Network Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: any) {
  return (
    <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all">
      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">{label}</p>
      <div>
        <p className={`text-2xl font-black mb-1 tracking-tighter italic ${color}`}>{value}</p>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{sub}</p>
      </div>
    </div>
  );
}

function HubCard({ title, desc, href, icon, stats }: any) {
  return (
    <Link href={href} className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden">
      <div className="inline-block px-3 py-1 rounded bg-white/5 text-[10px] font-black text-gray-400 mb-6 border border-white/10 uppercase italic tracking-widest">{icon}</div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-8 italic">{desc}</p>
      <div className="pt-6 border-t border-white/5 flex justify-between items-center">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{stats.label}</p>
          <p className="text-lg font-black text-white italic">{stats.value}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-600 transition-colors border border-white/5">
          <span className="text-lg italic">→</span>
        </div>
      </div>
    </Link>
  );
}
