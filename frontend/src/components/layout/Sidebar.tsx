"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Clock, 
  Pin, 
  Folder, 
  FileText, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles
} from "lucide-react";

const BOTTOM_NAV_ITEMS = [
  { icon: Settings, label: "Settings" },
  { icon: User, label: "Profile" },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sessions, setSessions] = useState<{id: string, title: string}[]>([]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch {
      // Mock data if backend is offline
      setSessions([
        { id: "1", title: "Product Roadmap" },
        { id: "2", title: "API Design" }
      ]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchSessions();
    const handleCreated = () => fetchSessions();
    window.addEventListener("SESSION_CREATED", handleCreated);
    return () => window.removeEventListener("SESSION_CREATED", handleCreated);
  }, []);

  return (
    <motion.aside
      initial={{ width: 280 }}
      animate={{ width: isExpanded ? 280 : 88 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="h-full flex-shrink-0 flex flex-col gap-4 py-8 pl-8 pr-4 relative z-40"
    >
      <div className="glass-card flex-1 flex flex-col justify-between p-5 overflow-hidden">
        
        {/* Top Section */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-2">
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="logo-full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3 font-extrabold text-xl tracking-tight text-white"
                >
                  <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-violet-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-[0_0_18px_rgba(255,107,44,0.35)]">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    Aether
                    <span className="text-[10px] text-violet-400 bg-violet-500/15 px-1.5 py-0.5 rounded-md font-bold tracking-wider">V5.0</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-violet-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-[0_0_18px_rgba(255,107,44,0.35)] mx-auto"
                >
                  <Sparkles size={16} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-full hover:bg-orange-500/10 transition-colors text-white/40 hover:text-orange-300 absolute -right-3 top-6 bg-[#0E0E14] border border-white/10 shadow-lg z-50"
            >
              {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("CLEAR_CONVERSATION"));
              }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-[20px] transition-all duration-300 group bg-gradient-to-r from-violet-500/15 via-orange-500/8 to-transparent border border-violet-500/20 hover:border-orange-400/40 shadow-[0_4px_20px_rgba(255,107,44,0.06)] hover:shadow-[0_4px_24px_rgba(255,107,44,0.12)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-violet-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              <MessageSquare size={20} className="flex-shrink-0 text-orange-400 relative z-10" strokeWidth={1.5} />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden text-[15px] font-bold text-white relative z-10"
                  >
                    New Chat
                  </motion.span>
                )}
              </AnimatePresence>
              {isExpanded && <Plus size={18} className="ml-auto opacity-70 text-orange-400 relative z-10" />}
            </button>

            <div className="mt-6 mb-2 px-4">
              {isExpanded && <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Recent Chats</p>}
              {!isExpanded && <div className="h-[1px] w-8 mx-auto bg-white/10" />}
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[250px] flex flex-col gap-1 pr-2 hide-scrollbar">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => window.dispatchEvent(new CustomEvent("SESSION_SELECTED", { detail: session.id }))}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-[16px] transition-all duration-200 text-white/50 hover:bg-white/[0.04] hover:text-white group text-left"
                >
                  <Clock size={18} className="flex-shrink-0 text-white/25 group-hover:text-orange-400/70 transition-colors" strokeWidth={1.5} />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap overflow-hidden text-[14px] font-medium truncate"
                      >
                        {session.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-1 pt-4 border-t border-white/5 relative z-10">
          {BOTTOM_NAV_ITEMS.map((item, idx) => (
            <button
              key={idx}
              className="flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-300 text-white/50 hover:bg-white/[0.04] hover:text-white group relative overflow-hidden"
            >
              <item.icon size={20} className="flex-shrink-0 text-white/40 group-hover:text-orange-400 transition-colors" strokeWidth={1.5} />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden text-[14px] font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
