'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WalletConnect } from '@/components/solana/wallet-connect';
import {
  HomeIcon,
  CreditCardIcon,
  WalletIcon,
  HistoryIcon,
  SettingsIcon,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: HomeIcon,
  },
  {
    title: 'BNPL',
    href: '/bnpl',
    icon: CreditCardIcon,
  },
  {
    title: 'Staking',
    href: '/staking',
    icon: WalletIcon,
  },
  {
    title: 'History',
    href: '/history',
    icon: HistoryIcon,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

export function NavMenu() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <WalletConnect />
      </div>
    </div>
  );
}
