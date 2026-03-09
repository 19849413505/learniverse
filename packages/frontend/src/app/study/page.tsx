"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Check, Flame, AlertCircle, X, Sparkles, Trophy } from 'lucide-react';
import { useDeckStore } from '@/store/deckStore';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Rating, State } from 'ts-fsrs';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use'; // will install if needed

export default function StudyPage() {
  const { getDueCards, fsrs, updateCard } = useDeckStore();
  const { addXP, incrementStreak } = useUserStore();
  const { apiKey, baseURL, model } = useSettingsStore();

  const [dueCards, setDueCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);

  // Socratic Chat states
  const [isChatting, setIsChatting] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([{ role: 'assistant', content: "关于这个知识点，你有什么想和我讨论的？或者你觉得它最难理解的地方在哪里？" }]);

  useEffect(() => {
    // Load due cards on mount
    const cards = getDueCards();
    setDueCards(cards);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dueCards.length === 0 && !isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
          <Check className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">You&apos;re all caught up!</h2>
        <p className="text-gray-500 text-lg">You&apos;ve mastered all due cards for today.</p>
        <Link href="/" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleFlip = () => {
    setIsFlipped(true);
    setIsChatting(false);
    setChatHistory([{ role: 'assistant', content: "关于这个知识点，你有什么想和我讨论的？或者你觉得它最难理解的地方在哪里？" }]);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const customConfig = apiKey ? { apiKey, baseURL, model } : undefined;
      const response = await fetch('http://localhost:3001/api/archimedes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory.slice(1),
          context: `当前卡片正面：${dueCards[currentIndex].front}，背面：${dueCards[currentIndex].back}`,
          customConfig
        })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch(e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Ops, backend is not responding.' }]);
    }
  };

  const handleRate = (rating: Rating) => {
    const card = dueCards[currentIndex];

    // 1. Calculate next state using FSRS
    const schedulingInfo = fsrs.repeat(card.fsrsCard, new Date());
    let nextCardLog;

    switch (rating) {
      case Rating.Again: nextCardLog = schedulingInfo[Rating.Again]; break;
      case Rating.Hard: nextCardLog = schedulingInfo[Rating.Hard]; break;
      case Rating.Good: nextCardLog = schedulingInfo[Rating.Good]; break;
      case Rating.Easy: nextCardLog = schedulingInfo[Rating.Easy]; break;
    }

    // 2. Update card in store
    if (nextCardLog) {
      updateCard(card.id, rating, nextCardLog);
    }

    // Gamification Feedback
    let xpGain = 0;
    if (rating === Rating.Easy || rating === Rating.Good) xpGain = 10;
    else if (rating === Rating.Hard) xpGain = 5;
    else xpGain = 2; // Still get something for trying!

    addXP(xpGain);

    // 3. Move to next card
    setIsFlipped(false);
    if (currentIndex + 1 < dueCards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setIsFinished(true);
    incrementStreak();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[70vh] space-y-6 text-center"
      >
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
        <div className="w-32 h-32 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center border-4 border-yellow-300 shadow-xl relative">
          <Trophy className="w-16 h-16" />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: -20, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute -top-10 text-xl font-bold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-md"
          >
            +{dueCards.length * 10} XP
          </motion.div>
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900">Session Complete!</h2>
        <p className="text-gray-500 text-lg max-w-md">
          Excellent work! Your memory stability has increased. The FSRS algorithm has scheduled your next reviews perfectly.
        </p>
        <Link href="/" className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-1 mt-4">
          Return to Path
        </Link>
      </motion.div>
    );
  }

  const currentCard = dueCards[currentIndex];
  const progress = ((currentIndex) / dueCards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[85vh]">
      {/* Header / Progress bar */}
      <div className="flex items-center gap-4 mb-8 sticky top-0 bg-gray-50/90 py-4 z-10 backdrop-blur-sm">
        <Link href="/" className="text-gray-400 hover:text-gray-700 transition">
          <X className="w-6 h-6" />
        </Link>
        <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden border border-gray-300">
          <motion.div
            className="bg-green-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-bold text-gray-500 text-sm">{currentIndex} / {dueCards.length}</span>
      </div>

      {/* Main Flashcard Area */}
      <div className="flex-1 relative perspective-1000 mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard?.id + (isFlipped ? '-back' : '-front')}
            initial={{ opacity: 0, rotateX: isFlipped ? -90 : 90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: isFlipped ? 90 : -90 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
            className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col p-8 sm:p-12 overflow-y-auto transform-gpu"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Card Content Header */}
            <div className="flex justify-between items-start mb-6 text-sm font-semibold">
              <span className={`px-3 py-1 rounded-full ${
                currentCard?.fsrsCard.state === State.New ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {currentCard?.fsrsCard.state === State.New ? 'New Concept' : 'Mastery Review'}
              </span>

              {!isFlipped && (
                <span className="text-gray-400 flex items-center gap-1">
                  <Brain className="w-4 h-4" /> Question
                </span>
              )}
            </div>

            {/* The actual content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center pb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-relaxed">
                {!isFlipped ? currentCard?.front : currentCard?.back}
              </h3>
            </div>

            {/* Archimedes Dialogue Placeholder (only shown on back) */}
            {isFlipped && !isChatting && (
              <div className="mt-auto bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 items-start cursor-pointer hover:bg-indigo-100 transition" onClick={() => setIsChatting(true)}>
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-indigo-900 text-sm">Promax: Socratic Mode</h4>
                  <p className="text-indigo-700 text-sm mt-1">
                    关于【{currentCard?.front.replace('什么是【', '').replace('】？', '')}】，需要阿基米德老师的帮助吗？点击进入苏格拉底式启发对话。
                  </p>
                  <button className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    Start Dialogue <ArrowLeft className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* Socratic Chat Window */}
            {isFlipped && isChatting && (
              <div className="mt-auto bg-white border border-indigo-200 rounded-2xl shadow-inner flex flex-col h-48 overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                   {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex gap-2 text-sm ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role !== 'user' && <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"><Sparkles className="w-3 h-3 text-white" /></div>}
                        <div className={`p-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-900' : 'bg-gray-100 text-gray-800'}`}>
                          {msg.content}
                        </div>
                      </div>
                   ))}
                </div>
                <div className="border-t border-gray-100 p-2 flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your answer or question..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={handleSendMessage} className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-bold">Send</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls Area */}
      <div className="h-24 sm:h-32 flex items-center justify-center w-full pb-safe">
        {!isFlipped ? (
          <button
            onClick={handleFlip}
            className="w-full sm:w-1/2 py-5 bg-indigo-600 text-white rounded-2xl font-extrabold text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition hover:-translate-y-1"
          >
            Reveal Answer
          </button>
        ) : (
          <div className="w-full grid grid-cols-4 gap-2 sm:gap-4">
            <RatingButton
              rating={Rating.Again}
              label="Again"
              sub="< 1m"
              color="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 hover:border-rose-300"
              onClick={() => handleRate(Rating.Again)}
            />
            <RatingButton
              rating={Rating.Hard}
              label="Hard"
              sub="5m"
              color="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 hover:border-orange-300"
              onClick={() => handleRate(Rating.Hard)}
            />
            <RatingButton
              rating={Rating.Good}
              label="Good"
              sub="1d"
              color="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 hover:border-green-300"
              onClick={() => handleRate(Rating.Good)}
            />
            <RatingButton
              rating={Rating.Easy}
              label="Easy"
              sub="4d"
              color="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 hover:border-blue-300"
              onClick={() => handleRate(Rating.Easy)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RatingButton({ rating, label, sub, color, onClick }: { rating: Rating, label: string, sub: string, color: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-3 sm:py-4 rounded-xl border-2 transition transform active:scale-95 ${color}`}
    >
      <span className="font-bold text-sm sm:text-base">{label}</span>
      <span className="text-[10px] sm:text-xs opacity-80 mt-1 font-medium">{sub}</span>
    </button>
  );
}
