"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Map, Trophy, Network, User, Settings } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Learn', href: '/', icon: Map },
  { name: 'Library', href: '/library', icon: BookOpen },
  { name: 'Knowledge', href: '/knowledge', icon: Network },
  { name: 'League', href: '/league', icon: Trophy },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white h-screen sticky top-0 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
          L
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">Learniverse</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors duration-200',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={clsx('w-6 h-6', isActive ? 'text-indigo-600' : 'text-gray-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="p-4 bg-indigo-50 rounded-xl">
          <h4 className="text-sm font-semibold text-indigo-900 mb-1">Get Promax</h4>
          <p className="text-xs text-indigo-700 mb-3">Unlock AI Archimedes Tutoring!</p>
          <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white pb-safe pt-1 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-indigo-600' : 'text-gray-500'
              )}
            >
              <item.icon className={clsx('w-6 h-6', isActive ? 'text-indigo-600' : 'text-gray-400')} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
