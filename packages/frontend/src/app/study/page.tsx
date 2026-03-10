"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Check, Flame, AlertCircle, X, Sparkles, Trophy } from 'lucide-react';
import { useDeckStore } from '@/store/deckStore';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Rating, State } from 'ts-fsrs';
import Link from 'next/link';
import Confetti from 'react-confetti';
import SocraticTutor from '@/components/chat/SocraticTutor';

export default function StudyPage() {
  const { getDueCards, fsrs, updateCard, fetchCloudDueCards } = useDeckStore();
  const { addXP, incrementStreak } = useUserStore();
  const { apiKey, baseURL, model } = useSettingsStore();

  const [dueCards, setDueCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isFetchingCloud, setIsFetchingCloud] = useState(true);

  const [showConfetti, setShowConfetti] = useState(false);

  // Drawer state
  const [isTutorOpen, setIsTutorOpen] = useState(false);

  // Add a mounted check to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Fetch cloud data first, then load local cards
    fetchCloudDueCards().finally(() => {
      const cards = getDueCards();
      setDueCards(cards);
      setIsFetchingCloud(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleFinish = useCallback(() => {
    setIsFinished(true);
    incrementStreak();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  }, [incrementStreak]);

  const handleRate = useCallback((rating: Rating) => {
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
  }, [dueCards, currentIndex, fsrs, updateCard, addXP, handleFinish]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable shortcuts if typing in tutor drawer, finished, or typing in any input field
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || (activeElement as HTMLElement)?.isContentEditable;

      if (isTutorOpen || isFinished || dueCards.length === 0 || isInputFocused) return;

      if (!isFlipped && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate(Rating.Again);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate(Rating.Hard);
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate(Rating.Good);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate(Rating.Easy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isTutorOpen, isFinished, dueCards.length, handleFlip, handleRate]);

  if (!mounted || isFetchingCloud) {
    return null;
  }

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

            {/* Ask Tutor Action Area */}
            {isFlipped && (
              <div className="mt-auto bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 items-start cursor-pointer hover:bg-indigo-100 transition" onClick={() => setIsTutorOpen(true)}>
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-indigo-900 text-sm">Socrates-7 导师舱</h4>
                  <p className="text-indigo-700 text-sm mt-1">
                    对于这部分内容不理解？点击呼唤导师进行苏格拉底式启发对话。
                  </p>
                  <button className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    呼叫导师 <ArrowLeft className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Socrates-7 Chat Drawer */}
      <SocraticTutor
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        contextTitle={currentCard?.front || ''}
        contextBody={currentCard?.back || ''}
      />

      {/* Controls Area */}
      <div className="h-24 sm:h-32 flex items-center justify-center w-full pb-safe">
        {!isFlipped ? (
          <button
            onClick={handleFlip}
            className="w-full sm:w-1/2 py-5 bg-indigo-600 text-white rounded-2xl font-extrabold text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-indigo-300 flex flex-col items-center justify-center gap-1"
            aria-label="Reveal Answer"
          >
            <span>Reveal Answer</span>
            <span className="text-xs font-medium text-indigo-200 hidden sm:inline-block">Press Space to reveal</span>
          </button>
        ) : (
          <div className="w-full grid grid-cols-4 gap-2 sm:gap-4">
            <RatingButton
              rating={Rating.Again}
              label="Again"
              sub="< 1m"
              shortcut="1"
              color="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 hover:border-rose-300"
              onClick={() => handleRate(Rating.Again)}
            />
            <RatingButton
              rating={Rating.Hard}
              label="Hard"
              sub="5m"
              shortcut="2"
              color="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 hover:border-orange-300"
              onClick={() => handleRate(Rating.Hard)}
            />
            <RatingButton
              rating={Rating.Good}
              label="Good"
              sub="1d"
              shortcut="3"
              color="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 hover:border-green-300"
              onClick={() => handleRate(Rating.Good)}
            />
            <RatingButton
              rating={Rating.Easy}
              label="Easy"
              sub="4d"
              shortcut="4"
              color="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 hover:border-blue-300"
              onClick={() => handleRate(Rating.Easy)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RatingButton({ rating, label, sub, shortcut, color, onClick }: { rating: Rating, label: string, sub: string, shortcut?: string, color: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-3 sm:py-4 rounded-xl border-2 transition transform active:scale-95 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-indigo-300 ${color}`}
      aria-label={`Rate ${label}`}
    >
      <span className="font-bold text-sm sm:text-base">{label}</span>
      <span className="text-[10px] sm:text-xs opacity-80 mt-1 font-medium">{sub}</span>
      {shortcut && (
        <span className="hidden sm:flex absolute top-1 right-2 text-[10px] font-bold opacity-50 px-1.5 py-0.5 rounded-md bg-white/50">
          [{shortcut}]
        </span>
      )}
    </button>
  );
}
