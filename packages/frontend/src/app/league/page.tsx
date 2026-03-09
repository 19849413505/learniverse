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
                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                  user.isMe ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-8 font-bold text-lg text-center ${
                    rank === 1 ? 'text-yellow-500' :
                    rank === 2 ? 'text-gray-400' :
                    rank === 3 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {rank}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    user.isMe ? 'bg-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {user.avatar}
                  </div>

                  {/* Name */}
                  <div>
                    <span className={`font-semibold ${user.isMe ? 'text-indigo-900' : 'text-gray-800'}`}>
                      {user.name}
                    </span>
                    {user.isMe && <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">You</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
