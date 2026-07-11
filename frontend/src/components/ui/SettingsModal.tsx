"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Thermometer, Hash, MessageSquare, RotateCcw } from "lucide-react";

export interface AetherSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: AetherSettings = {
  model: "llama3",
  temperature: 0.2,
  maxTokens: 512,
  systemPrompt: `You are an advanced AI assistant — intelligent, helpful, and versatile, similar to ChatGPT, Gemini, and Claude.

CAPABILITIES:
- You can answer questions on any topic: science, math, history, technology, philosophy, creative writing, coding, and more.
- You can help with analysis, brainstorming, explanations, problem-solving, writing, and general conversation.
- You can write code, explain concepts, summarize information, translate, and assist with creative tasks.

PERSONALITY:
- Be conversational, clear, and helpful.
- Match the depth of your response to the complexity of the question.
- Be direct. Don't start with "Great question!" or "Based on...". Just answer naturally.
- If you're unsure about something, say so honestly rather than making things up. Do NOT hallucinate.
- Use formatting (lists, code blocks, headers) when it improves readability, but keep casual questions casual.

You may be given supplementary reference context below. If context is provided, you MUST base your answer primarily on the context. If the answer cannot be found in the context, clearly state that you do not know. Do not hallucinate or invent information.`,
};

const AVAILABLE_MODELS = [
  { id: "llama3", name: "Llama 3", desc: "Meta's flagship model" },
  { id: "mistral", name: "Mistral", desc: "Fast & efficient" },
  { id: "codellama", name: "Code Llama", desc: "Optimized for code" },
  { id: "gemma", name: "Gemma", desc: "Google's compact model" },
  { id: "phi3", name: "Phi-3", desc: "Microsoft's small model" },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function getSettings(): AetherSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem("aether-settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AetherSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      setSettings(getSettings());
      setSaved(false);
    }
  }, [isOpen]);

  const updateField = <K extends keyof AetherSettings>(key: K, value: AetherSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("aether-settings", JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("SETTINGS_CHANGED", { detail: settings }));
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaved(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[580px] max-h-[85vh] bg-[#0E0E14]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
              <h2 className="text-[18px] font-bold text-white">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/[0.06] text-white/40 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 hide-scrollbar">

              {/* Model Selection */}
              <div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-white/60 uppercase tracking-wider mb-3">
                  <Cpu size={14} className="text-violet-400" /> Model
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => updateField("model", m.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-[16px] border transition-all text-left ${
                        settings.model === m.id
                          ? "bg-violet-500/10 border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${settings.model === m.id ? "bg-violet-400" : "bg-white/15"}`} />
                      <div>
                        <p className={`text-[14px] font-semibold ${settings.model === m.id ? "text-white" : "text-white/60"}`}>
                          {m.name}
                        </p>
                        <p className="text-[11px] text-white/25">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-white/60 uppercase tracking-wider mb-3">
                  <Thermometer size={14} className="text-orange-400" /> Temperature
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => updateField("temperature", parseFloat(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 accent-violet-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  />
                  <span className="text-[14px] font-bold text-white w-12 text-right tabular-nums">
                    {settings.temperature.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-white/20 font-medium">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-white/60 uppercase tracking-wider mb-3">
                  <Hash size={14} className="text-cyan-400" /> Max Tokens
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="128"
                    max="2048"
                    step="64"
                    value={settings.maxTokens}
                    onChange={(e) => updateField("maxTokens", parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 accent-cyan-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  />
                  <span className="text-[14px] font-bold text-white w-12 text-right tabular-nums">
                    {settings.maxTokens}
                  </span>
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-white/20 font-medium">
                  <span>Concise</span>
                  <span>Detailed</span>
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-white/60 uppercase tracking-wider mb-3">
                  <MessageSquare size={14} className="text-rose-400" /> System Prompt
                </label>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => updateField("systemPrompt", e.target.value)}
                  rows={6}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[16px] px-4 py-3 text-[13px] text-white/80 font-medium resize-none outline-none focus:border-violet-500/30 focus:bg-white/[0.04] transition-all placeholder-white/20 hide-scrollbar leading-relaxed"
                  placeholder="Define how the AI should behave..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[13px] font-medium text-white/30 hover:text-white/60 transition-colors"
              >
                <RotateCcw size={14} /> Reset to defaults
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all ${
                  saved
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-violet-500 text-white hover:bg-violet-500/90 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                }`}
              >
                {saved ? "✓ Saved" : "Save Changes"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
