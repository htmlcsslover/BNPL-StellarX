'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useUser } from '@/hooks/useUser';

import { API_BASE_URL, safeFetch, generateIdempotencyKey } from '@/lib/api';

interface Product {
  id: string;
  title: string;
  description: string;
  price_xlm: number;
  image_url: string;
  seller_wallet: string;
  seller_name: string;
  category: string;
}

const CATEGORIES = ['All', 'Electronics', 'Home', 'Education', 'Transportation', 'Services'];

export default function Marketplace() {
  const { publicKey } = useWallet();
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      const result = await safeFetch(`${API_BASE_URL}/api/products`);
      if (result.ok) {
        setProducts(result.data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const router = useRouter();

  const handleBNPL = async () => {
    if (!publicKey || !user || !selectedProduct) return;
    
    setActionLoading(true);
    setStatusMessage({ type: '', text: '' });
    
    try {
      const result = await safeFetch(`${API_BASE_URL}/api/loans`, {
        method: 'POST',
        headers: { 
          'X-Idempotency-Key': generateIdempotencyKey(`loan_${selectedProduct.id}_${publicKey}`) 
        },
        body: JSON.stringify({
          borrower_wallet: publicKey,
          merchant_wallet: selectedProduct.seller_wallet,
          product_id: selectedProduct.id,
          amount_xlm: selectedProduct.price_xlm,
        }),
      });
      
      if (result.ok) {
        setStatusMessage({ type: 'success', text: 'BNPL loan initiated successfully on Soroban.' });
        setTimeout(() => router.push('/dashboard/borrower'), 1500);
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Failed to initiate BNPL.' });
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Connection error during checkout.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter">Marketplace</h1>
          <p className="text-gray-400 font-medium">Discover products with community-powered financing.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      {activeCategory === 'All' && products.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em] text-gray-500 text-xs">Featured Selection</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {products.slice(0, 2).map(product => (
              <FeaturedCard key={product.id} product={product} onSelect={setSelectedProduct} />
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div>
        <div className="flex items-center gap-2 mb-8">
          <h2 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em] text-gray-500 text-xs">
            {activeCategory === 'All' ? 'Recently Added' : `${activeCategory} Listings`}
          </h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => <div key={i} className="h-96 glass rounded-[2.5rem] animate-pulse"></div>)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass p-20 rounded-[3rem] text-center border-dashed border-white/10">
            <p className="text-gray-500 font-bold">No items found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} isOwnItem={user?.wallet_address === product.seller_wallet} />
            ))}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl transition-all">
          <div className="glass max-w-md w-full p-8 rounded-[3rem] relative border border-white/10 shadow-2xl">
            <button 
              onClick={() => { setSelectedProduct(null); setStatusMessage({ type: '', text: '' }); }}
              className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-6">
              Soroban Checkout
            </div>
            
            <div className="flex gap-6 mb-10">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border border-white/10 flex-shrink-0">
                <img src={selectedProduct.image_url} alt={selectedProduct.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white leading-tight mb-1">{selectedProduct.title}</h4>
                <p className="text-xs text-gray-500 font-bold mb-2">by {selectedProduct.seller_name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-purple-400">{selectedProduct.price_xlm}</span>
                  <span className="text-xs font-bold text-gray-600">XLM</span>
                </div>
              </div>
            </div>

            {statusMessage.text && (
              <div className={`mb-6 p-3 rounded-xl border ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} text-[10px] font-bold text-center`}>
                {statusMessage.text}
              </div>
            )}

            <div className="space-y-4 mb-10">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Financing Options</h3>
              <div className="p-5 rounded-[2rem] border-2 border-purple-500 bg-purple-500/10 relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 p-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <p className="font-black text-sm text-white uppercase tracking-tighter italic">3 Installments</p>
                </div>
                <p className="text-3xl font-black text-white tracking-tighter mb-1">{(Number(selectedProduct.price_xlm || 0) / 3).toFixed(2)} <span className="text-sm font-bold text-purple-400">XLM/mo</span></p>
                <p className="text-[10px] text-purple-300 font-bold">Total: {selectedProduct.price_xlm} XLM • 0% APR • Community Funded</p>
              </div>
            </div>

            {!publicKey ? (
              <p className="text-center text-xs font-bold text-red-400 mb-4 bg-red-400/10 py-3 rounded-2xl">Connect wallet to purchase</p>
            ) : !user ? (
              <p className="text-center text-xs font-bold text-purple-400 mb-4 bg-purple-400/10 py-3 rounded-2xl">Register to use BNPL Credit</p>
            ) : (
              <button 
                onClick={handleBNPL}
                disabled={actionLoading}
                className="w-full py-5 px-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-purple-500/30 uppercase tracking-[0.1em] italic"
              >
                {actionLoading ? 'Authorizing...' : 'Confirm BNPL Purchase'}
              </button>
            )}
            
            <p className="text-center text-[9px] text-gray-600 mt-6 uppercase font-bold tracking-widest">Transaction secured by Soroban Protocol</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onSelect, isOwnItem }: any) {
  return (
    <div className="glass rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-all duration-500 flex flex-col border border-white/5 hover:border-purple-500/30 group">
      <div className="h-56 bg-gray-900 relative overflow-hidden">
        <img 
          src={product.image_url} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        />
        <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-md text-[9px] font-black px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest text-purple-400">
          BNPL Eligible
        </div>
        <div className="absolute bottom-4 left-5 bg-purple-600 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">
          {product.category}
        </div>
      </div>
      <div className="p-7 flex-1 flex flex-col">
        <p className="text-[10px] text-gray-500 font-black mb-2 uppercase tracking-widest">{product.seller_name}</p>
        <h3 className="text-lg font-black text-white mb-3 line-clamp-1 group-hover:text-purple-400 transition-colors">{product.title}</h3>
        
        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">From</p>
            <p className="text-2xl font-black text-white tracking-tighter">{(Number(product.price_xlm || 0) / 3).toFixed(2)} <span className="text-xs font-bold text-gray-600">XLM</span></p>
          </div>
          <button 
            onClick={() => onSelect(product)}
            disabled={isOwnItem}
            className={`px-6 py-3 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest italic ${
              isOwnItem 
                ? 'bg-white/5 text-gray-600 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-purple-600 hover:text-white shadow-lg'
            }`}
          >
            {isOwnItem ? 'Your Item' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedCard({ product, onSelect }: any) {
  return (
    <div className="glass rounded-[3rem] overflow-hidden border border-white/5 hover:border-purple-500/20 transition-all duration-500 flex flex-col md:flex-row h-full group">
      <div className="md:w-1/2 h-64 md:h-auto bg-gray-900 overflow-hidden relative">
        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/20"></div>
      </div>
      <div className="md:w-1/2 p-10 flex flex-col justify-center">
        <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-4 block">Top Recommendation</span>
        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter leading-none">{product.title}</h3>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Buy for</p>
            <p className="text-2xl font-black text-white tracking-tighter">{product.price_xlm} <span className="text-xs font-bold text-gray-600 uppercase">XLM</span></p>
          </div>
          <button 
            onClick={() => onSelect(product)}
            className="w-14 h-14 rounded-3xl bg-purple-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 hover:scale-110 transition-transform italic font-black text-xl"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
