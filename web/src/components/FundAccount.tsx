"use client";

import { useState, useEffect } from "react";

type FundAccountProps = {
  publicKey?: string | null;
  onFunded?: () => void | Promise<void>;
};

export default function FundAccount({ publicKey, onFunded }: FundAccountProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fundAccount = async () => {
    if (!publicKey) {
      setMessage({ type: 'error', text: "Connect your wallet first." });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: "" });

      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );

      if (!response.ok && response.status !== 400) {
        const text = await response.text();
        throw new Error(text || "Friendbot request failed.");
      }

      // Success
      setMessage({ type: 'success', text: "Wallet funded successfully. Updating balance..." });
      
      // Wait a bit for Horizon to catch up before refetching
      setTimeout(async () => {
        if (onFunded) {
          await onFunded();
        }
      }, 2000);

    } catch (error) {
      console.error("Friendbot funding failed:", error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : "Failed to fund wallet."
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !publicKey) return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6 glass">
      <p className="text-amber-400 font-bold tracking-widest mb-4 uppercase text-xs">
        TESTNET FAUCET
      </p>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        Need XLM for gas? Fund your connected testnet wallet instantly.
      </p>

      <button
        type="button"
        onClick={fundAccount}
        disabled={loading || !publicKey}
        className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-3 font-bold text-amber-950 transition disabled:opacity-50 shadow-lg shadow-amber-500/10 uppercase text-xs tracking-widest"
      >
        {loading ? "Funding..." : "Fund with Friendbot"}
      </button>

      {message.text && (
        <div className={`mt-3 text-[10px] font-bold p-3 rounded-xl border ${
          message.type === 'success' 
            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' 
            : 'text-red-400 bg-red-400/10 border-red-400/20'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
