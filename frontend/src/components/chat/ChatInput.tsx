"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Mic, ArrowRight, Sparkles, X, FileText, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

interface ChatInputProps {
  onSend: (message: string, context?: string) => void;
  isLoading: boolean;
  suggestions?: string[];
}

export function ChatInput({ onSend, isLoading, suggestions = [] }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [attachedText, setAttachedText] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsTranscribing(true);

        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Transcription failed");
          
          const data = await response.json();
          if (data.text) {
            setInputValue((prev) => (prev ? prev + " " + data.text : data.text));
          }
        } catch (error) {
          console.error("Error transcribing audio:", error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && !isLoading && !isUploading) {
      onSend(inputValue.trim(), attachedText || undefined);
      setInputValue("");
      setAttachedText(null);
      setAttachedFileName(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("File upload failed");
      
      const data = await response.json();
      if (data.text) {
        setAttachedText(data.text);
        setAttachedFileName(file.name);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to parse document. Ensure it is a supported file type (PDF, DOCX, TXT, CSV).");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="w-full flex justify-center px-10 pointer-events-none">
      <div className="w-full max-w-[800px] relative pointer-events-auto flex flex-col items-center">
        
        {/* Prompt Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3 mb-6 justify-center flex-wrap"
            >
              {suggestions.map((suggestion, idx) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (!isLoading) onSend(suggestion);
                  }}
                  className="px-5 py-2.5 rounded-full glass-card text-[13px] font-bold text-white/70 hover:text-white hover:border-[#FF5D00]/50 hover:bg-[#FF5D00]/5 transition-all shadow-lg"
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attached File Indicator */}
        <AnimatePresence>
          {attachedFileName && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-4 flex items-center gap-2 bg-[#FF5D00]/10 border border-[#FF5D00]/30 px-4 py-2 rounded-full text-white/90 text-sm shadow-lg backdrop-blur-md"
            >
              <FileText size={16} className="text-[#FF5D00]" />
              <span className="font-medium truncate max-w-[200px]">{attachedFileName}</span>
              <button 
                onClick={() => { setAttachedText(null); setAttachedFileName(null); }}
                className="ml-2 p-1 hover:bg-[#FF5D00]/20 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Animated Gradient Border Wrapper */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative rounded-[32px] w-full group"
        >
          {/* Rotating Conic Gradient Border via CSS Animation */}
          <div className="absolute -inset-[2px] rounded-[34px] bg-[conic-gradient(from_0deg,#FF5D00,#9333ea,#3b82f6,#FF5D00)] opacity-40 group-hover:opacity-100 blur-[2px] transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />
          
          {/* Inner Content (The actual input box) */}
          <div className="relative z-10 flex items-center gap-3 bg-black/70 backdrop-blur-[24px] rounded-[32px] p-2 pl-3 w-full border border-white/5">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept=".txt,.pdf,.csv,.md,.json,.doc,.docx" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className={`p-3.5 rounded-full transition-colors ${isUploading ? "animate-pulse text-[#FF5D00]" : "hover:bg-white/10 text-white/50 hover:text-white"}`}
            >
              {isUploading ? <Loader2 size={22} className="animate-spin" /> : <Paperclip size={22} strokeWidth={1.5} />}
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isTranscribing || isRecording}
              placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : "Ask anything..."}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 font-medium text-[17px] py-4 disabled:opacity-50"
            />
            
            <button 
              onClick={toggleRecording}
              disabled={isLoading || isTranscribing}
              className={`p-3.5 rounded-full transition-all ${isRecording ? "bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" : "hover:bg-white/10 text-white/50 hover:text-white"}`}
            >
              <Mic size={22} strokeWidth={1.5} />
            </button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim() || isRecording || isTranscribing || isUploading}
              className="p-4 rounded-full bg-[#FF5D00] hover:bg-[#FF5D00]/90 transition-all text-white shadow-[0_0_20px_rgba(255,93,0,0.4)] disabled:opacity-50 disabled:shadow-none ml-1 flex items-center justify-center group-focus-within:shadow-[0_0_30px_rgba(255,93,0,0.6)]"
            >
              <ArrowRight size={22} strokeWidth={2} />
            </motion.button>
          </div>
        </motion.div>
        
        {/* Subtle bottom text */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-5 flex items-center justify-center gap-1.5"
        >
          <Sparkles size={12} className="text-[#FF5D00]" />
          <span className="text-[10px] text-white/30 font-bold tracking-[0.2em] uppercase">Aether-v5.0 Spatial Engine Active</span>
        </motion.div>
      </div>
    </div>
  );
}

