import type { RefObject } from "react";
import type { Conversation } from "@/lib/conversation-api";

export interface ToolStep {
  tool: string;
  params?: any;
  status: "running" | "success" | "error";
  result?: any;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  isCallTools?: boolean;
  agentIndex?: number;
  data?: any;
  isLoading?: boolean;
  isStreaming?: boolean;
  thinking?: string;
  isThinking?: boolean;
  toolSteps?: ToolStep[];
}

export type SessionStatus = "none" | "active" | "expired" | null;

export interface Turn {
  id: string;
  user?: Message;
  assistants: Message[];
}

export interface SlashCommand {
  cmd: string;
  descKey: string;
  hint: string;
  native: boolean;
}

export interface ChatTabProps {
  messages: Message[];
  chatInput: string;
  setChatInput: (value: string) => void;
  handleSendChat: (msg?: string) => void;
  chatEndRef: RefObject<HTMLDivElement>;
  status?: "idle" | "streaming";
  onRegenerate?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onStopStreaming?: () => void;
  currentConversationName?: string | null;
  selectedGotchi: string | null;
  selectedGotchiName: string | null;
  sessionStatus?: SessionStatus;
  sessionDaysLeft?: number;
  sessionExpiresAt?: number;
  onOpenSetup?: () => void;
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
