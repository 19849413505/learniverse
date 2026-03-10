"use client";

import { useSettingsStore } from '@/store/settingsStore';
import { Settings, Server, Key, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { provider, apiKey, baseURL, model, ocrEngine, ocrModel, setSettings } = useSettingsStore();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseURL);
  const [localModel, setLocalModel] = useState(model);
  const [localOcrEngine, setLocalOcrEngine] = useState<'tesseract' | 'llm'>(ocrEngine || 'tesseract');
  const [localOcrModel, setLocalOcrModel] = useState(ocrModel || 'gpt-4o');

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey);
    setLocalBaseUrl(baseURL);
    setLocalModel(model);
    setLocalOcrEngine(ocrEngine || 'tesseract');
    setLocalOcrModel(ocrModel || 'gpt-4o');
  }, [apiKey, baseURL, model, ocrEngine, ocrModel]);

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
      model: localModel,
      ocrEngine: localOcrEngine,
      ocrModel: localOcrModel
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

        <hr className="my-6 border-gray-200" />

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            OCR & File Parsing Engine
          </h2>
          <p className="text-sm text-gray-500">
            Select the backend engine used for parsing images and PDFs.
            <strong>Tesseract (Offline)</strong> runs locally but might be less accurate for complex layouts.
            <strong>LLM API (Online)</strong> uses the AI provider above (must support multimodal inputs like gpt-4o, gemini-1.5-pro, deepseek-vl) for highly accurate OCR extraction.
          </p>

          <div className="flex flex-col gap-3">
             <label className="text-sm font-semibold text-gray-700">OCR Engine</label>
             <select
                value={localOcrEngine}
                onChange={(e) => setLocalOcrEngine(e.target.value as 'tesseract' | 'llm')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
             >
                <option value="tesseract">Tesseract.js (Offline - Built-in)</option>
                <option value="llm">Multimodal LLM (Online API)</option>
             </select>
          </div>

          {localOcrEngine === 'llm' && (
            <div className="flex flex-col gap-3 mt-4">
               <label className="text-sm font-semibold text-gray-700">Vision Model Name</label>
               <input
                 type="text"
                 value={localOcrModel}
                 onChange={(e) => setLocalOcrModel(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                 placeholder="e.g. gpt-4o, gemini-1.5-pro"
               />
               <p className="text-xs text-gray-400">This model will be called using the API Key and Base URL configured above. Make sure the provider supports Vision (Image) inputs.</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-md flex justify-center items-center gap-2"
        >
          {saved ? "Saved Successfully!" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
