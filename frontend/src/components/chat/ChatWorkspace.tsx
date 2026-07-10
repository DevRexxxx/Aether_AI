"use client";

import { useState, useEffect, useMemo } from "react";
import { BentoGrid } from "./../dashboard/BentoGrid";
import { ChatArea } from "./ChatArea";
import { ChatInput } from "./ChatInput";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatWorkspace() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const handleSelected = async (e: Event) => {
      const id = (e as CustomEvent).detail;
      setSessionId(id);
      setMessages([]);
      setIsLoading(true);
      const res = await fetch(`/api/sessions/${id}/messages`);
      if (res.ok) {
        setMessages(await res.json());
      }
      setIsLoading(false);
    };

    window.addEventListener("SESSION_SELECTED", handleSelected);
    return () => window.removeEventListener("SESSION_SELECTED", handleSelected);
  }, []);

  const handleSend = async (content: string) => {
    let currentSessionId = sessionId;
    
    if (!currentSessionId) {
      try {
        const createRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.slice(0, 30) + (content.length > 30 ? "..." : "") }),
        });
        if (createRes.ok) {
          const newSession = await createRes.json();
          currentSessionId = newSession.id;
          setSessionId(currentSessionId);
          window.dispatchEvent(new CustomEvent("SESSION_CREATED", { detail: currentSessionId }));
        } else {
          throw new Error("Failed to create session");
        }
      } catch (err) {
        alert("Could not create a new chat session automatically.");
        return;
      }
    }

    const tempId = Math.random().toString(36).substring(7);
    const userMsg: Message = { id: tempId, role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content, sessionId: currentSessionId }),
      });

      if (!res.ok) throw new Error("Failed to get response");
      
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: data.messageId || Math.random().toString(), role: "assistant", content: data.response }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(), role: "assistant", content: "Error connecting to backend engine." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicSuggestions = useMemo(() => {
    if (messages.length === 0) return [];
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || "";
    
    if (lastUserMessage.includes("code") || lastUserMessage.includes("program") || lastUserMessage.includes("function")) {
      return ["Can you add error handling?", "Explain how this works step by step", "Can you optimize this code?"];
    }
    if (lastUserMessage.includes("write") || lastUserMessage.includes("story") || lastUserMessage.includes("essay")) {
      return ["Make it more descriptive", "Can you shorten this?", "Write a different version"];
    }
    if (lastUserMessage.includes("explain") || lastUserMessage.includes("what is") || lastUserMessage.includes("how does")) {
      return ["Can you give me an example?", "Explain it like I'm five", "What are the practical applications?"];
    }
    if (lastUserMessage.includes("math") || lastUserMessage.includes("calculate") || lastUserMessage.includes("solve")) {
      return ["Show me the step-by-step solution", "Can you graph this?", "What formula did you use?"];
    }
    
    return ["Tell me more about this", "Can you summarize that?", "What else should I know?"];
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto flex flex-col relative z-10 pb-10 hide-scrollbar">
        <div className="max-w-6xl mx-auto w-full flex flex-col pt-4">
          {!sessionId && <BentoGrid />}
          {sessionId && <ChatArea messages={messages} isLoading={isLoading} />}
        </div>
      </div>
      <div className="w-full pb-10 pt-4 bg-transparent z-50 relative shrink-0">
        <ChatInput onSend={handleSend} isLoading={isLoading} suggestions={dynamicSuggestions} />
      </div>
    </div>
  );
}
