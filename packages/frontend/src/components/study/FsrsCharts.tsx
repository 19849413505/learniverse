"use client";

import React, { useMemo } from 'react';
import { useDeckStore } from '@/store/deckStore';
import { State } from 'ts-fsrs';
import { format, subDays, addDays } from 'date-fns';

import dynamic from 'next/dynamic';

const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });

export function FsrsCharts() {
  const { cards } = useDeckStore();

  // 1. Study Situation (Bar Chart: New, Learning, Review)
  const studySituationData = useMemo(() => {
    // We will group cards by their 'due' date, counting them by their State.
    // For a realistic chart, let's aggregate cards due within the last 7 days and next 7 days.
    const dataMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = -7; i <= 7; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'MM-dd');
      dataMap.set(dateStr, {
        date: dateStr,
        New: 0,
        Learning: 0,
        Review: 0,
        Relearning: 0,
      });
    }

    cards.forEach(card => {
      if (!card.fsrsCard.due) return;
      const dueDate = new Date(card.fsrsCard.due);
      dueDate.setHours(0, 0, 0, 0);
      const dateStr = format(dueDate, 'MM-dd');

      if (dataMap.has(dateStr)) {
        const entry = dataMap.get(dateStr);
        switch (card.fsrsCard.state) {
          case State.New: entry.New += 1; break;
          case State.Learning: entry.Learning += 1; break;
          case State.Review: entry.Review += 1; break;
          case State.Relearning: entry.Relearning += 1; break;
        }
      }
    });

    return Array.from(dataMap.values());
  }, [cards]);

  // 2. Memory Durability (Line/Area Chart: Stability over time or reps)
  const memoryDurabilityData = useMemo(() => {
    // Simple distribution of stability across the deck
    // We group cards into stability buckets (0-10, 10-20, etc.)
    const buckets = [
      { name: '0-5d', range: [0, 5], count: 0 },
      { name: '5-15d', range: [5, 15], count: 0 },
      { name: '15-30d', range: [15, 30], count: 0 },
      { name: '1-3m', range: [30, 90], count: 0 },
      { name: '3m+', range: [90, Infinity], count: 0 },
    ];

    cards.forEach(card => {
      const stability = card.fsrsCard.stability || 0;
      for (const bucket of buckets) {
        if (stability >= bucket.range[0] && stability < bucket.range[1]) {
          bucket.count += 1;
          break;
        }
      }
    });

    return buckets;
  }, [cards]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto my-8">
      {/* Chart 1: Study Situation */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
        <h3 className="text-lg font-bold text-gray-800 mb-1">学习情况 (Study Situation)</h3>
        <p className="text-sm text-gray-500 mb-6">卡片复习时间分布</p>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studySituationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#F3F4F6' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="New" name="新卡片" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Learning" name="学习中" stackId="a" fill="#F59E0B" />
              <Bar dataKey="Relearning" name="重新学习" stackId="a" fill="#EF4444" />
              <Bar dataKey="Review" name="复习中" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Memory Durability */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
        <h3 className="text-lg font-bold text-gray-800 mb-1">记忆持久度 (Memory Durability)</h3>
        <p className="text-sm text-gray-500 mb-6">当前记忆稳定性(Stability)分布</p>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={memoryDurabilityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="count" name="卡片数量" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
