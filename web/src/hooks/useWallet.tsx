'use client';
import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

const TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>, fallback: T, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export interface WalletState {
  publicKey: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const freighter = await import('@stellar/freighter-api');

      const connected = await withTimeout(freighter.isConnected(), {
        isConnected: false,
      });
      if (!connected.isConnected) {
        throw new Error(
          'Freighter not detected. Install it from freighter.app and reload.',
        );
      }

      const access = await freighter.requestAccess();
      if (access.error) throw new Error(access.error);
      if (!access.address) {
        throw new Error('No address returned — did you approve the request?');
      }

      console.log('Wallet connected:', access.address);
      setPublicKey(access.address);
    } catch (e: unknown) {
      console.error('Wallet connection error:', e);
      setError(e instanceof Error ? e.message : 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider value={{ publicKey, connecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
