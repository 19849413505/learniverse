"use client";

import { useSettingsStore } from '@/store/settingsStore';
import { Settings, Server, Key, Bot, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';

export default function SettingsPage() {
  const { provider, apiKey, baseURL, model, setSettings } = useSettingsStore(useShallow((state) => ({ provider: state.provider, apiKey: state.apiKey, baseURL: state.baseURL, model: state.model, setSettings: state.setSettings })));

  const [localProvider, setLocalProvider] = useState(provider);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseURL);
  const [localModel, setLocalModel] = useState(model);

  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasUnsavedChanges =
    localProvider !== provider ||
    localApiKey !== apiKey ||
    localBaseUrl !== baseURL ||
    localModel !== model;

  useEffect(() => {
    setLocalProvider(provider);
    setLocalApiKey(apiKey);
    setLocalBaseUrl(baseURL);
    setLocalModel(model);
  }, [provider, apiKey, baseURL, model]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as "DeepSeek" | "OpenAI" | "Custom";
    setLocalProvider(newProvider);
    if (newProvider === 'DeepSeek') {
      setLocalBaseUrl('https://api.deepseek.com/v1');
      setLocalModel('deepseek-chat');
    } else if (newProvider === 'OpenAI') {
      setLocalBaseUrl('https://api.openai.com/v1');
      setLocalModel('gpt-4o');
    } else {
      setLocalBaseUrl('http://localhost:11434/v1'); // Default local Ollama or LM Studio port
      setLocalModel('llama3');
    }
  };

  const handleSave = () => {
    setSettings({
      provider: localProvider,
      apiKey: localApiKey,
      baseURL: localBaseUrl,
      model: localModel
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4">
      <div className="space-y-2 mt-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-500" />
          Settings (Custom API)
        </h1>
        <p className="text-gray-500 text-lg">
          Configure your own LLM provider like DeepSeek, OpenAI, or a local server. All credentials are saved securely in your browser and never sent anywhere except our local backend.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">

        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              You have unsaved changes.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Provider Select */}
        <div className="space-y-2">
          <label htmlFor="provider-select" className="block text-sm font-bold text-gray-700">AI Provider</label>
          <select
            id="provider-select"
            value={localProvider}
            onChange={handleProviderChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          >
            <option value="DeepSeek">DeepSeek (Recommended)</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Custom">Custom / Local (Ollama, LM Studio)</option>
          </select>
        </div>

        {/* Base URL */}
        <div className="space-y-2">
          <label htmlFor="base-url-input" className="block text-sm font-bold text-gray-700 flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-400" /> Base URL
          </label>
          <input
            id="base-url-input"
            type="text"
            value={localBaseUrl}
            onChange={(e) => setLocalBaseUrl(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition-shadow"
          />
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label htmlFor="api-key-input" className="block text-sm font-bold text-gray-700 flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-400" /> API Key
          </label>
          <div className="relative">
            <input
              id="api-key-input"
              type={showApiKey ? "text" : "password"}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1 outline-none transition-colors"
              aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Leave empty to use the server default.</p>
        </div>

        {/* Model Name */}
        <div className="space-y-2">
          <label htmlFor="model-name-input" className="block text-sm font-bold text-gray-700 flex items-center gap-2">
            <Bot className="w-4 h-4 text-gray-400" /> Model Name
          </label>
          <input
            id="model-name-input"
            type="text"
            value={localModel}
            onChange={(e) => setLocalModel(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition-shadow"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges && !saved}
          className={`w-full py-4 mt-4 text-white font-bold rounded-2xl transition-all shadow-md flex justify-center items-center gap-2 active:scale-95 focus-visible:ring-4 focus-visible:ring-offset-2 outline-none
            ${saved ? "bg-emerald-500 hover:bg-emerald-600 focus-visible:ring-emerald-300" : "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-300 disabled:bg-indigo-300 disabled:cursor-not-allowed"}
          `}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" /> Saved Successfully!
            </>
          ) : (
            "Save Configuration"
          )}
        </button>
      </div>
    </div>
  );
}
