'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useUser } from '@/hooks/useUser';
import { API_BASE_URL } from '@/lib/api';

export default function Register() {
  const { publicKey } = useWallet();
  const { user, register } = useUser();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;
    
    setIsSubmitting(true);
    try {
      const success = await register(publicKey, 'buyer', displayName);
      if (success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="max-w-md mx-auto mt-32 text-center p-12 glass rounded-[3rem] border border-white/10 shadow-2xl">
        <div className="w-20 h-20 rounded-3xl bg-purple-600/10 flex items-center justify-center mx-auto mb-8">
           <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tighter">Identity Locked</h1>
        <p className="text-gray-400 font-medium leading-relaxed mb-8 text-sm">Please connect your Freighter wallet to authorize your on-chain credit profile.</p>
        <div className="flex justify-center">
           <div className="animate-bounce">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-20 p-12 glass rounded-[3.5rem] border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.1)] relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]"></div>
      
      <div className="relative z-10">
        <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-8">
          Member Onboarding
        </div>
        <h1 className="text-5xl font-black mb-4 tracking-tighter text-white">Join the <br/>Network.</h1>
        <p className="text-gray-400 font-medium mb-12 max-w-sm leading-relaxed">Your wallet address is your global ID. Choose a name to start buying, selling, and sponsoring.</p>

        <form onSubmit={handleRegister} className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">How should we call you?</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-purple-500 text-xl font-bold text-white transition-all placeholder:text-white/10"
            />
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Verified Wallet</p>
            <p className="font-mono text-[10px] break-all text-purple-400/80">{publicKey}</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 px-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-[2rem] font-black transition-all hover:scale-[1.02] shadow-2xl shadow-purple-500/30 uppercase tracking-[0.2em] italic text-white"
          >
            {isSubmitting ? 'Initializing Profile...' : 'Begin Journey'}
          </button>
          
          <p className="text-center text-[9px] text-gray-600 uppercase font-bold tracking-widest leading-relaxed">
            By joining, you agree to build a trust-based <br/>credit reputation on the Stellar network.
          </p>
        </form>
      </div>
    </div>
  );
}
