"use client";

import { motion } from "framer-motion";
import { 
  Activity, 
  Brain, 
  Database, 
  Clock, 
  Files, 
  BookOpen, 
  Layout, 
  Mic, 
  Library, 
  Settings,
  Zap
} from "lucide-react";

const BENTO_CARDS = [
  { id: 1, label: "Conversation Stats", icon: Activity, colSpan: "col-span-1 md:col-span-2", rowSpan: "row-span-1", content: "98.2% Accuracy", desc: "Optimal performance", color: "text-cyan-400", iconBg: "bg-cyan-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(6,182,212,0.12)]", hoverBorder: "group-hover:border-cyan-400/20" },
  { id: 2, label: "AI Models", icon: Brain, colSpan: "col-span-1", rowSpan: "row-span-1", content: "Aether-v4.0", desc: "Active", color: "text-violet-400", iconBg: "bg-violet-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(139,92,246,0.12)]", hoverBorder: "group-hover:border-violet-400/20" },
  { id: 3, label: "Memory", icon: Database, colSpan: "col-span-1", rowSpan: "row-span-1", content: "4.2 TB", desc: "Indexed", color: "text-amber-400", iconBg: "bg-amber-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(245,158,11,0.12)]", hoverBorder: "group-hover:border-amber-400/20" },
  { id: 4, label: "Recent Chats", icon: Clock, colSpan: "col-span-1 md:col-span-2", rowSpan: "row-span-2", content: "12 active sessions", desc: "View all history", color: "text-rose-400", iconBg: "bg-rose-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(244,63,94,0.10)]", hoverBorder: "group-hover:border-rose-400/20" },
  { id: 5, label: "Files", icon: Files, colSpan: "col-span-1", rowSpan: "row-span-1", content: "24 docs", desc: "Syncing...", color: "text-emerald-400", iconBg: "bg-emerald-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(52,211,153,0.10)]", hoverBorder: "group-hover:border-emerald-400/20" },
  { id: 6, label: "Knowledge Base", icon: BookOpen, colSpan: "col-span-1", rowSpan: "row-span-1", content: "Connected", desc: "Updated 2h ago", color: "text-teal-400", iconBg: "bg-teal-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(45,212,191,0.10)]", hoverBorder: "group-hover:border-teal-400/20" },
  { id: 7, label: "Workspace", icon: Layout, colSpan: "col-span-1", rowSpan: "row-span-1", content: "Team Alpha", desc: "4 members", color: "text-sky-400", iconBg: "bg-sky-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(56,189,248,0.10)]", hoverBorder: "group-hover:border-sky-400/20" },
  { id: 8, label: "Voice Assistant", icon: Mic, colSpan: "col-span-1", rowSpan: "row-span-1", content: "Listening", desc: "Tap to speak", color: "text-indigo-400", iconBg: "bg-indigo-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(129,140,248,0.10)]", hoverBorder: "group-hover:border-indigo-400/20" },
  { id: 9, label: "Prompt Library", icon: Library, colSpan: "col-span-1 md:col-span-2", rowSpan: "row-span-1", content: "145 Saved", desc: "Explore templates", color: "text-fuchsia-400", iconBg: "bg-fuchsia-400/10", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(232,121,249,0.10)]", hoverBorder: "group-hover:border-fuchsia-400/20" },
  { id: 10, label: "Settings", icon: Settings, colSpan: "col-span-1 md:col-span-2", rowSpan: "row-span-1", content: "System Preferences", desc: "Manage configuration", color: "text-white/50", iconBg: "bg-white/5", hoverGlow: "group-hover:shadow-[0_12px_40px_rgba(255,255,255,0.04)]", hoverBorder: "group-hover:border-white/10" },
];

export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[120px] gap-4 px-8 mb-8 z-10 relative">
      {BENTO_CARDS.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`glass-card p-5 flex flex-col justify-between cursor-pointer group ${card.colSpan} ${card.rowSpan} ${card.hoverGlow} ${card.hoverBorder}`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-full ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
              <card.icon size={20} className={card.color} strokeWidth={1.5} />
            </div>
            {index === 0 && <Zap size={14} className="text-cyan-400" />}
          </div>
          
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1 font-medium">{card.label}</p>
            <h3 className={`text-lg font-bold text-white transition-colors group-hover:${card.color}`}>{card.content}</h3>
            <p className="text-xs text-white/30 mt-1">{card.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
