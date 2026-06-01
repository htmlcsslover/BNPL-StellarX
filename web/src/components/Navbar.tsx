'use client';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useUser } from '@/hooks/useUser';
import ConnectWallet from './ConnectWallet';

import { usePathname } from 'next/navigation';

export default function Navbar() {
  const wallet = useWallet();
  const { user } = useUser();
  const pathname = usePathname();

  const navItems = [
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'My Credit', href: '/dashboard/borrower' },
    { name: 'My Store', href: '/dashboard/seller' },
    { name: 'Community Pool', href: '/dashboard/lp' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20 italic">S</div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent tracking-tight uppercase">
            StellarBNPL
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition uppercase tracking-widest ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {wallet.publicKey && !user && (
            <Link href="/register" className="text-[10px] bg-purple-600 px-4 py-2 rounded-lg font-black transition hover:bg-purple-700 shadow-lg shadow-purple-500/20 uppercase tracking-widest italic text-white">
              Complete Onboarding
            </Link>
          )}
          
          {wallet.publicKey && user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white leading-none mb-1 uppercase">{user.display_name}</p>
                <p className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest italic">Member</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center border-2 border-white/10 shadow-lg shadow-purple-500/10 font-bold text-white uppercase italic">
                {user.display_name.slice(0, 1).toUpperCase()}
              </div>
            </div>
          ) : (
            <ConnectWallet {...wallet} />
          )}
        </div>
      </div>
    </nav>
  );
}
