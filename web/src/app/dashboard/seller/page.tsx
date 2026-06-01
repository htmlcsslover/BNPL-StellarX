'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';

import { API_BASE_URL } from '@/lib/api';

interface Product {
  id: string;
  title: string;
  description: string;
  price_xlm: number;
  image_url: string;
  status: string;
  created_at: string;
  category: string;
}

export default function MyStore() {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [prodRes, salesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products/seller/${user.wallet_address}`),
        fetch(`${API_BASE_URL}/api/loans/lent/${user.wallet_address}`)
      ]);
      const prodData = await prodRes.json();
      const salesData = await salesRes.json();
      setProducts(prodData);
      setSales(salesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Required</h1>
        <p className="text-gray-400">Please register to access your store dashboard.</p>
      </div>
    );
  }

  const totalVolume = sales.reduce((acc, s) => acc + (parseFloat(s.amount_xlm) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Store Profile Header */}
      <div className="relative mb-16">
        <div className="h-48 w-full rounded-[3rem] bg-gradient-to-r from-indigo-900 via-purple-900 to-black border border-white/10 overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="absolute bottom-0 right-0 p-8">
            <span className="text-8xl font-black text-white/5 italic select-none">OFFICIAL STORE</span>
          </div>
        </div>
        
        <div className="absolute -bottom-10 left-12 flex items-end gap-6">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gray-900 border-4 border-background flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-transparent"></div>
             {user.display_name.slice(0, 1).toUpperCase()}
          </div>
          <div className="pb-4">
            <h1 className="text-3xl font-black text-white tracking-tighter mb-1">{user.display_name}'s Store</h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                4.9 Rating
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verified Merchant</span>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-6 right-8">
           <Link href="/dashboard/seller/create" className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-500/20 uppercase tracking-widest italic text-xs">
            + Create Listing
          </Link>
        </div>
      </div>

      {/* Store Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 mt-20">
        <StoreMetric label="Revenue Earned" value={`${totalVolume.toFixed(2)} XLM`} sub="Settled Instantly" color="text-white" />
        <StoreMetric label="Total Sales" value={sales.length} sub="Lifetime Orders" color="text-indigo-400" />
        <StoreMetric label="Active Items" value={products.filter(p => p.status === 'active').length} sub="In Marketplace" color="text-purple-400" />
        <StoreMetric label="Store Rank" value="Top 10%" sub="In Electronics" color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Listings Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight">Active Listings</h2>
            <div className="h-px flex-1 mx-8 bg-white/5"></div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2].map(i => <div key={i} className="h-64 glass rounded-[2.5rem] animate-pulse"></div>)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 glass rounded-[3rem] border-dashed border-white/10">
              <p className="text-gray-500 font-bold mb-8 italic text-lg">Your store is currently empty.</p>
              <Link href="/dashboard/seller/create" className="text-purple-400 underline font-black uppercase tracking-widest text-xs">Start your first listing</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product) => (
                <div key={product.id} className="glass rounded-[2.5rem] overflow-hidden flex flex-col border border-white/5 group hover:border-purple-500/20 transition-all">
                  <div className="h-44 bg-gray-800 relative overflow-hidden">
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className={`absolute top-4 left-4 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${product.status === 'active' ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-600 text-gray-300'}`}>
                      {product.status}
                    </div>
                  </div>
                  <div className="p-7 flex-1 flex flex-col">
                    <h3 className="text-lg font-black text-white mb-1 truncate group-hover:text-purple-400 transition-colors">{product.title}</h3>
                    <p className="text-2xl font-black text-white mb-6 tracking-tighter">{product.price_xlm} <span className="text-xs font-bold text-gray-500">XLM</span></p>
                    
                    <div className="mt-auto grid grid-cols-2 gap-3 mb-3">
                      <button 
                        onClick={() => updateStatus(product.id, product.status === 'active' ? 'inactive' : 'active')}
                        className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition border border-white/5"
                      >
                        {product.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <Link 
                        href={`/dashboard/seller/edit/${product.id}`}
                        className="py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition border border-indigo-500/10"
                      >
                        Edit
                      </Link>
                    </div>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="w-full py-4 px-6 bg-red-500/5 hover:bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition border border-red-500/5"
                    >
                      Delete Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales History Section */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black tracking-tight whitespace-nowrap">Recent Orders</h2>
            <div className="h-px w-full bg-white/5"></div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 glass rounded-3xl animate-pulse"></div>)}
              </div>
            ) : sales.length === 0 ? (
              <div className="glass p-12 rounded-[2.5rem] text-center border border-white/5 bg-white/[0.02]">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 text-center">Awaiting Sales</p>
                <p className="text-xs text-gray-500 text-center leading-relaxed">Your orders will appear here once buyers use BNPL credit to purchase your items.</p>
              </div>
            ) : (
              sales.map((sale, i) => (
                <div key={i} className="glass p-5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all bg-gradient-to-br from-white/[0.03] to-transparent">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-1">{new Date(sale.created_at).toLocaleDateString()}</p>
                      <p className="font-black text-sm text-white leading-none uppercase tracking-tighter">Order #{sale.id.slice(0,8)}</p>
                    </div>
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${sale.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {sale.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-purple-400 uppercase">{sale.borrower_wallet.slice(0, 1)}</div>
                      <p className="text-[10px] font-bold text-gray-400 truncate w-24">{sale.borrower_wallet.slice(0,4)}...{sale.borrower_wallet.slice(-4)}</p>
                    </div>
                    <p className="font-black text-xl text-white tracking-tighter">{sale.amount_xlm} <span className="text-[10px] text-gray-500 font-bold uppercase">XLM</span></p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-12 glass p-8 rounded-[2.5rem] border border-purple-500/20 bg-purple-500/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <svg className="w-20 h-20 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
             </div>
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-6 relative z-10">Instant Settlement</h3>
            <p className="text-xs text-gray-400 leading-relaxed relative z-10">
              With StellarBNPL, you receive your full asking price in native XLM immediately upon buyer checkout. Repayment risk is managed by the community pool.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreMetric({ label, value, sub, color }: any) {
  return (
    <div className="glass p-7 rounded-[2.5rem] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all bg-white/[0.01]">
      <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">{label}</p>
      <div>
        <p className={`text-2xl font-black mb-1 tracking-tighter ${color}`}>{value}</p>
        <p className="text-[10px] text-gray-600 font-bold uppercase">{sub}</p>
      </div>
    </div>
  );
}
