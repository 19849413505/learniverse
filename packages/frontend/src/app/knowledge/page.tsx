"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Sparkles, FileText, CheckCircle, Database, Network, Link as LinkIcon, File } from 'lucide-react';
import dynamic from 'next/dynamic';
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
import { useDeckStore } from '@/store/deckStore';
import { processFile, parseWebpage, SupportedImportFormat } from '@/lib/importers';
import { createEmptyCard } from 'ts-fsrs';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/settingsStore';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { addDeck, addCards } = useDeckStore();
  const { apiKey, baseURL, model, ocrEngine, ocrModel } = useSettingsStore();

  const [fileTexts, setFileTexts] = useState<string[]>(['']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [webpageUrl, setWebpageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
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

  // Mimic Exam State
  const [isMimicMode, setIsMimicMode] = useState(false);
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const [referenceFormat, setReferenceFormat] = useState('');
  const [topicName, setTopicName] = useState('');

  const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setProcessingStage(`Importing ${file.name}...`);
    try {
      const doc = await processFile(
        file,
        (msg, prog) => {
          setProcessingStage(msg);
        },
        { engine: ocrEngine || 'tesseract', key: apiKey, baseUrl: baseURL, model: ocrModel || 'gpt-4o' }
      );

      const newTexts = [...fileTexts];
      newTexts[index] = `[Imported: ${doc.title} (${doc.sourceType})]\n\n${doc.content}`;
      setFileTexts(newTexts);
    } catch (err: any) {
      alert(`Failed to import file: ${err.message}`);
    } finally {
      setIsImporting(false);
      setProcessingStage('Idle');
    }
  };

  const handleWebpageImport = async (index: number) => {
    if (!webpageUrl) return;
    setIsImporting(true);
    setProcessingStage(`Fetching ${webpageUrl}...`);
    try {
      const doc = await parseWebpage(webpageUrl);
      const newTexts = [...fileTexts];
      newTexts[index] = `[Imported Webpage: ${doc.title}]\n\n${doc.content}`;
      setFileTexts(newTexts);
      setShowUrlInput(false);
      setWebpageUrl('');
    } catch (err: any) {
      alert(`Failed to import webpage: ${err.message}`);
    } finally {
      setIsImporting(false);
      setProcessingStage('Idle');
    }
  };

  const handleProcess = async () => {
    const combinedText = fileTexts.filter(t => t.trim().length > 0).join('\n\n---\n\n');
    if (!combinedText) return;

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
              context: combinedText,
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
      setProcessingStage('Initializing AI Agents...');
      setProgress(5);

      const response = await fetch(`${apiEndpoint}/course/generate-tree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: combinedText,
          deckId: deckId,
          isDeepResearch,
          customConfig
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start Math Academy skill tree generation');
      }

      addDeck({
        id: deckId,
        title: 'Math Academy Skill Tree',
        description: 'Structured course with prerequisites',
        createdAt: new Date().toISOString(),
        cardCount: 0 // Will be populated dynamically as user unlocks nodes
      });

      // Subscribe to Server-Sent Events for real-time progress
      const eventSource = new EventSource(`${apiEndpoint}/course/generate-tree/stream/${deckId}`);

      eventSource.addEventListener('PROGRESS', (e) => {
         const data = JSON.parse(e.data);
         if (data.progress) setProgress(data.progress);
         if (data.message) setProcessingStage(data.message);
      });

      eventSource.addEventListener('COMPLETE', (e) => {
         eventSource.close();
         setProgress(100);
         setProcessingStage('✅ Generation Complete!');
         setTimeout(() => {
            router.push(`/course?deckId=${deckId}`);
         }, 1500);
      });

      eventSource.addEventListener('ERROR', (e) => {
         eventSource.close();
         const data = JSON.parse(e.data);
         alert(`AI Generation Error: ${data.message}`);
         setIsProcessing(false);
      });

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
            <div className="flex gap-2">
              <button
                 onClick={() => setIsDeepResearch(!isDeepResearch)}
                 className={`px-3 py-1 text-xs rounded-md font-bold transition-all border ${isDeepResearch ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}
              >
                 ✨ Deep Research Mode
              </button>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button onClick={() => setIsMimicMode(false)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${!isMimicMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Graph Mode</button>
                 <button onClick={() => setIsMimicMode(true)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${isMimicMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Mimic Exam Mode</button>
              </div>
            </div>
          </div>

          {isMimicMode && (
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
          )}

          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4 pr-2">
            {fileTexts.map((text, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-2 bg-gray-50 border border-gray-200 rounded-2xl">
                <div className="flex items-center justify-between w-full px-2 pt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Document {idx + 1}</span>
                  <div className="flex gap-2">
                    <label className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-1.5 rounded-md cursor-pointer shadow-sm border border-indigo-200 transition-colors flex items-center gap-1" title="Upload File (Word, Excel, PDF, Image, MD)">
                      <File className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Upload File</span>
                      <input type="file" className="hidden" accept=".md,.txt,.docx,.xlsx,.xls,.csv,.pdf,image/*" onChange={(e) => handleFileUpload(e, idx)} disabled={isProcessing || isImporting || showGraph} />
                    </label>
                    <button
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-1.5 rounded-md cursor-pointer shadow-sm border border-emerald-200 transition-colors flex items-center gap-1"
                      title="Import from Webpage"
                      disabled={isProcessing || isImporting || showGraph}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">From URL</span>
                    </button>
                  </div>
                </div>

                {showUrlInput && (
                  <div className="flex gap-2 bg-emerald-50 p-2 rounded-xl border border-emerald-100 mx-2">
                    <input
                      type="url"
                      placeholder="https://example.com/article"
                      className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      value={webpageUrl}
                      onChange={e => setWebpageUrl(e.target.value)}
                    />
                    <button
                      onClick={() => handleWebpageImport(idx)}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      disabled={isImporting || !webpageUrl}
                    >
                      {isImporting ? 'Fetching...' : 'Fetch'}
                    </button>
                  </div>
                )}

               <textarea
                 className="w-full bg-transparent p-2 px-3 text-gray-700 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[120px]"
                 placeholder={isMimicMode ? `Paste knowledge material or upload a file...` : `Paste syllabus, article, book chapter or upload a file...`}
                 value={text}
                 onChange={(e) => {
                    const newTexts = [...fileTexts];
                    newTexts[idx] = e.target.value;
                    setFileTexts(newTexts);
                 }}
                 disabled={isProcessing || isImporting || showGraph}
               />
              </div>
            ))}
            {fileTexts.length < 5 && (
               <button
                  onClick={() => setFileTexts([...fileTexts, ''])}
                  className="text-indigo-600 text-sm font-bold hover:underline self-start bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 mt-2"
                  disabled={isProcessing || isImporting || showGraph}
               >
                  + Add another document source
               </button>
            )}
          </div>

          <button
            onClick={handleProcess}
            disabled={isProcessing || showGraph || fileTexts.every(t => !t.trim())}
            className={`mt-4 w-full py-4 rounded-2xl font-bold text-lg text-white flex justify-center items-center gap-2 transition-all shadow-md
              ${(isProcessing || showGraph || fileTexts.every(t => !t.trim()))
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
        <div className="bg-gray-900 p-6 rounded-3xl shadow-xl flex flex-col h-[600px] relative overflow-hidden">

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
            {(isProcessing || isImporting) && !showGraph && (
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
