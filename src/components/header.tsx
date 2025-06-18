'use client';

import { NavMenu } from '@/components/nav-menu';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <NavMenu />
      </div>
    </header>
  );
}
