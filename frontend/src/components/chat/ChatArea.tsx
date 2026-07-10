"use client";

import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "./ChatWorkspace";
import { useEffect, useRef, useCallback } from "react";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatArea({ messages, isLoading }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    // Find the scrollable parent (the overflow-y-auto container in ChatWorkspace)
    const scrollParent = containerRef.current?.closest('.overflow-y-auto');
    if (scrollParent) {
      scrollParent.scrollTo({
        top: scrollParent.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  return (
    <div ref={containerRef} className="flex-1 px-10 pb-6 pt-6 relative z-10 space-y-12 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-10">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "flex gap-6 w-full group",
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-2xl relative",
              message.role === "user" 
                ? "bg-gradient-to-tr from-violet-600 to-cyan-400" 
                : "bg-[#06060A] border-[1px] border-white/[0.08] backdrop-blur-md"
            )}>
              {message.role === "user" ? (
                <User size={20} className="text-white" strokeWidth={2} />
              ) : (
                <>
                  <Sparkles size={20} className="text-violet-400" strokeWidth={2} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#06060A]" />
                </>
              )}
            </div>

            {/* Message Bubble */}
            <div className={cn(
              "px-8 py-5 rounded-[28px] max-w-[75%] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-2xl border text-[16px] font-medium leading-relaxed tracking-wide transition-all duration-300",
              message.role === "user"
                ? "bg-gradient-to-br from-violet-500/12 to-cyan-500/5 border-violet-500/20 text-white rounded-tr-[8px] hover:shadow-[0_12px_40px_0_rgba(139,92,246,0.15)]"
                : "bg-white/[0.03] border-white/[0.06] text-white/90 rounded-tl-[8px] whitespace-pre-wrap hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.4)]"
            )}>
              {message.content}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex gap-6 w-full flex-row"
          >
            <div className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-2xl relative bg-[#06060A] border-[1px] border-white/[0.08] backdrop-blur-md">
              <Sparkles size={20} className="text-violet-400 animate-pulse" strokeWidth={2} />
            </div>
            
            <div className="px-8 py-6 rounded-[28px] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-2xl border bg-white/[0.03] border-white/[0.06] rounded-tl-[8px] flex items-center gap-2">
              <motion.span 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="w-2.5 h-2.5 bg-violet-400 rounded-full" 
              />
              <motion.span 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-2.5 h-2.5 bg-cyan-400 rounded-full" 
              />
              <motion.span 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-2.5 h-2.5 bg-rose-400 rounded-full" 
              />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
