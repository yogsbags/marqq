import { Sidebar } from './Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Conversation } from '@/types/chat';

interface MainLayoutProps {
  children: React.ReactNode;
  selectedModule: string | null;
  onModuleSelect: (moduleId: string | null) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onConversationsChange: () => void;
  chatOpen: boolean;
  onChatOpenChange: (open: boolean) => void;
  firstSessionBanner?: React.ReactNode;
}

export function MainLayout({
  children,
  selectedModule,
  onModuleSelect,
  conversations,
  activeConversationId,
  onConversationSelect,
  onConversationsChange,
  chatOpen,
  onChatOpenChange,
  firstSessionBanner,
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isHomeView = !selectedModule || selectedModule === 'home';

  return (
    <div className="flex min-h-[100dvh] bg-background overflow-hidden">
      {/* Left: Sidebar */}
      <Sidebar
        selectedModule={selectedModule}
        onModuleSelect={onModuleSelect}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onConversationSelect={onConversationSelect}
      />

      {/* Center: Main content — margin tracks sidebar width only */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out",
        sidebarCollapsed ? "ml-14" : "ml-60"
      )}>
        <DashboardHeader
          selectedModule={selectedModule}
          onModuleSelect={onModuleSelect}
          onOpenChat={() => onChatOpenChange(true)}
        />

        <main className="flex-1 overflow-auto pt-4">
          {firstSessionBanner}
          {/* key forces remount on route change → triggers enter animation */}
          <div
            key={selectedModule ?? 'home'}
            className={cn(
              "h-full page-enter page-enter-soft",
              !isHomeView && "w-full px-6 pb-8"
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Right: Chat Drawer (persistent, mounted always) */}
      <ChatDrawer
        open={chatOpen}
        onOpenChange={onChatOpenChange}
        onModuleSelect={onModuleSelect}
        onConversationsChange={onConversationsChange}
      />
    </div>
  );
}
