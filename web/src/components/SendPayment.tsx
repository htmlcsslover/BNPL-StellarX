'use client';
import { useState } from 'react';
import {
  buildPaymentXDR,
  submitSignedXDR,
  pollTransaction,
  type AssetCode,
} from '@/lib/payment';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';

type Status =
  | 'idle'
  | 'building'
  | 'signing'
  | 'submitting'
  | 'polling'
  | 'success'
  | 'error';

const STATUS_LABEL: Record<Status, string> = {
  idle: 'Send XLM',
  building: 'Building…',
  signing: 'Signing…',
  submitting: 'Submitting…',
  polling: 'Confirming…',
  success: 'Sent!',
  error: 'Try Again',
};

export default function SendPayment({
  publicKey,
  onSent,
}: {
  publicKey: string;
  onSent: () => void;
}) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [asset] = useState<AssetCode>('XLM');
  const [status, setStatus] = useState<Status>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const busy = ['building', 'signing', 'submitting', 'polling'].includes(status);

  const handleSend = async () => {
    setStatus('building');
    setErrorMsg('');
    setTxHash('');
    try {
      const xdr = await buildPaymentXDR(publicKey, destination.trim(), amount);

      setStatus('signing');
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) {
        throw new Error(
          typeof signed.error === 'string' ? signed.error : 'Signing was rejected',
        );
      }

      setStatus('submitting');
      const hash = await submitSignedXDR(signed.signedTxXdr);
      setTxHash(hash);

      setStatus('polling');
      await pollTransaction(hash);
      setStatus('success');
      onSent();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Payment failed');
      setStatus('error');
    }
  };

  return (
    <div className="glass p-6 rounded-2xl border border-white/10">
      <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-6">Quick Transfer</h3>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1 block">Asset</label>
          <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white opacity-60">
            Native XLM
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1 block">Recipient</label>
          <input
            type="text"
            placeholder="G..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1 block">Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-bold"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={busy || !destination || !amount}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-purple-500/20"
        >
          {STATUS_LABEL[status]}
        </button>
      </div>

      {status === 'success' && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-xs text-emerald-400 font-bold mb-1 text-center">Payment Sent Successfully!</p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[10px] text-gray-400 text-center hover:underline"
          >
            View on Explorer →
          </a>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-[10px] text-red-400 text-center">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
