import { getAuthHeaders } from '@/lib/auth';

export interface Conversation {
  id: string;
  user_id: string;
  name: string;
  summary: string;
  model: string;
  status: string;
  is_starred: boolean;
  is_pinned: boolean;
  current_leaf_message_id: string | null;
  message_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PersistedToolStep {
  tool: string;
  params?: unknown;
  status: 'running' | 'success' | 'error';
  result?: unknown;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  text_content: string;
  parent_message_id: string | null;
  index: number;
  status: 'completed' | 'pending' | 'streaming' | 'error' | 'cancelled';
  error_message: string | null;
  model: string;
  stop_reason: string | null;
  thinking: string | null;
  created_at: string;
  /** Populated for assistant messages that ran tools. Written by chat_engine
   *  at stream end (and on user-cancelled stops) as `{ tool_steps: [...] }`. */
  attachments?: { tool_steps?: PersistedToolStep[] } | null;
}

interface ApiResponse<T = unknown> {
  code: number;
  status: string;
  data?: T;
  message?: string;
}

async function postJson<T = unknown>(url: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function fetchConversations(page = 0) {
  return postJson<Conversation[]>('/api/chat/conversations', { page });
}

export async function renameConversation(conversationId: string, name: string) {
  return postJson('/api/chat/conversations/rename', { conversation_id: conversationId, name });
}

export async function deleteConversation(conversationId: string) {
  return postJson('/api/chat/conversations/delete', { conversation_id: conversationId });
}

export async function starConversation(conversationId: string, starred: boolean) {
  return postJson('/api/chat/conversations/star', { conversation_id: conversationId, starred });
}

export async function pinConversation(conversationId: string, pinned: boolean) {
  return postJson('/api/chat/conversations/pin', { conversation_id: conversationId, pinned });
}

export async function fetchConversationMessages(conversationId: string, page = 0) {
  return postJson<ConversationMessage[]>('/api/chat/conversations/messages', { conversation_id: conversationId, page });
}

export async function deleteMessage(messageId: string) {
  return postJson('/api/chat/messages/delete', { message_id: messageId });
}
