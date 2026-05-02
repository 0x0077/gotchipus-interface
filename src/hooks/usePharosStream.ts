import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useCallback, useRef } from 'react';
import { getAuthHeaders } from '@/lib/auth';
import type { PharosMode } from '@/lib/pharos-world-api';

export interface PharosToolResultEvent {
  tool: string;
  success: boolean;
  data: Record<string, unknown> & { outcome?: string };
}

export interface PharosStreamCallbacks {
  onMessageStart?: (messageId: string) => void;
  onTextDelta?: (text: string) => void;
  /** Server tells us to replace the entire streaming text buffer (not append).
   *  Used when the model leaks preamble before a tool call — the backend
   *  emits `text_replace` with empty string, then round 2 streams the real
   *  narration via `text_delta`. */
  onTextReplace?: (text: string) => void;
  onToolResult?: (ev: PharosToolResultEvent) => void;
  onError?: (err: unknown) => void;
  onComplete?: (stopReason?: string) => void;
}

export interface PharosStreamPayload {
  conversation_id: string;
  mode: PharosMode;
  text: string;
}

// Strip `<think>...</think>` blocks from a streaming text feed. Mirrors the
// chat client's filter (see `useChat.ts::processContent`) — the GM is told to
// wrap any internal reasoning in think tags (`hard-rules.md` rule 8) so the
// player never sees self-correction or "Let me narrate…" scaffolding.
//
// Maintains state across chunks: the open `<think>` may straddle a chunk
// boundary, so we keep an `inThinkBlock` flag and a small carry-over buffer
// for partial tag matches.
interface ThinkFilterState {
  inBlock: boolean;
  carry: string; // partial tag chars held back to the next chunk
}

function makeThinkFilter() {
  const state: ThinkFilterState = { inBlock: false, carry: '' };
  return (chunk: string): string => {
    let buf = state.carry + chunk;
    state.carry = '';
    let out = '';
    while (buf.length > 0) {
      if (!state.inBlock) {
        const open = buf.indexOf('<think>');
        if (open === -1) {
          // Hold back trailing chars that could be the start of `<think>`.
          const tail = Math.min(7, buf.length);
          state.carry = buf.slice(buf.length - tail).startsWith('<') ? buf.slice(buf.length - tail) : '';
          out += state.carry ? buf.slice(0, buf.length - state.carry.length) : buf;
          buf = '';
          break;
        }
        out += buf.slice(0, open);
        buf = buf.slice(open + 7);
        state.inBlock = true;
      } else {
        const close = buf.indexOf('</think>');
        if (close === -1) {
          // Inside an open think block — drop everything but hold back partial closer.
          const tail = Math.min(8, buf.length);
          state.carry = buf.slice(buf.length - tail).startsWith('<') ? buf.slice(buf.length - tail) : '';
          buf = '';
          break;
        }
        buf = buf.slice(close + 8);
        state.inBlock = false;
      }
    }
    return out;
  };
}

const usePharosStream = () => {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (payload: PharosStreamPayload, callbacks?: PharosStreamCallbacks) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      let hasError = false;
      const filterThink = makeThinkFilter();

      // `onComplete` is non-idempotent in PharosWorldContent (it appends a
      // narrator message). The fetchEventSource lifecycle naturally calls
      // it twice — once on the `message_stop` SSE event, once again in the
      // `finally` block when the Promise resolves — so we gate it locally.
      // Without this, the assistant message renders twice for a brief
      // window before /state hydration overwrites both.
      let completed = false;
      const fireComplete = (reason?: string) => {
        if (completed) return;
        completed = true;
        callbacks?.onComplete?.(reason);
      };

      try {
        await fetchEventSource('/api/pharos-world/stream', {
          signal: ctrl.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
          openWhenHidden: true,

          onopen: async (res) => {
            if (!res.ok || !res.headers.get('content-type')?.includes('text/event-stream')) {
              hasError = true;
              throw new Error(`Unexpected response ${res.status}`);
            }
          },

          onmessage: (ev) => {
            if (hasError) return;
            try {
              const data = JSON.parse(ev.data);
              switch (data.type) {
                case 'message_start':
                  if (data.message_id) callbacks?.onMessageStart?.(data.message_id);
                  break;
                case 'text_delta':
                  if (typeof data.text === 'string' && data.text.length > 0) {
                    const filtered = filterThink(data.text);
                    if (filtered.length > 0) callbacks?.onTextDelta?.(filtered);
                  }
                  break;
                case 'text_replace':
                  callbacks?.onTextReplace?.(typeof data.text === 'string' ? data.text : '');
                  break;
                case 'tool_result':
                  callbacks?.onToolResult?.({
                    tool: data.tool,
                    success: !!data.success,
                    data: data.data ?? {},
                  });
                  break;
                case 'error':
                  hasError = true;
                  callbacks?.onError?.(new Error(data.message || 'Stream error'));
                  break;
                case 'message_stop':
                  fireComplete(data.stop_reason);
                  break;
                default:
                  break;
              }
            } catch {
              // ignore malformed event lines
            }
          },

          onerror(err) {
            hasError = true;
            callbacks?.onError?.(err);
            throw err;
          },
        });
      } catch (err) {
        hasError = true;
        callbacks?.onError?.(err);
      } finally {
        if (!hasError) {
          fireComplete();
        }
        if (abortRef.current === ctrl) {
          abortRef.current = null;
        }
      }
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { stream, stop };
};

export default usePharosStream;
