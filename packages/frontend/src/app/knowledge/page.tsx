"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Sparkles, FileText, CheckCircle, Database, Network } from 'lucide-react';
import dynamic from 'next/dynamic';
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
import { useDeckStore } from '@/store/deckStore';
import { createEmptyCard } from 'ts-fsrs';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/settingsStore';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { addDeck, addCards } = useDeckStore();
  const { apiKey, baseURL, model } = useSettingsStore();

  const [fileText, setFileText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('Idle');

  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const graphRef = useRef<any>();

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

  const handleProcess = async () => {
    if (!fileText.trim()) return;

    setIsProcessing(true);
    setProgress(10);
    setProcessingStage('Connecting to DeepSeek AI...');

    try {
      // Connect to the new backend API
      setProgress(40);
      setProcessingStage('Extracting concepts & building graph...');

      const customConfig = apiKey ? { apiKey, baseURL, model } : undefined;

      const response = await fetch('http://localhost:3001/api/knowledge/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fileText, customConfig }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate graph from AI');
      }

      const generatedGraph = await response.json();

      setProgress(80);
      setProcessingStage('Generating dynamic flashcards...');

      // We will generate cards for all nodes upfront for MVP simplicity,
      // but keeping in mind the user wants dynamic generation "when learning a node",
      // doing it here is a temporary compromise to fit the existing store structure.
      // Ideally, the 'study' page fetches cards lazily.

      const deckId = `deck-${Date.now()}`;
      addDeck({
        id: deckId,
        title: 'Document DeepSeek Map',
        description: 'AI Generated Knowledge Graph',
        createdAt: new Date().toISOString(),
        cardCount: generatedGraph.nodes.length
      });

      const newCards = [];
      for (let i = 0; i < generatedGraph.nodes.length; i++) {
        const node = generatedGraph.nodes[i];

        // Dynamic card generation per node using the backend endpoint
        setProcessingStage(`Generating dynamic flashcards for ${node.id || node.name}...`);

        try {
          const cardResponse = await fetch('http://localhost:3001/api/knowledge/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeName: node.id || node.name,
              nodeContext: fileText.substring(0, 1000),
              customConfig
            }), // sending a subset of text as context
          });

          if (cardResponse.ok) {
            const cardData = await cardResponse.json();
            const cards = cardData.cards || [];

            cards.forEach((c: any, cardIndex: number) => {
               newCards.push({
                  id: `card-${deckId}-${i}-${cardIndex}`,
                  front: c.front,
                  back: c.back,
                  deckId: deckId,
                  fsrsCard: createEmptyCard(new Date()),
                  lastReviewed: null
               });
            });
          }
        } catch (e) {
          console.error("Failed to generate cards for node", node.id || node.name, e);
          // Fallback simple card
          newCards.push({
            id: `card-${deckId}-${i}`,
            front: `什么是【${node.id || node.name}】？`,
            back: `基于你的文档生成的核心知识点概念。`,
            deckId: deckId,
            fsrsCard: createEmptyCard(new Date()),
            lastReviewed: null
          });
        }
      }

      addCards(newCards);

      // Update Graph UI
      const formattedGraph = {
         nodes: generatedGraph.nodes.map((n: any) => ({ ...n, name: n.id || n.name })),
         links: generatedGraph.links
      };

      setGraphData(formattedGraph as any);
      setProgress(100);
      setProcessingStage('Complete!');
      setShowGraph(true);
      setIsProcessing(false);

      setTimeout(() => {
        router.push('/study');
      }, 3000);

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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-indigo-600 w-5 h-5" />
            <h2 className="font-bold text-gray-800">Source Material</h2>
          </div>

          <textarea
            className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-700 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
            placeholder="Paste your syllabus, article, or book chapter here..."
            value={fileText}
            onChange={(e) => setFileText(e.target.value)}
            disabled={isProcessing || showGraph}
          />

          <button
            onClick={handleProcess}
            disabled={isProcessing || showGraph || !fileText.trim()}
            className={`mt-4 w-full py-4 rounded-2xl font-bold text-lg text-white flex justify-center items-center gap-2 transition-all shadow-md
              ${(isProcessing || showGraph || !fileText.trim())
                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1'
              }`}
          >
            {isProcessing ? (
              <span className="animate-pulse flex items-center gap-2">
                <Database className="w-5 h-5 animate-spin" /> Processing...
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
        <div className="bg-gray-900 p-6 rounded-3xl shadow-xl flex flex-col h-[500px] relative overflow-hidden">

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
              className="absolute inset-0 w-full h-full"
            >
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeAutoColorBy="group"
                nodeRelSize={8}
                linkColor={() => 'rgba(255,255,255,0.2)'}
                linkWidth={2}
                backgroundColor="#111827"
                width={800} // Ideally resize-aware, hardcoded for MVP constraints
                height={500}
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
