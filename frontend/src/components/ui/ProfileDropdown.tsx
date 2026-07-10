"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Edit3, Check, MessageSquare } from "lucide-react";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  name: string;
  role: string;
}

const DEFAULT_PROFILE: ProfileData = { name: "Alex V.", role: "Admin" };

export function getProfile(): ProfileData {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const saved = localStorage.getItem("aether-profile");
    if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PROFILE;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load data on open
  useEffect(() => {
    if (isOpen) {
      const p = getProfile();
      setProfile(p);
      setEditName(p.name);
      setEditRole(p.role);
      setIsEditing(false);

      fetch("/api/sessions")
        .then((res) => res.json())
        .then((data) => setSessionCount(Array.isArray(data) ? data.length : 0))
        .catch(() => setSessionCount(0));
    }
  }, [isOpen]);

  // Outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleSave = () => {
    const newProfile = { name: editName.trim() || "User", role: editRole.trim() || "Member" };
    localStorage.setItem("aether-profile", JSON.stringify(newProfile));
    setProfile(newProfile);
    setIsEditing(false);
    window.dispatchEvent(new CustomEvent("PROFILE_UPDATED", { detail: newProfile }));
  };

  const handleSignOut = () => {
    localStorage.removeItem("aether-settings");
    localStorage.removeItem("aether-profile");
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-full right-0 mt-3 w-[300px] bg-[#0E0E14]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[90]"
        >
          {/* Profile Header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-500 via-cyan-400 to-rose-500 p-[2px] shadow-[0_4px_15px_rgba(139,92,246,0.25)]">
                <div className="w-full h-full rounded-full bg-[#0E0E14] flex items-center justify-center">
                  <span className="text-sm font-extrabold text-white">{getInitials(profile.name)}</span>
                </div>
              </div>

              {/* Info */}
              {isEditing ? (
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[10px] px-3 py-1.5 text-[13px] text-white font-semibold outline-none focus:border-violet-500/30"
                    placeholder="Your name"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[10px] px-3 py-1.5 text-[11px] text-white/60 font-medium outline-none focus:border-violet-500/30"
                    placeholder="Your role"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-white">{profile.name}</p>
                  <p className="text-[11px] text-white/40 font-medium mt-0.5">{profile.role}</p>
                </div>
              )}

              {/* Edit/Save button */}
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className={`p-2 rounded-full transition-all ${
                  isEditing
                    ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "hover:bg-white/[0.06] text-white/30 hover:text-white"
                }`}
              >
                {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 text-white/40">
              <div className="flex items-center gap-2 bg-white/[0.03] rounded-[12px] px-3 py-2 flex-1">
                <MessageSquare size={14} className="text-cyan-400" />
                <div>
                  <p className="text-[16px] font-bold text-white">{sessionCount}</p>
                  <p className="text-[10px] text-white/25 font-medium">Total Sessions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-white/40 hover:bg-rose-500/5 hover:text-rose-400 transition-all text-left"
            >
              <LogOut size={16} />
              <span className="text-[13px] font-medium">Sign Out</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
