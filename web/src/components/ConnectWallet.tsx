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
          className="rounded bg-white/5 border border-white/10 px-3 py-1 font-mono text-sm text-gray-300 transition-colors hover:bg-white/10"
        >
          {copied ? 'Copied!' : `${publicKey.slice(0, 6)}…${publicKey.slice(-6)}`}
        </button>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        onClick={connect}
        disabled={connecting}
        className="rounded bg-purple-600 px-4 py-2 text-white font-bold transition-colors hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-500/20"
      >
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {error && <p className="mt-2 max-w-xs text-sm text-red-500">{error}</p>}
    </div>
  );
}
