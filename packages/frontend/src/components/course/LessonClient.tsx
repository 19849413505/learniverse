"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, Brain, Lightbulb, PenTool, Sparkles, AlertCircle } from 'lucide-react';
import Confetti from 'react-confetti';
import SocraticTutor from '@/components/chat/SocraticTutor';

export default function LessonClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nodeId = searchParams.get('nodeId');
  const deckId = searchParams.get('deckId');

  const [lessonData, setLessonData] = useState<any>(null);
  const [step, setStep] = useState(0); // 0: Explanation, 1: Example, 2: Practice
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  useEffect(() => {
    if (!nodeId) return;
    // MVP: For a real app we'd fetch the specific node's micro-lesson.
    // Here we fetch the whole tree and find the node since we already have the endpoint
    fetch(`${apiEndpoint}/course/skill-tree/demo-user-id/${deckId}`)
      .then(res => res.json())
      .then(data => {
        const node = data.nodes.find((n: any) => n.id === nodeId);
        if (node && node.microLessons && node.microLessons.length > 0) {
          setLessonData({ node, micro: node.microLessons[0] });
        }
      });
  }, [nodeId, deckId, apiEndpoint]);

  if (!lessonData) return <div className="flex h-screen items-center justify-center font-bold text-gray-500">Loading Micro-Lesson...</div>;

  const handleNext = async () => {
    if (step < 2) {
      setStep(prev => prev + 1);
    } else {
      // Completed practice!
      setCompleted(true);
      try {
        await fetch(`${apiEndpoint}/course/complete-node/demo-user-id/${nodeId}`, { method: 'POST' });
        // Award XP logic here if connected to userStore
      } catch (e) {
        console.error("Failed to mark complete", e);
      }
      setTimeout(() => {
        router.push(`/course?deckId=${deckId}`);
      }, 4000);
    }
  };

  const stepsInfo = [
    { title: "概念讲解 (Explanation)", icon: <Brain className="w-8 h-8 text-indigo-500" />, content: lessonData.micro.explanation },
    { title: "示例引导 (Worked Example)", icon: <Lightbulb className="w-8 h-8 text-amber-500" />, content: lessonData.micro.example },
    { title: "即时练习 (Active Practice)", icon: <PenTool className="w-8 h-8 text-emerald-500" />, content: lessonData.micro.practice },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Header Progress */}
      <div className="w-full max-w-2xl px-6 py-8 flex items-center gap-4">
        <button onClick={() => router.push(`/course?deckId=${deckId}`)} className="text-gray-400 hover:text-gray-700 transition">
          <X className="w-8 h-8" />
        </button>
        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-2xl px-6 relative flex flex-col justify-center pb-32">
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              key={step}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center min-h-[400px] flex flex-col items-center justify-center"
            >
              <div className="bg-slate-50 p-4 rounded-full mb-6 shadow-inner">
                 {stepsInfo[step].icon}
              </div>
              <h2 className="text-3xl font-extrabold text-gray-800 mb-8">{stepsInfo[step].title}</h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                {stepsInfo[step].content}
              </p>

              {/* Practice Mock Input */}
              {step === 2 && (
                 <div className="mt-12 w-full max-w-md space-y-4">
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-left">Your Answer</p>
                   <textarea
                     className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 min-h-[100px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none text-lg"
                     placeholder="Think carefully..."
                   />
                 </div>
              )}
            </motion.div>
          ) : (
             <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6"
             >
                {completed && <Confetti recycle={false} numberOfPieces={600} gravity={0.2} />}
                <div className="w-32 h-32 bg-green-100 text-green-500 rounded-full flex items-center justify-center border-4 border-green-300 shadow-2xl relative">
                  <Check className="w-16 h-16 stroke-[4]" />
                </div>
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">Node Mastered!</h1>
                <p className="text-xl text-gray-500 font-medium">You have successfully completed the cognitive scaffolding for {lessonData.node.name}.</p>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Help Button */}
        {!completed && (
           <button
             onClick={() => setIsChatOpen(true)}
             className="absolute -right-16 top-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-xl border border-indigo-100 text-indigo-500 hover:text-white hover:bg-indigo-500 transition-all group flex flex-col items-center gap-1"
           >
             <Sparkles className="w-6 h-6" />
             <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ask Tutor</span>
           </button>
        )}
      </div>

      {/* Bottom Action Bar */}
      {!completed && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-6 z-40">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            {step === 2 ? (
              <div className="flex items-center gap-3 text-amber-500 font-bold bg-amber-50 px-4 py-2 rounded-2xl">
                <AlertCircle className="w-5 h-5" />
                This is a required practice.
              </div>
            ) : <div />}
            <button
              onClick={handleNext}
              className={`px-12 py-4 rounded-2xl font-extrabold text-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center gap-2
                ${step === 2 ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
              `}
            >
              {step === 2 ? 'CHECK ANSWER' : 'CONTINUE'} <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Socratic Tutor Drawer */}
      <SocraticTutor
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        contextTitle={lessonData.node.name}
        contextBody={stepsInfo[step].content}
      />
    </div>
  );
}
