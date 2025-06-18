'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Stake', href: '/stake' },
  { label: 'Payment', href: '/payment' },
  { label: 'Test Cards', href: '/test-cards' },
];

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4">
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
