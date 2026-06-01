'use client';
import { useState } from 'react';
import type { WalletState } from '@/hooks/useWallet';

export default function ConnectWallet({
  publicKey,
  connecting,
  error,
  connect,
  disconnect,
}: WalletState) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copy}
          title="Copy full address"
          className="rounded bg-white/5 border border-white/10 px-3 py-1 font-mono text-[10px] text-gray-300 transition-colors hover:bg-white/10 uppercase tracking-widest font-bold"
        >
          {copied ? 'Copied!' : `${publicKey.slice(0, 6)}…${publicKey.slice(-6)}`}
        </button>
        <button
          onClick={disconnect}
          className="p-2 rounded bg-white/5 border border-white/10 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Disconnect Wallet"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        onClick={connect}
        disabled={connecting}
        className="rounded-xl bg-purple-600 px-6 py-2.5 text-white font-black transition-all hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-500/20 uppercase text-[10px] tracking-widest italic"
      >
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {error && <p className="mt-2 max-w-xs text-sm text-red-500">{error}</p>}
    </div>
  );
}
