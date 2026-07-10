"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Bell, Settings, Command } from "lucide-react";
import { motion } from "framer-motion";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { NotificationsPanel, useNotificationCount } from "@/components/ui/NotificationsPanel";
import { SettingsModal } from "@/components/ui/SettingsModal";
import { ProfileDropdown, getProfile, getInitials } from "@/components/ui/ProfileDropdown";

export function Header() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: "Alex V.", role: "Admin" });
  const unreadCount = useNotificationCount();

  // Load profile from localStorage
  useEffect(() => {
    setProfile(getProfile());

    const handleProfileUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setProfile(detail);
    };
    window.addEventListener("PROFILE_UPDATED", handleProfileUpdate);
    return () => window.removeEventListener("PROFILE_UPDATED", handleProfileUpdate);
  }, []);

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close notifications when marking all read
  const handleNotificationsClose = useCallback(() => {
    setNotificationsOpen(false);
    window.dispatchEvent(new CustomEvent("NOTIFICATIONS_READ"));
  }, []);

  return (
    <>
      <header className="h-24 px-10 flex items-center justify-between z-40 bg-transparent relative pointer-events-none w-full">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-5 pointer-events-auto"
        >
          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">Workspace</h1>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)] flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Pro Plan
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-6 pointer-events-auto"
        >
          {/* Search — opens Command Palette */}
          <div 
            className="relative group cursor-pointer"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-violet-400 transition-colors" size={16} />
            <div className="w-72 bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-[20px] pl-11 pr-12 py-2.5 text-[14px] font-medium text-white/30 select-none hover:border-violet-500/20 hover:bg-white/[0.05] transition-all">
              Search commands...
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
              <Command size={14} className="text-white" />
              <span className="text-xs font-bold text-white">K</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                className="p-3 rounded-full hover:bg-white/[0.06] text-white/50 hover:text-white transition-all hover:scale-105 relative"
              >
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-rose-500 rounded-full border-[1.5px] border-[#06060A] shadow-[0_0_8px_rgba(244,63,94,0.8)] flex items-center justify-center px-1">
                    <span className="text-[9px] font-bold text-white leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </span>
                )}
              </button>
              <NotificationsPanel isOpen={notificationsOpen} onClose={handleNotificationsClose} />
            </div>
            
            {/* Settings */}
            <button 
              onClick={() => setSettingsOpen(true)}
              className="p-3 rounded-full hover:bg-white/[0.06] text-white/50 hover:text-white transition-all hover:scale-105"
            >
              <Settings size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Profile */}
          <div className="relative">
            <div 
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-4 pl-6 border-l border-white/5 cursor-pointer group"
            >
              <div className="text-right flex flex-col justify-center">
                <p className="text-[14px] font-bold text-white group-hover:text-violet-400 transition-colors leading-tight">{profile.name}</p>
                <p className="text-[11px] text-white/40 font-medium mt-0.5">{profile.role}</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-500 via-cyan-400 to-rose-500 p-[2px] shadow-[0_4px_15px_rgba(139,92,246,0.25)] group-hover:shadow-[0_4px_20px_rgba(139,92,246,0.45)] transition-all">
                <div className="w-full h-full rounded-full bg-[#06060A] flex items-center justify-center border-2 border-[#06060A] overflow-hidden">
                  <span className="text-sm font-extrabold text-white">{getInitials(profile.name)}</span>
                </div>
              </div>
            </div>
            <ProfileDropdown isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
          </div>
        </motion.div>
      </header>

      {/* Full-screen modals rendered outside header */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
