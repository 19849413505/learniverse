"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Sparkles, FileText, CheckCircle, Database, Network, Loader2, X } from 'lucide-react';
import dynamic from 'next/dynamic';
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
import { useDeckStore } from '@/store/deckStore';
import { createEmptyCard } from 'ts-fsrs';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/settingsStore';
import { useShallow } from 'zustand/react/shallow';

export default function KnowledgeBasePage() {
  const router = useRouter();

  // ⚡ Bolt: Use `useShallow` to prevent full re-renders on unrelated store changes.
  const { addDeck, addCards } = useDeckStore(useShallow((state) => ({
    addDeck: state.addDeck,
    addCards: state.addCards
  })));

  const { apiKey, baseURL, model } = useSettingsStore(useShallow((state) => ({
    apiKey: state.apiKey,
    baseURL: state.baseURL,
    model: state.model
  })));

  const [fileText, setFileText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('Idle');

  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Mock Graph Data Generation
  const generateMockData = () => {
    return {
      nodes: [
        { id: '1', name: 'Machine Learning', group: 1, val: 20 },
        { id: '2', name: 'Neural Networks', group: 1, val: 15 },
        { id: '3', name: 'Backpropagation', group: 1, val: 10 },
        { id: '4', name: 'Gradient Descent', group: 2, val: 15 },
        { id: '5', name: 'Calculus', group: 2, val: 25 },
        { id: '6', name: 'Linear Algebra', group: 3, val: 20 },
        { id: '7', name: 'Matrices', group: 3, val: 10 },
      ],
      links: [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
        { source: '3', target: '4' },
        { source: '4', target: '5' },
        { source: '2', target: '6' },
        { source: '6', target: '7' },
      ]
    };
  };

  // Mimic Exam State
  const [isMimicMode, setIsMimicMode] = useState(false);
  const [referenceFormat, setReferenceFormat] = useState('');
  const [topicName, setTopicName] = useState('');

  // Tutor Workshop State
  const [tutorPrompt, setTutorPrompt] = useState('');

  const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  const handleProcess = async () => {
    if (!fileText.trim()) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      const customConfig = apiKey ? { apiKey, baseURL, model } : undefined;
      const deckId = `deck-${Date.now()}`;

      if (isMimicMode) {
         setProcessingStage('Mimicking Exam & Generating Questions...');
         if (!topicName) throw new Error("Topic name is required for mimic mode");

         const response = await fetch(`${apiEndpoint}/cards/generate-mimic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeName: topicName,
              context: fileText,
              referenceFormat,
              count: 5,
              customConfig
            }),
         });

         if (!response.ok) throw new Error('Failed to generate mimic cards');
         const data = await response.json();

         addDeck({
            id: deckId,
            title: `Mimic Exam: ${topicName}`,
            description: 'AI Generated Cloned Practice',
            createdAt: new Date().toISOString(),
            cardCount: data.cards.length
         });

         // Assign generated cards to user via API to establish Cloud ID
         const assignedCards = [];
         for (const c of data.cards) {
            try {
               const assignRes = await fetch(`${apiEndpoint}/cards/review/demo-user-id/${c.id}`, { method: 'POST' });
               if (assignRes.ok) {
                  const reviewData = await assignRes.json();
                  assignedCards.push({
                     id: reviewData.id, // Use the backend Review ID
                     front: c.front,
                     back: c.back,
                     deckId: deckId,
                     fsrsCard: createEmptyCard(new Date()),
                     lastReviewed: null
                  });
               }
            } catch (e) {
               console.error('Failed to assign card to user', e);
            }
         }

         addCards(assignedCards.length > 0 ? assignedCards : data.cards.map((c: any, i: number) => ({
            id: `card-${deckId}-${i}`,
            front: c.front,
            back: c.back,
            deckId: deckId,
            fsrsCard: createEmptyCard(new Date()),
            lastReviewed: null
         })));

         setProgress(100);
         setProcessingStage('Complete! Cards added to your deck.');
         setTimeout(() => router.push('/study'), 2000);
         return;
      }

      // Math Academy Course Builder Mode
      setProcessingStage('Analyzing document semantics...');
      setProgress(40);
      setProcessingStage('Extracting atomic concepts & building skill tree...');

      const response = await fetch(`${apiEndpoint}/course/generate-tree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fileText,
          deckId: deckId,
          customConfig,
          tutorPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Math Academy skill tree');
      }

      setProgress(80);
      setProcessingStage('Generating cognitive scaffolding & micro-lessons...');

      addDeck({
        id: deckId,
        title: 'Math Academy Skill Tree',
        description: 'Structured course with prerequisites',
        createdAt: new Date().toISOString(),
        cardCount: 0 // Will be populated dynamically as user unlocks nodes
      });

      setProgress(100);
      setProcessingStage('Complete!');

      // Instead of forcing the 2D graph, we redirect to a new skill tree page
      setTimeout(() => {
        router.push(`/course?deckId=${deckId}`);
      }, 1500);

    } catch (error) {
      console.error(error);
      alert('Error connecting to backend API. Please ensure the backend is running on port 3001.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto mt-8">
        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          Knowledge Forge
        </h1>
        <p className="text-gray-500 text-lg">
          Upload any text or document. Our AI will extract the underlying knowledge graph and instantly generate an optimal learning path using FSRS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">

        {/* Input Area */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="text-indigo-600 w-5 h-5" />
              <h2 className="font-bold text-gray-800">Source Material</h2>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
               <button onClick={() => setIsMimicMode(false)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${!isMimicMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Graph Mode</button>
               <button onClick={() => setIsMimicMode(true)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${isMimicMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Mimic Exam Mode</button>
            </div>
          </div>

          {isMimicMode ? (
             <div className="mb-3 space-y-3">
               <input
                 type="text"
                 placeholder="Topic Name (e.g. Linear Algebra)"
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={topicName}
                 onChange={e => setTopicName(e.target.value)}
               />
               <textarea
                 placeholder="Paste reference exam format/style here (Optional)..."
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={referenceFormat}
                 onChange={e => setReferenceFormat(e.target.value)}
               />
             </div>
          ) : (
             <div className="mb-3 space-y-3">
               <textarea
                 placeholder="【创意工坊】输入特定的导师/角色扮演Prompt，例如：'请扮演星穹铁道的三月七，用活泼的语气和相机的比喻来解释知识' (可选)"
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-16 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={tutorPrompt}
                 onChange={e => setTutorPrompt(e.target.value)}
               />
             </div>
          )}

          <div className="relative flex-1 flex flex-col">
            <textarea
              className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 pb-10 text-gray-700 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
              placeholder={isMimicMode ? "Paste the core knowledge material to test on..." : "Paste your syllabus, article, or book chapter here..."}
              value={fileText}
              onChange={(e) => setFileText(e.target.value)}
              disabled={isProcessing || showGraph}
              aria-label={isMimicMode ? "Core knowledge material input" : "Raw text input for knowledge graph"}
            />

            <div className="absolute bottom-3 right-3 left-3 flex justify-between items-center text-xs text-gray-400 font-medium">
              <span>{fileText.length} characters</span>
              {fileText.length > 0 && !isProcessing && !showGraph && (
                <button
                  onClick={() => setFileText('')}
                  className="flex items-center gap-1 hover:text-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 focus:outline-none rounded px-1 transition-colors"
                  aria-label="Clear text input"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={isProcessing || showGraph || !fileText.trim()}
            title={isProcessing ? "AI is analyzing your text..." : (!fileText.trim() ? "Please enter text to generate" : "Start generation")}
            className={`mt-4 w-full py-4 rounded-2xl font-bold text-lg text-white flex justify-center items-center gap-2 transition-all shadow-md focus-visible:ring-4 focus-visible:ring-indigo-300 outline-none
              ${(isProcessing || showGraph || !fileText.trim())
                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
              }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> {processingStage}...
              </span>
            ) : showGraph ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Done
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5" /> Generate Knowledge Graph
              </span>
            )}
          </button>
        </div>

        {/* Processing/Visualization Area */}
        <div
          ref={containerRef}
          className="bg-gray-900 p-6 rounded-3xl shadow-xl flex flex-col h-[600px] relative overflow-hidden"
        >

          <AnimatePresence>
            {!isProcessing && !showGraph && (
              <motion.div
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"
              >
                <Network className="w-16 h-16 mb-4 opacity-20" />
                <p>Awaiting Input...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isProcessing && !showGraph && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white z-10 bg-gray-900/90 backdrop-blur-sm"
              >
                <Sparkles className="w-12 h-12 text-indigo-400 animate-bounce mb-6" />
                <h3 className="text-xl font-bold mb-2">{processingStage}</h3>

                {/* Progress Bar */}
                <div className="w-full max-w-xs bg-gray-700 rounded-full h-3 mt-4 overflow-hidden border border-gray-600">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-indigo-500 h-full rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Graph Visualization */}
          {showGraph && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full focus-visible:ring-4 focus-visible:ring-indigo-500 outline-none"
              tabIndex={0}
              aria-label="Knowledge Graph Visualization"
            >
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeAutoColorBy="group"
                nodeRelSize={8}
                linkColor={() => 'rgba(255,255,255,0.2)'}
                linkWidth={2}
                backgroundColor="#111827"
                width={dimensions.width}
                height={dimensions.height}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 12/globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                  ctx.fillStyle = 'rgba(17, 24, 39, 0.8)'; // text background
                  ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = node.color; // color assigned by `nodeAutoColorBy`
                  ctx.fillText(label, node.x, node.y);

                  node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                }}
              />

              <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-md border border-gray-700 px-4 py-2 rounded-xl text-white z-20 shadow-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium text-sm">Graph Generated & Cards Saved</span>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
