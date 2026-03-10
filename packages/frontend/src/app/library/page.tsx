"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Database, Copy, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function LibraryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Processing...');

  const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setExtractedText('');
    setProgress(0);
    setStatusMessage('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiEndpoint}/library/extract`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from file');
      }

      const data = await response.json();
      if (data.taskId) {
        // Handle Server-Sent Events for extraction progress
        const eventSource = new EventSource(`${apiEndpoint}/library/extract/stream/${data.taskId}`);

        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);

            if (parsedData.type === 'progress') {
              setProgress(parsedData.progress || 0);
              setStatusMessage(parsedData.message || 'Processing...');
            } else if (parsedData.type === 'complete') {
              setProgress(100);
              setStatusMessage('Complete');
              setExtractedText(parsedData.text);
              eventSource.close();
              setIsProcessing(false);
            } else if (parsedData.type === 'error') {
              setStatusMessage(`Error: ${parsedData.message}`);
              eventSource.close();
              setIsProcessing(false);
              alert(`Extraction failed: ${parsedData.message}`);
            }
          } catch (err) {
            console.error('Failed to parse SSE event', err);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE Error:', error);
          eventSource.close();
          setIsProcessing(false);
          setStatusMessage('Connection lost.');
        };
      } else if (data.text) {
         // Fallback for sync responses (in case API reverted to synchronous)
         setExtractedText(data.text);
         setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to backend API. Please ensure the backend is running on port 3001 and CORS is enabled.');
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-4 max-w-2xl mx-auto mt-8">
        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
          <Database className="w-8 h-8 text-indigo-500" />
          Library & Document OCR
        </h1>
        <p className="text-gray-500 text-lg">
          Upload images (PNG, JPG) for OCR, or PDF/EPUB/TXT files to extract text and markdown. You can then copy the text to generate knowledge graphs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Upload Area */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-4">
            <UploadCloud className="text-indigo-600 w-5 h-5" />
            <h2 className="font-bold text-gray-800">Upload File</h2>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 relative hover:bg-gray-100 transition">
             <input
               type="file"
               accept="image/*,.pdf,.txt,.epub"
               onChange={handleFileChange}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
             <div className="flex flex-col items-center text-gray-500">
               <UploadCloud className="w-12 h-12 mb-2 text-indigo-400" />
               <span className="font-medium text-lg">Drag & Drop or Click to Browse</span>
               <span className="text-sm mt-1 text-gray-400">Supports PDF, EPUB, PNG, JPG, TXT</span>
             </div>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
              <span className="font-medium text-indigo-800 truncate">{file.name}</span>
              <span className="text-sm text-indigo-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          <div className="mt-4 w-full">
            {isProcessing && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>{statusMessage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isProcessing || !file}
              className={`w-full py-4 rounded-2xl font-bold text-lg text-white flex justify-center items-center gap-2 transition-all shadow-md
                ${(isProcessing || !file)
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1'
                }`}
            >
              {isProcessing ? (
                <span className="animate-pulse flex items-center gap-2">
                  <Database className="w-5 h-5 animate-spin" /> Working...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5" /> Extract Text
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Result Area */}
        <div className="bg-gray-900 p-6 rounded-3xl shadow-xl flex flex-col h-[500px] relative overflow-hidden">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5" />
                <h2 className="font-bold">Extracted Text</h2>
             </div>
             {extractedText && (
               <button onClick={handleCopy} className="text-gray-300 hover:text-white transition flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-lg">
                 {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                 <span className="text-sm">{copied ? 'Copied' : 'Copy'}</span>
               </button>
             )}
           </div>

           <div className="flex-1 w-full bg-gray-800 rounded-2xl p-4 text-gray-300 overflow-auto border border-gray-700 custom-scrollbar">
             {extractedText ? (
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {extractedText}
                  </ReactMarkdown>
                </div>
             ) : (
                <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                   <FileText className="w-12 h-12 opacity-20" />
                   <p>Awaiting file extraction...</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
