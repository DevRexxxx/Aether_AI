"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquare, Plus, Trash2, Command } from "lucide-react";

interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: "session" | "action";
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch sessions when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
      fetch("/api/sessions")
        .then((res) => res.json())
        .then((data) => setSessions(Array.isArray(data) ? data : []))
        .catch(() => setSessions([]));
    }
  }, [isOpen]);

  // Quick actions
  const quickActions: CommandItem[] = [
    {
      id: "new-chat",
      label: "New Chat",
      icon: <Plus size={16} />,
      type: "action",
      action: () => {
        window.dispatchEvent(new CustomEvent("SESSION_CREATED", { detail: "mock" }));
        onClose();
      },
    },
    {
      id: "clear-chat",
      label: "Clear Current Conversation",
      icon: <Trash2 size={16} />,
      type: "action",
      action: () => {
        window.dispatchEvent(new CustomEvent("CLEAR_CONVERSATION"));
        onClose();
      },
    },
  ];

  // Build filtered items
  const sessionItems: CommandItem[] = sessions.map((s) => ({
    id: s.id,
    label: s.title,
    icon: <MessageSquare size={16} />,
    type: "session",
    action: () => {
      window.dispatchEvent(new CustomEvent("SESSION_SELECTED", { detail: s.id }));
      onClose();
    },
  }));

  const allItems = [...quickActions, ...sessionItems];
  const filtered = query.trim()
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, selectedIndex, onClose]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[560px] bg-[#0E0E14]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <Search size={18} className="text-white/30 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search sessions & commands..."
                className="flex-1 bg-transparent text-white text-[15px] font-medium placeholder-white/30 outline-none"
                autoFocus
              />
              <kbd className="text-[11px] text-white/25 font-bold bg-white/[0.05] px-2 py-1 rounded-lg border border-white/[0.06]">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto py-2 hide-scrollbar">
              {filtered.length === 0 && (
                <div className="px-5 py-8 text-center text-white/30 text-sm font-medium">
                  No results found
                </div>
              )}

              {/* Quick Actions Section */}
              {filtered.some((f) => f.type === "action") && (
                <div className="px-4 pt-2 pb-1">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 px-1">
                    Quick Actions
                  </span>
                </div>
              )}
              {filtered
                .filter((f) => f.type === "action")
                .map((item, idx) => {
                  const globalIdx = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all ${
                        selectedIndex === globalIdx
                          ? "bg-violet-500/10 text-white"
                          : "text-white/60 hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className={`flex-shrink-0 ${selectedIndex === globalIdx ? "text-violet-400" : "text-white/30"}`}>
                        {item.icon}
                      </span>
                      <span className="text-[14px] font-medium truncate">{item.label}</span>
                      {selectedIndex === globalIdx && (
                        <span className="ml-auto text-[11px] text-white/20 font-bold">↵</span>
                      )}
                    </button>
                  );
                })}

              {/* Sessions Section */}
              {filtered.some((f) => f.type === "session") && (
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 px-1">
                    Recent Sessions
                  </span>
                </div>
              )}
              {filtered
                .filter((f) => f.type === "session")
                .map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all ${
                        selectedIndex === globalIdx
                          ? "bg-violet-500/10 text-white"
                          : "text-white/60 hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className={`flex-shrink-0 ${selectedIndex === globalIdx ? "text-cyan-400" : "text-white/30"}`}>
                        {item.icon}
                      </span>
                      <span className="text-[14px] font-medium truncate">{item.label}</span>
                      {selectedIndex === globalIdx && (
                        <span className="ml-auto text-[11px] text-white/20 font-bold">↵</span>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] text-[11px] text-white/20 font-medium">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.06]">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.06]">↵</kbd> Select</span>
              </div>
              <span className="flex items-center gap-1"><Command size={10} /> K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
