"use client";

import { useState, RefObject } from "react";
import { useTranslation } from "react-i18next";
import ChatIcon from "@assets/icons/ChatIcon";
import ActivityIcon from "@assets/icons/ActivityIcon";
import HooksIcon from "@assets/icons/HooksIcon";
import { ChatTab } from "./ChatTab";
import { ActivityTab } from "./ActivityTab";
import { HooksTab } from "./HooksTab";
import type { Conversation } from "@/lib/conversation-api";

export type { Message } from "./ChatTab";

type SessionStatus = "none" | "active" | "expired" | null;

interface SidebarProps {
  messages: import("./ChatTab").Message[];
  chatInput: string;
  setChatInput: (value: string) => void;
  handleSendChat: (msg?: string) => void;
  chatEndRef: RefObject<HTMLDivElement>;
  status: "idle" | "streaming";
  selectedGotchi: string | null;
  selectedGotchiName: string | null;
  selectedTbaAddress?: string | null;
  sessionStatus?: SessionStatus;
  sessionDaysLeft?: number;
  sessionExpiresAt?: number;
  onOpenSetup?: () => void;
  onRegenerate?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onStopStreaming?: () => void;
  // Conversation management
  currentConversationName?: string | null;
  conversations?: Conversation[];
  currentConversationId?: string;
  onSwitchConversation?: (id: string) => void;
  onNewConversation?: () => void;
  onRenameConversation?: (id: string, name: string) => Promise<any>;
  onDeleteConversation?: (id: string) => Promise<any>;
  onStarConversation?: (id: string, starred: boolean) => Promise<any>;
  onPinConversation?: (id: string, pinned: boolean) => Promise<any>;
  onDeleteMessage?: (messageId: string) => Promise<any>;
  onLoadConversations?: (page?: number) => void;
  onLoadMoreConversations?: () => void;
  hasMoreConversations?: boolean;
  isLoadingConversations?: boolean;
}

type TabId = "chat" | "activity" | "hooks";

export function TerminalSidebar({
  messages,
  chatInput,
  setChatInput,
  handleSendChat,
  chatEndRef,
  status,
  onRegenerate,
  onEditMessage,
  onStopStreaming,
  selectedGotchi,
  selectedGotchiName,
  selectedTbaAddress,
  sessionStatus,
  sessionDaysLeft = 0,
  sessionExpiresAt = 0,
  onOpenSetup,
  currentConversationName,
  conversations,
  currentConversationId,
  onSwitchConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onStarConversation,
  onPinConversation,
  onDeleteMessage,
  onLoadConversations,
  onLoadMoreConversations,
  hasMoreConversations,
  isLoadingConversations,
}: SidebarProps) {
  const { t } = useTranslation();
  const [sideTab, setSideTab] = useState<TabId>("chat");

  const SIDE_TABS: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: "chat", icon: <ChatIcon width={12} height={12} />, label: t('terminal.sidebar.chat') },
    { id: "activity", icon: <ActivityIcon width={12} height={12} />, label: t('terminal.sidebar.activity') },
    { id: "hooks", icon: <HooksIcon width={12} height={12} />, label: t('terminal.sidebar.hooks') },
  ];

  return (
    <div className="flex-[1] border-l-2 border-[#808080] bg-win98-face flex flex-col flex-shrink-0 overflow-hidden">
      {/* Top Tabs */}
      <div className="flex items-end bg-win98-face px-1.5 pt-1.5 pb-1 gap-0.5">
        {SIDE_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSideTab(t.id)}
            className={`px-3 py-1 text-xs font-bold transition-all flex items-center gap-1.5 border-2 ${
              sideTab === t.id
                ? "border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white text-[#000080] shadow-win98-inner"
                : "border-[#808080] shadow-win98-outer bg-win98-face text-[#000000] hover:bg-[#b0b0b0] active:shadow-win98-inner"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden border-t-2 border-[#808080] mt-[-2px]">
        {sideTab === "chat" && (
          <ChatTab
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChat={handleSendChat}
            chatEndRef={chatEndRef}
            status={status}
            onRegenerate={onRegenerate}
            onEditMessage={onEditMessage}
            onStopStreaming={onStopStreaming}
            currentConversationName={currentConversationName}
            selectedGotchi={selectedGotchi}
            selectedGotchiName={selectedGotchiName}
            sessionStatus={sessionStatus}
            sessionDaysLeft={sessionDaysLeft}
            sessionExpiresAt={sessionExpiresAt}
            onOpenSetup={onOpenSetup}
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSwitchConversation={onSwitchConversation}
            onNewConversation={onNewConversation}
            onRenameConversation={onRenameConversation}
            onDeleteConversation={onDeleteConversation}
            onStarConversation={onStarConversation}
            onPinConversation={onPinConversation}
            onDeleteMessage={onDeleteMessage}
            onLoadConversations={onLoadConversations}
            onLoadMoreConversations={onLoadMoreConversations}
            hasMoreConversations={hasMoreConversations}
            isLoadingConversations={isLoadingConversations}
          />
        )}
        {sideTab === "activity" && <ActivityTab tbaAddress={selectedTbaAddress || null} />}
        {sideTab === "hooks" && <HooksTab selectedGotchi={selectedGotchi} />}
      </div>
    </div>
  );
}
