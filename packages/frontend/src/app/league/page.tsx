"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, ChevronUp, Flame, Users } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

export default function LeaguePage() {
  const { xp } = useUserStore();

  // Mock leaderboard data
  const [leaderboard] = useState([
    { id: 1, name: 'Alice Chen', xp: 2450, avatar: 'A', rankChange: 1, isMe: false },
    { id: 2, name: 'Bob Smith', xp: 2310, avatar: 'B', rankChange: 0, isMe: false },
    { id: 3, name: 'You', xp: xp, avatar: 'Y', rankChange: 2, isMe: true },
    { id: 4, name: 'Charlie D', xp: 1980, avatar: 'C', rankChange: -1, isMe: false },
    { id: 5, name: 'Eva Green', xp: 1850, avatar: 'E', rankChange: -2, isMe: false },
    { id: 6, name: 'David Lee', xp: 1600, avatar: 'D', rankChange: 0, isMe: false },
    { id: 7, name: 'Fiona W', xp: 1450, avatar: 'F', rankChange: 1, isMe: false },
    { id: 8, name: 'George H', xp: 1200, avatar: 'G', rankChange: -1, isMe: false },
  ].sort((a, b) => b.xp - a.xp));

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header & League Tier */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <Trophy className="w-16 h-16 text-yellow-300 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Gold League</h1>
          <p className="text-indigo-100 text-center max-w-md">
            Top 5 advance to the next league. Bottom 3 are demoted. The week ends in 2 days.
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sm:p-4">
        <div className="px-4 py-4 border-b border-gray-100 flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">Weekly Leaderboard</h2>
        </div>

        <div className="space-y-2">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isPromotionZone = rank <= 5;
            const isDemotionZone = rank >= leaderboard.length - 2;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative flex items-center justify-between p-4 rounded-xl transition-colors overflow-hidden outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 focus-visible:ring-inset ${
                  user.isMe ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'
                }`}
                tabIndex={0}
                aria-label={`Rank ${rank}: ${user.name} with ${user.xp} XP. ${user.isMe ? 'This is you.' : ''} ${isPromotionZone ? 'Promotion zone.' : isDemotionZone ? 'Demotion zone.' : ''}`}
              >
                {/* Zone Indicators */}
                {isPromotionZone && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400" />}
                {isDemotionZone && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-400" />}

                {/* You Highlight Pulse */}
                {user.isMe && (
                  <motion.div
                    className="absolute inset-0 bg-indigo-400/10 pointer-events-none"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                <div className="flex items-center gap-4 relative z-10 pl-2">
                  {/* Rank */}
                  <div className={`w-8 font-bold text-lg text-center ${
                    rank === 1 ? 'text-yellow-500' :
                    rank === 2 ? 'text-gray-400' :
                    rank === 3 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {rank}
                  </div>

                  {/* Avatar with Top 3 Glowing Borders */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    user.isMe ? 'bg-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  } ${
                    rank === 1 ? 'ring-2 ring-yellow-400 ring-offset-2 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                    rank === 2 ? 'ring-2 ring-gray-300 ring-offset-2 shadow-[0_0_10px_rgba(209,213,219,0.5)]' :
                    rank === 3 ? 'ring-2 ring-amber-500 ring-offset-2 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : ''
                  }`}>
                    {user.avatar}
                  </div>

                  {/* Name & Medal */}
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${user.isMe ? 'text-indigo-900' : 'text-gray-800'}`}>
                      {user.name}
                    </span>
                    {rank === 1 && <Medal className="w-4 h-4 text-yellow-500" aria-hidden="true" />}
                    {rank === 2 && <Medal className="w-4 h-4 text-gray-400" aria-hidden="true" />}
                    {rank === 3 && <Medal className="w-4 h-4 text-amber-600" aria-hidden="true" />}

                    {user.isMe && <span className="text-xs font-bold text-indigo-600 bg-indigo-100/80 border border-indigo-200 px-2 py-0.5 rounded-full">You</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  <span className="font-bold text-gray-600">{user.xp} XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
