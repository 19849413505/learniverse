"use client";

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useShallow } from 'zustand/react/shallow';
import { Flame, Star, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Topbar() {
  // ⚡ Bolt: Use `useShallow` to prevent full Topbar re-render on unrelated state changes
  const { xp, streak, gems } = useUserStore(useShallow((state) => ({
    xp: state.xp,
    streak: state.streak,
    gems: state.gems
  })));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between w-full h-16 px-4 bg-white/80 backdrop-blur-md border-b border-gray-100 md:justify-end">
      {/* Mobile Title */}
      <div className="md:hidden flex items-center">
        <span className="text-xl font-bold text-gray-900 tracking-tight">Learniverse</span>
      </div>

      {/* Gamification Stats */}
      <div className="flex items-center space-x-4 md:space-x-6">
        <StatBadge icon={<Star className="w-5 h-5 text-yellow-400 fill-current" />} value={xp} label="XP" tooltip="Total Experience Points" />
        <StatBadge icon={<Flame className="w-5 h-5 text-orange-500 fill-current" />} value={streak} label="Day Streak" color="text-orange-500" tooltip="Current Daily Streak" />
        <StatBadge icon={<Gem className="w-5 h-5 text-blue-500 fill-current" />} value={gems} label="Gems" color="text-blue-500" tooltip="Collected Gems" />
      </div>
    </div>
  );
}

function StatBadge({ icon, value, label, tooltip, color = "text-gray-700" }: { icon: React.ReactNode, value: number, label: string, tooltip: string, color?: string }) {
  return (
    <div
      className="flex items-center space-x-1.5 font-bold cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors group focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      title={tooltip}
      aria-label={`${value} ${label}`}
      tabIndex={0}
    >
      {icon}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={color}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
