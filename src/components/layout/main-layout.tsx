'use client';

import { NavMenu } from './nav-menu';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r">
        <div className="flex flex-col flex-grow pt-5 bg-background overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-4">
            <h1 className="text-xl font-bold">Solana BNPL</h1>
          </div>
          <NavMenu />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="flex justify-around items-center h-16">
          <NavMenu />
        </div>
      </div>
    </div>
  );
}
