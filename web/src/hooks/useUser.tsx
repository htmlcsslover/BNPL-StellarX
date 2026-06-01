'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { API_BASE_URL, safeFetch } from '@/lib/api';

interface User {
  id: string;
  wallet_address: string;
  role: 'buyer' | 'seller' | 'lp';
  display_name: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (wallet: string) => Promise<boolean>;
  register: (wallet: string, role: 'buyer' | 'seller' | 'lp', name: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (walletAddress: string) => {
    setError(null);
    const result = await safeFetch(`${API_BASE_URL}/api/users/auth`, {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    });

    if (result.ok) {
      setUser(result.data);
      localStorage.setItem('stellar_bnpl_user', JSON.stringify(result.data));
      return true;
    } else {
      console.warn('Login failed:', result.error);
      if (result.status !== 404) {
        setError(result.error || 'Connection failed');
      }
      setUser(null);
      localStorage.removeItem('stellar_bnpl_user');
      return false;
    }
  }, []);

  const register = async (walletAddress: string, role: 'buyer' | 'seller' | 'lp', name: string) => {
    setError(null);
    const body = { wallet_address: walletAddress, role, display_name: name };
    
    const result = await safeFetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    if (result.ok) {
      setUser(result.data);
      localStorage.setItem('stellar_bnpl_user', JSON.stringify(result.data));
      return true;
    } else {
      setError(result.error || 'Registration failed');
      return false;
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('stellar_bnpl_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    if (wallet.publicKey) {
      // If we don't have a user, or the user's wallet address doesn't match the current wallet
      if (!user || user.wallet_address !== wallet.publicKey) {
        login(wallet.publicKey).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [wallet.publicKey, login]);

  return (
    <UserContext.Provider value={{ user, loading, error, login, register }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
