"use client";

import { useSettingsStore } from '@/store/settingsStore';
import { Settings, Server, Key, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { provider, apiKey, baseURL, model, setSettings } = useSettingsStore();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseURL);
  const [localModel, setLocalModel] = useState(model);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey);
    setLocalBaseUrl(baseURL);
    setLocalModel(model);
  }, [apiKey, baseURL, model]);

  const handleProviderChange = (e: any) => {
    const newProvider = e.target.value;
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
    setSettings({ provider: newProvider });
  };

  const handleSave = () => {
    setSettings({
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

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">

        {/* Provider Select */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">AI Provider</label>
          <select
            value={provider}
            onChange={handleProviderChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="DeepSeek">DeepSeek (Recommended)</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Custom">Custom / Local (Ollama, LM Studio)</option>
          </select>
        </div>

        {/* Base URL */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-400" /> Base URL
          </label>
          <input
            type="text"
            value={localBaseUrl}
            onChange={(e) => setLocalBaseUrl(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-400" /> API Key
          </label>
          <input
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Leave empty to use the server default.</p>
        </div>

        {/* Model Name */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
            <Bot className="w-4 h-4 text-gray-400" /> Model Name
          </label>
          <input
            type="text"
            value={localModel}
            onChange={(e) => setLocalModel(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-md flex justify-center items-center gap-2"
        >
          {saved ? "Saved Successfully!" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
