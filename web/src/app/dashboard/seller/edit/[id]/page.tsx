'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

import { API_BASE_URL } from '@/lib/api';

const CATEGORIES = ['Electronics', 'Home', 'Education', 'Transportation', 'Services'];

export default function EditListing() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_xlm: '',
    image_url: '',
    category: 'Electronics',
    status: 'active',
  });

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE_URL}/api/products`) // In a real app we'd have GET /api/products/:id
      .then(res => res.json())
      .then(products => {
        const product = products.find((p: any) => p.id === id);
        if (product) {
          setFormData({
            title: product.title,
            description: product.description,
            price_xlm: product.price_xlm.toString(),
            image_url: product.image_url,
            category: product.category,
            status: product.status,
          });
        }
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price_xlm: parseFloat(formData.price_xlm),
        }),
      });
      
      if (res.ok) {
        router.push('/dashboard/seller');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black italic animate-pulse">Synchronizing Data...</div>;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400"
        >
          ←
        </button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Edit Listing</h1>
          <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px]">Update Market Availability</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="glass p-10 rounded-[3rem] space-y-8 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none select-none text-right">
          <span className="text-9xl font-black italic block">UPDATE</span>
          <span className="text-4xl font-black italic block">#{id.slice(0,8)}</span>
        </div>

        <div className="relative z-10">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Product Identity</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-xl font-bold text-white transition-all"
          />
        </div>

        <div className="relative z-10">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Market Description</label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-sm leading-relaxed text-gray-300 transition-all"
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-xl font-bold text-white transition-all"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-500">XLM</div>
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
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Market Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 text-sm font-bold text-white appearance-none transition-all"
          >
            <option value="active">Active (Available for BNPL)</option>
            <option value="inactive">Inactive (Hidden from Market)</option>
            <option value="sold">Sold Out</option>
          </select>
        </div>

        <div className="pt-6 relative z-10 flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-2xl font-black transition-all hover:scale-[1.01] shadow-2xl shadow-purple-500/20 uppercase tracking-widest italic text-white"
          >
            {isSubmitting ? 'Syncing...' : 'Confirm Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
