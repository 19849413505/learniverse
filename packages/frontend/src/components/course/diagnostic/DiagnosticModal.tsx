import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, XCircle } from 'lucide-react';

interface DiagnosticModalProps {
  deckId: string;
  questions: any[];
  onComplete: () => void;
}

export default function DiagnosticModal({ deckId, questions, onComplete }: DiagnosticModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [passedNodeIds, setPassedNodeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finishDiagnostic = useCallback(async (finalPassedIds: string[]) => {
    setIsSubmitting(true);
    const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

    try {
      if (finalPassedIds.length > 0) {
         await fetch(`${apiEndpoint}/course/diagnostic/submit/demo-user-id/${deckId}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ passedNodeIds: finalPassedIds })
         });
      }
    } catch (e) {
       console.error("Diagnostic submit failed", e);
    }

    setIsSubmitting(false);
    onComplete();
  }, [deckId, onComplete]);

  const handleAnswer = useCallback((passed: boolean) => {
    let newPassedIds = passedNodeIds;
    if (passed) {
      newPassedIds = [...passedNodeIds, questions[currentIndex].nodeId];
      setPassedNodeIds(newPassedIds);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishDiagnostic(newPassedIds);
    }
  }, [currentIndex, passedNodeIds, questions, finishDiagnostic]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or currently submitting
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || (activeElement as HTMLElement)?.isContentEditable;
      if (isInputFocused || isSubmitting) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleAnswer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer, isSubmitting]);

  const progressPercentage = ((currentIndex) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative overflow-hidden"
      >
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Brain className="w-16 h-16 text-indigo-500 animate-pulse mb-6" />
            <h2 className="text-2xl font-bold text-slate-800">Calculating your knowledge boundaries...</h2>
            <p className="text-slate-500 mt-2">Adjusting skill tree based on your results.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-full mb-6">
                <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
                   <span>Diagnostic Test</span>
                   <span>{currentIndex + 1} / {questions.length}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ ease: "easeInOut", duration: 0.3 }}
                  />
                </div>
              </div>

              <h3 className="text-xl text-indigo-600 font-bold mb-2">{questions[currentIndex].name}</h3>
              <p className="text-2xl font-bold text-slate-800 mb-12 leading-relaxed">
                {questions[currentIndex].question}
              </p>

              <div className="w-full grid grid-cols-2 gap-4">
                 <button
                   onClick={() => handleAnswer(false)}
                   className="relative py-4 border-2 border-rose-200 bg-rose-50 text-rose-600 rounded-2xl font-bold text-lg hover:bg-rose-100 focus-visible:ring-4 focus-visible:ring-rose-300 focus-visible:ring-offset-2 flex items-center justify-center gap-2 transition active:scale-95 outline-none"
                   aria-label="I need to review this concept"
                 >
                   <XCircle className="w-5 h-5" /> Needs Review
                   <span className="absolute top-2 left-3 text-[10px] font-bold opacity-60 px-1.5 py-0.5 rounded-md bg-white/50 border border-rose-200 hidden sm:block">
                     [←]
                   </span>
                 </button>
                 <button
                   onClick={() => handleAnswer(true)}
                   className="relative py-4 border-2 border-emerald-200 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-lg hover:bg-emerald-100 focus-visible:ring-4 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 flex items-center justify-center gap-2 transition active:scale-95 outline-none"
                   aria-label="I already know this concept"
                 >
                   <CheckCircle className="w-5 h-5" /> I Know This
                   <span className="absolute top-2 right-3 text-[10px] font-bold opacity-60 px-1.5 py-0.5 rounded-md bg-white/50 border border-emerald-200 hidden sm:block">
                     [→]
                   </span>
                 </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
