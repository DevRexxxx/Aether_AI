import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden flex bg-transparent">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <Header />
        
        {/* Workspace handles the BentoGrid, ChatArea and Input state */}
        <ChatWorkspace />
      </div>
    </main>
  );
}
