'use client';
import { Balances } from '@/lib/balances';

export default function BalanceCard({
  balances,
  publicKey,
}: {
  balances: Balances;
  publicKey: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 glass">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">
            Wallet Balance
          </p>
          <p className="font-mono text-xs text-gray-500 truncate w-32 md:w-auto opacity-70">
            {publicKey}
          </p>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-purple-500/20 uppercase">
          STLR
        </div>
      </div>

      {!balances.funded ? (
        <div className="py-4">
          <p className="text-sm text-amber-400/80 italic">
            Account not funded. Use Faucet below to activate.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-end gap-2">
            <p className="text-5xl font-black tracking-tighter text-white">
              {balances.xlm}
            </p>
            <p className="text-xl font-bold text-gray-400 pb-1.5 uppercase">XLM</p>
          </div>
          
          <div className="pt-4 border-t border-white/5 flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Status</p>
              <p className="text-xs text-emerald-400 font-bold">Active On-chain</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Network</p>
              <p className="text-xs text-white font-bold">Stellar Testnet</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
