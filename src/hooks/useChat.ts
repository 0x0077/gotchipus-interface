import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useCallback, useRef } from 'react';
import { getAuthHeaders } from '@/lib/auth';

interface ChatCallbacks {
  onData?: (data: any) => void;
  onText?: (text: string) => void;
  onThinking?: (text: string) => void;
  onAction?: (action: any) => void;
  onToolResult?: (data: { tool: string; success: boolean; data: any }) => void;
  onTextReplace?: (text: string) => void;
  onStatus?: (status: string) => void;
  onError?: (error: any) => void;
  onComplete?: (stopReason?: string) => void;
  onUserMessageStart?: (userMessageId: string) => void;
}

interface ChatPayload {
  msg: string;
  gotchi_id: number | null;
  account: string | null;
  conversation_id: string;
  is_new_conversation: boolean;
  session_active: boolean;
}

interface RegeneratePayload {
  gotchi_id: number | null;
  account: string | null;
  conversation_id: string;
  session_active: boolean;
}

interface EditPayload {
  gotchi_id: number | null;
  account: string | null;
  conversation_id: string;
  message_id: string;
  new_content: string;
  session_active: boolean;
}

interface ChatState {
  buffer: string;
  inThinkBlock: boolean;
}

const useChat = () => {
  const abortRef = useRef<AbortController | null>(null);

  const processSSEStream = useCallback(
    async (
      url: string,
      payload: ChatPayload | RegeneratePayload | EditPayload,
      callbacks?: ChatCallbacks
    ) => {
      // Abort any previous stream
      abortRef.current?.abort();

      let hasError = false;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let chatState: ChatState = { buffer: '', inThinkBlock: false };

      const processContent = (content: string): string => {
        chatState.buffer += content;

        let result = '';
        let tempBuffer = chatState.buffer;

        while (tempBuffer.length > 0) {
          if (!chatState.inThinkBlock) {
            const thinkStart = tempBuffer.indexOf('<think>');
            if (thinkStart === -1) {
              result += tempBuffer;
              tempBuffer = '';
              break;
            } else {
              result += tempBuffer.substring(0, thinkStart);
              tempBuffer = tempBuffer.substring(thinkStart);
              chatState.inThinkBlock = true;
            }
          }

          if (chatState.inThinkBlock) {
            const thinkEnd = tempBuffer.indexOf('</think>');
            if (thinkEnd === -1) {
              tempBuffer = '';
              break;
            } else {
              tempBuffer = tempBuffer.substring(thinkEnd + 8);
              chatState.inThinkBlock = false;
            }
          }
        }

        chatState.buffer = tempBuffer;
        return result;
      };

      try {
        await fetchEventSource(url, {
          signal: ctrl.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),

          onopen: async (res) => {
            if (!res.ok || !res.headers.get('content-type')?.includes('text/event-stream')) {
              hasError = true;
              throw new Error(`Unexpected response ${res.status}`);
            }
          },

          onmessage: async (ev) => {
            if (hasError) return;

            try {
              const eventData = JSON.parse(ev.data);

              switch (eventData.type) {
                case 'message_start':
                  break;

                case 'user_message_start':
                  if (eventData.user_message_id) {
                    callbacks?.onUserMessageStart?.(eventData.user_message_id);
                  }
                  break;

                case 'thinking':
                  if (eventData.message) {
                    callbacks?.onThinking?.(eventData.message);
                  }
                  break;

                case 'thinking_delta':
                  if (eventData.text) {
                    callbacks?.onThinking?.(eventData.text);
                  }
                  break;

                case 'text_delta':
                  if (eventData.text) {
                    const filteredContent = processContent(eventData.text);
                    if (filteredContent) {
                      callbacks?.onText?.(filteredContent);
                    }
                  }
                  break;

                case 'action':
                  if (eventData.action) {
                    callbacks?.onAction?.(eventData);
                  }
                  break;

                case 'text_replace':
                  callbacks?.onTextReplace?.(eventData.text || '');
                  break;

                case 'tool_result':
                  callbacks?.onToolResult?.(eventData);
                  break;

                case 'status':
                  if (eventData.message) {
                    callbacks?.onStatus?.(eventData.message);
                  }
                  break;

                case 'error':
                  hasError = true;
                  callbacks?.onError?.(new Error(eventData.message || 'Stream error'));
                  break;

                case 'message_stop':
                  callbacks?.onComplete?.(eventData.stop_reason);
                  break;

                default:
                  break;
              }
            } catch (parseError) {
            }
          },

          onerror(err) {
            hasError = true;
            callbacks?.onError?.(err);
            throw err;
          }
        });
      } catch (error) {
        hasError = true;
        callbacks?.onError?.(error);
      } finally {
        if (!hasError) {
          callbacks?.onComplete?.();
        }
        if (abortRef.current === ctrl) {
          abortRef.current = null;
        }
      }
    },
    [],
  );

  const send = useCallback(
    async (payload: ChatPayload, callbacks?: ChatCallbacks) => {
      return processSSEStream('/api/chat/stream', payload, callbacks);
    },
    [processSSEStream],
  );

  const regenerate = useCallback(
    async (payload: RegeneratePayload, callbacks?: ChatCallbacks) => {
      return processSSEStream('/api/chat/regenerate', payload, callbacks);
    },
    [processSSEStream],
  );

  const edit = useCallback(
    async (payload: EditPayload, callbacks?: ChatCallbacks) => {
      return processSSEStream('/api/chat/edit', payload, callbacks);
    },
    [processSSEStream],
  );

  const stop = useCallback(
    async (conversationId: string) => {
      abortRef.current?.abort();
      abortRef.current = null;

      try {
        const res = await fetch('/api/chat/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ conversation_id: conversationId }),
        });
        return res.json();
      } catch (error) {
        return { code: 1, status: 'error' };
      }
    },
    [],
  );

  return { send, regenerate, edit, stop };
};

export default useChat;
export type { ChatPayload, RegeneratePayload, EditPayload, ChatCallbacks };
