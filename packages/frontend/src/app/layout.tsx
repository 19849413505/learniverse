import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar, BottomNav } from '@/components/layout/Navigation';
import { Topbar } from '@/components/layout/Topbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Learniverse - Spaced Repetition Mastery',
  description: 'AI-driven spaced repetition, knowledge graphs, and gamified learning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar for Desktop */}
          <Sidebar />

          <main className="flex-1 flex flex-col h-full overflow-y-auto pb-16 md:pb-0 relative scroll-smooth">
            {/* Topbar (Stats & Mobile Header) */}
            <Topbar />

            {/* Page Content */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          {/* Bottom Nav for Mobile */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
