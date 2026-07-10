"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, Mic, Check, X } from "lucide-react";

export interface Notification {
  id: string;
  title: string;
  description: string;
  icon: "session" | "ai" | "voice";
  timestamp: Date;
  read: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP = {
  session: <MessageSquare size={16} className="text-cyan-400" />,
  ai: <Sparkles size={16} className="text-violet-400" />,
  voice: <Mic size={16} className="text-orange-400" />,
};

const ICON_BG_MAP = {
  session: "bg-cyan-400/10",
  ai: "bg-violet-400/10",
  voice: "bg-orange-400/10",
};

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Listen for app events
  useEffect(() => {
    const handleSessionCreated = () => {
      addNotification("New session started", "A new chat session has been created.", "session");
    };
    const handleAIResponse = () => {
      addNotification("Aether responded", "Your AI assistant has generated a response.", "ai");
    };
    const handleTranscription = () => {
      addNotification("Voice transcribed", "Your audio has been transcribed successfully.", "voice");
    };

    window.addEventListener("SESSION_CREATED", handleSessionCreated);
    window.addEventListener("AI_RESPONSE", handleAIResponse);
    window.addEventListener("TRANSCRIPTION_DONE", handleTranscription);

    return () => {
      window.removeEventListener("SESSION_CREATED", handleSessionCreated);
      window.removeEventListener("AI_RESPONSE", handleAIResponse);
      window.removeEventListener("TRANSCRIPTION_DONE", handleTranscription);
    };
  }, []);

  const addNotification = (title: string, description: string, icon: Notification["icon"]) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(7),
      title,
      description,
      icon,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-full right-0 mt-3 w-[380px] bg-[#0E0E14]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[90]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] font-medium text-white/40 hover:text-violet-400 transition-colors flex items-center gap-1"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto hide-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Sparkles size={24} className="text-white/10 mx-auto mb-3" />
                <p className="text-[13px] text-white/25 font-medium">No notifications yet</p>
                <p className="text-[11px] text-white/15 mt-1">Events will appear here as you use Aether</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 px-5 py-3.5 transition-all group hover:bg-white/[0.02] ${
                    !notif.read ? "bg-violet-500/[0.03]" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 ${ICON_BG_MAP[notif.icon]}`}>
                    {ICON_MAP[notif.icon]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] font-semibold truncate ${!notif.read ? "text-white" : "text-white/60"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-white/30 mt-0.5 truncate">{notif.description}</p>
                    <p className="text-[10px] text-white/15 mt-1 font-medium">{formatTime(notif.timestamp)}</p>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => dismissNotification(notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-all flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export a hook to get unread count externally
export function useNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const increment = () => setCount((c) => c + 1);
    const reset = () => setCount(0);

    window.addEventListener("SESSION_CREATED", increment);
    window.addEventListener("AI_RESPONSE", increment);
    window.addEventListener("TRANSCRIPTION_DONE", increment);
    window.addEventListener("NOTIFICATIONS_READ", reset);

    return () => {
      window.removeEventListener("SESSION_CREATED", increment);
      window.removeEventListener("AI_RESPONSE", increment);
      window.removeEventListener("TRANSCRIPTION_DONE", increment);
      window.removeEventListener("NOTIFICATIONS_READ", reset);
    };
  }, []);

  return count;
}
