"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, BrainCircuit, Target, CheckCircle2, Flame, Network, Activity, Star } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function DashboardPage() {
  const { xp, streak, gems } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Mock data for the "Personalized Profile" learning curve
  const learningData = [
    { day: 'Mon', accuracy: 65, retention: 40 },
    { day: 'Tue', accuracy: 72, retention: 55 },
    { day: 'Wed', accuracy: 68, retention: 60 },
    { day: 'Thu', accuracy: 85, retention: 75 },
    { day: 'Fri', accuracy: 82, retention: 80 },
    { day: 'Sat', accuracy: 90, retention: 88 },
    { day: 'Sun', accuracy: 95, retention: 92 },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome back, Scholar!</h1>
          <p className="text-gray-500">You&apos;re on a {streak}-day streak. Keep the momentum going!</p>
        </div>
        <div className="flex gap-4">
          <Link href="/knowledge" className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2">
            <Network className="w-5 h-5" />
            Import Knowledge
          </Link>
          <Link href="/study" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition-all transform hover:scale-105 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5" />
            Start Review
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Learning Path (Duolingo Style) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Target className="w-6 h-6 text-indigo-500" />
            Your Learning Path
          </h2>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            {/* Simple Mock Path */}
            <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-indigo-50 -translate-x-1/2 z-0" />

            <div className="relative z-10 flex flex-col items-center space-y-12 py-4">

              {/* Completed Node */}
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-200/50 text-white border-4 border-white mb-3">
                  <Star className="w-10 h-10 fill-current" />
                </div>
                <span className="font-bold text-gray-700 text-lg">Foundations</span>
                <span className="text-sm text-gray-400 font-medium">Mastered</span>
              </motion.div>

              {/* Current Node */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="flex flex-col items-center relative"
              >
                {/* Floating XP indicator */}
                <div className="absolute -right-8 -top-4 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-bounce">
                  +15 XP
                </div>

                <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white border-4 border-white mb-3 cursor-pointer hover:bg-indigo-700 transition-colors">
                  <BookOpen className="w-12 h-12" />
                </div>
                <span className="font-bold text-indigo-900 text-lg">Calculus I</span>
                <div className="flex items-center gap-1 text-sm text-indigo-500 font-semibold mt-1">
                  <Activity className="w-4 h-4" />
                  <span>Due: 12 Cards</span>
                </div>
              </motion.div>

              {/* Locked Node */}
              <div className="flex flex-col items-center opacity-50 grayscale">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white mb-3">
                  <Network className="w-10 h-10 text-gray-400" />
                </div>
                <span className="font-bold text-gray-500 text-lg">Linear Algebra</span>
                <span className="text-sm text-gray-400 font-medium">Locked</span>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Co-op */}
        <div className="space-y-6">

          {/* FSRS Stats Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-500" />
              Memory Retention
            </h3>

            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={learningData}>
                  <defs>
                    <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="retention" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRetention)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-4 text-sm font-medium text-gray-500">
              <span>Current: <strong className="text-purple-600">92%</strong></span>
              <span>Goal: <strong className="text-gray-800">95%</strong></span>
            </div>
          </div>

          {/* Co-op Quest Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-900">Co-op Quest</h3>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">2d left</span>
            </div>

            <p className="text-sm text-indigo-800 font-medium mb-4">
              Earn 1000 XP with <span className="underline decoration-indigo-300 decoration-2">Alice</span>
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-indigo-900">
                <span>650 / 1000 XP</span>
                <span className="text-indigo-600">65%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-indigo-600 h-3 rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                </motion.div>
              </div>
            </div>

            <div className="mt-4 flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm z-10 shadow-sm">You</div>
              <div className="w-10 h-10 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm z-0 shadow-sm">A</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
