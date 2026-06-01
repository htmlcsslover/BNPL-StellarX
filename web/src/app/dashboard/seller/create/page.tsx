'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

import { API_BASE_URL, safeFetch, generateIdempotencyKey } from '@/lib/api';

const CATEGORIES = ['Electronics', 'Home', 'Education', 'Transportation', 'Services'];

export default function CreateListing() {
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_xlm: '',
    image_url: '',
    category: 'Electronics',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });
    
    try {
      const result = await safeFetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          seller_wallet: user.wallet_address,
          price_xlm: parseFloat(formData.price_xlm),
          idempotency_key: generateIdempotencyKey()
        }),
      });
      
      if (result.ok) {
        setStatusMessage({ type: 'success', text: 'Listing created successfully. Redirecting...' });
        setTimeout(() => {
          router.push('/dashboard/seller');
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Failed to create listing.' });
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Connection error while listing product.' });
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 border border-white/5"
        >
          BACK
        </button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">New Listing</h1>
          <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px]">Merchant Onboarding Flow</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="glass p-10 rounded-[3rem] space-y-8 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none select-none">
          <span className="text-9xl font-black italic uppercase">LISTING</span>
        </div>

        {statusMessage.text && (
          <div className={`relative z-20 mb-8 p-4 rounded-2xl border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          } text-sm font-bold text-center`}>
            {statusMessage.text}
          </div>
        )}

        <div className="relative z-10">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Product Identity</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-xl font-bold text-white transition-all placeholder:text-white/10"
            placeholder="e.g. Premium Tech Bundle"
          />
        </div>

        <div className="relative z-10">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Market Description</label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-sm leading-relaxed text-gray-300 transition-all placeholder:text-white/10"
            placeholder="Describe the value of your product to potential buyers..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Price (Native XLM)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={formData.price_xlm}
                onChange={(e) => setFormData({ ...formData, price_xlm: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-xl font-bold text-white transition-all placeholder:text-white/10"
                placeholder="0.00"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-500 uppercase">XLM</div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Vertical Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-sm font-bold text-white appearance-none transition-all"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="relative z-10">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Visual Asset URL</label>
          <input
            type="url"
            required
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-xs font-mono text-gray-400 transition-all placeholder:text-white/10"
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div className="pt-6 relative z-10">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-[1.5rem] font-black transition-all hover:scale-[1.01] shadow-2xl shadow-purple-500/20 uppercase tracking-widest italic text-white"
          >
            {isSubmitting ? 'Syncing with Ledger...' : 'Authorize & List Product'}
          </button>
          <p className="text-center text-[9px] text-gray-600 mt-6 uppercase font-bold tracking-[0.2em]">Listing will be immediately available in the Global Marketplace</p>
        </div>
      </form>
    </div>
  );
}
