import { useState } from 'react';
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

  const handleAnswer = (passed: boolean) => {
    if (passed) {
      setPassedNodeIds(prev => [...prev, questions[currentIndex].nodeId]);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishDiagnostic(passed ? [...passedNodeIds, questions[currentIndex].nodeId] : passedNodeIds);
    }
  };

  const finishDiagnostic = async (finalPassedIds: string[]) => {
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
  };

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
              <div className="w-full flex justify-between text-sm font-bold text-slate-400 mb-6">
                 <span>Diagnostic Test</span>
                 <span>{currentIndex + 1} / {questions.length}</span>
              </div>

              <h3 className="text-xl text-indigo-600 font-bold mb-2">{questions[currentIndex].name}</h3>
              <p className="text-2xl font-bold text-slate-800 mb-12 leading-relaxed">
                {questions[currentIndex].question}
              </p>

              <div className="w-full grid grid-cols-2 gap-4">
                 <button
                   onClick={() => handleAnswer(false)}
                   className="py-4 border-2 border-rose-200 bg-rose-50 text-rose-600 rounded-2xl font-bold text-lg hover:bg-rose-100 flex items-center justify-center gap-2 transition"
                 >
                   <XCircle className="w-5 h-5" /> Needs Review
                 </button>
                 <button
                   onClick={() => handleAnswer(true)}
                   className="py-4 border-2 border-emerald-200 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-lg hover:bg-emerald-100 flex items-center justify-center gap-2 transition"
                 >
                   <CheckCircle className="w-5 h-5" /> I Know This
                 </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
