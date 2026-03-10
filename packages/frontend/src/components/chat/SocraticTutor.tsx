'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';

export interface Persona {
  id: string;
  name: string;
  personality: string;
  avatar: string;
  color: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'socrates',
    name: '苏格拉底',
    personality: '你是一个喜欢用反问和启发式提问的智者。你永远不会直接给出答案，而是通过一步步的问题引导学生自己发现真理。',
    avatar: '🏛️',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'feynman',
    name: '理查德·费曼',
    personality: '你是一个充满激情、幽默风趣的物理学家。你喜欢用最通俗易懂的生活类比来解释极其复杂的概念。如果一个东西不能用简单的话说清楚，说明还没真懂。',
    avatar: '⚛️',
    color: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'seneca',
    name: '塞内卡 (严师)',
    personality: '你是一个斯多葛学派的严师。你的语气严肃、简练，直击要害。你要求学生保持专注，不容忍懒惰的思考。',
    avatar: '🦉',
    color: 'bg-slate-200 text-slate-900 border-slate-400',
  },
];

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SocraticTutorProps {
  isOpen: boolean;
  onClose: () => void;
  contextTitle: string;
  contextBody: string;
}

export default function SocraticTutor({ isOpen, onClose, contextTitle, contextBody }: SocraticTutorProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { provider, apiKey, baseURL } = useSettingsStore();
  const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  useEffect(() => {
    // When opened with a new context, reset chat and add an initial greeting
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `你好！我是${selectedPersona.name}。关于【${contextTitle}】，你有什么疑惑吗？我们可以一起探讨。`
        }
      ]);
    }
  }, [isOpen, contextTitle, selectedPersona.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiEndpoint}/archimedes/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.filter(m => m.role !== 'system'), // exclude system prompts from history
          context: `Current Flashcard/Topic:\nFront: ${contextTitle}\nBack: ${contextBody}`,
          persona: {
            name: selectedPersona.name,
            personality: selectedPersona.personality
          },
          customConfig: {
            apiKey: apiKey,
            baseURL: baseURL,
          }
        }),
      });

      if (!response.ok) throw new Error('API Request Failed');

      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'system', content: '⚠️ 导师连接中断，请检查网络或 API 设置。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Socrates-7 导师舱
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Persona Selector */}
          <div className="p-3 border-b border-slate-100 flex gap-2 overflow-x-auto whitespace-nowrap bg-white scrollbar-hide">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPersona(p);
                  setMessages([{ role: 'assistant', content: `切换导师成功。我是${p.name}，让我们继续探讨【${contextTitle}】。` }]);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedPersona.id === p.id ? p.color : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{p.avatar}</span>
                {p.name}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            <div className="text-xs text-center text-slate-400 bg-slate-100 py-1 px-3 rounded-full w-max mx-auto mb-4 border border-slate-200">
              当前探讨: {contextTitle}
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl mr-2 flex-shrink-0 bg-white border border-slate-200 shadow-sm">
                    {selectedPersona.avatar}
                  </div>
                )}

                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : msg.role === 'system'
                    ? 'bg-red-50 text-red-600 border border-red-100 w-full text-center'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl mr-2 flex-shrink-0 bg-white border border-slate-200">
                    {selectedPersona.avatar}
                  </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400">正在思考...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="向导师提问或回答..."
                className="flex-1 bg-slate-100 text-slate-800 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
