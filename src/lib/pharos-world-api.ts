import { getAuthHeaders } from '@/lib/auth';

// ── enums ──────────────────────────────────────────────────────────────

export type PharosFaction = 'combat' | 'defense' | 'technology';
export type PharosMode = 'do' | 'say' | 'story' | 'look';
export type PharosMsgRole = 'player' | 'narrator' | 'system' | 'tool_result';
export type PharosDialogState = 'initial' | 'acquainted' | 'befriended';

// ── DTOs (mirror gotchi-rs/src/core/pharos_world/session.rs serde shapes) ──

export interface PharosSession {
  id: number;
  conversation_id: string;
  user_id: string;
  gotchi_id: string;
  location: string;
  hp: number;
  energy: number;
  morale: number;
  focus: number;
  visited_locations: string[];
  flags: Record<string, unknown>;
  started_at: string;
  last_active_at: string;
  completed: boolean;
}

export interface PharosMessage {
  id?: number;
  session_id: number;
  role: PharosMsgRole;
  mode?: PharosMode | null;
  content: string;
  tool_calls: unknown[];
  location?: string | null;
  created_at?: string | null;
}

export interface PharosNpcState {
  id?: number;
  session_id: number;
  npc_id: string;
  rapport: number;
  dialog_state: PharosDialogState;
  last_topic?: string | null;
  encounter_count: number;
  awarded_items: string[];
  summary_md: string;
}

export interface PharosRoomBrief {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Map of `direction → target_room_id` (e.g. `{ north: 'lighthouse_chapel' }`). */
  exits: Record<string, string>;
  present_npcs: string[];
  shop_id?: string | null;
}

export interface PharosStartResponse {
  conversation_id: string;
  session_id: number;
  starting_room: string;
  opening_narration: string;
}

export interface PharosStateResponse {
  session: PharosSession;
  messages: PharosMessage[];
  npc_states: PharosNpcState[];
  current_room: PharosRoomBrief | null;
}

interface ApiEnvelope<T> {
  code: number;
  status: string;
  data?: T;
  message?: string;
}

// ── client functions ───────────────────────────────────────────────────

async function postEnvelope<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`pharos-world ${url} failed: HTTP ${res.status}`);
  }
  const json = (await res.json()) as ApiEnvelope<T>;
  if (json.code !== 0 || !json.data) {
    throw new Error(json.message || `pharos-world ${url} returned error: ${JSON.stringify(json)}`);
  }
  return json.data;
}

export interface StartSessionParams {
  gotchi_id: string;
  faction: PharosFaction;
  element?: string | null;
  /** On-chain pet name. Used by the backend to personalize the opening
   *  narration. Optional — if missing the gotchi is referred to by id. */
  gotchi_name?: string | null;
}

/** /start is idempotent per (user, gotchi). The backend either creates a
 *  new session (with LLM-generated opening) or returns the existing one
 *  unchanged. There is no reset path — the world is persistent. */
export function startPharosSession(params: StartSessionParams): Promise<PharosStartResponse> {
  return postEnvelope<PharosStartResponse>('/api/pharos-world/start', {
    gotchi_id: params.gotchi_id,
    faction: params.faction,
    element: params.element ?? null,
    gotchi_name: params.gotchi_name ?? null,
  });
}

export function fetchPharosState(conversationId: string): Promise<PharosStateResponse> {
  return postEnvelope<PharosStateResponse>('/api/pharos-world/state', {
    conversation_id: conversationId,
  });
}

export interface PharosMoveResponse {
  from: string;
  to: string;
  session: PharosSession;
  /** New room view — inlined so the client can update sidebar state without
   *  a follow-up `/state` round-trip. */
  current_room: PharosRoomBrief | null;
  /** The templated transition narration the backend just persisted. Append
   *  this to the local message list; do not refetch. */
  transition_message: PharosMessage | null;
}

/** Deterministic move — bypasses the LLM. Used by the sidebar's quick-exit
 *  buttons. Returns enough state (session, current_room, transition message)
 *  for the caller to update the UI in a single round-trip — no `/state`
 *  refetch needed. NPC rapport is unaffected by movement. */
export function movePharosTo(conversationId: string, targetRoomId: string): Promise<PharosMoveResponse> {
  return postEnvelope<PharosMoveResponse>('/api/pharos-world/move', {
    conversation_id: conversationId,
    target_room_id: targetRoomId,
  });
}

// ── localStorage session key ──────────────────────────────────────────
//
// Each `(wallet, gotchi)` pair gets its own session because the world is
// the *Gotchipus's* ongoing story — rapport, awarded items, room state
// are real per-gotchi continuity, not a per-wallet save slot. Switching
// gotchis at the bootstrap picker resumes (or creates) that specific
// gotchi's session; you cannot intentionally reset one (the on-chain
// stakes make resetting incoherent — see hard-rules / Bond).

const PHAROS_CONV_PREFIX = 'pharos:conv:';

function storageKey(walletAddress: string, gotchiId: string): string {
  return PHAROS_CONV_PREFIX + walletAddress.toLowerCase() + ':' + gotchiId;
}

export function loadStoredConversationId(walletAddress: string, gotchiId: string): string | null {
  if (typeof window === 'undefined' || !walletAddress || !gotchiId) return null;
  return localStorage.getItem(storageKey(walletAddress, gotchiId));
}

export function saveStoredConversationId(walletAddress: string, gotchiId: string, conversationId: string): void {
  if (typeof window === 'undefined' || !walletAddress || !gotchiId) return;
  localStorage.setItem(storageKey(walletAddress, gotchiId), conversationId);
}

/** Only call this on hard recovery paths — e.g. server returns 404 because
 *  the session was wiped DB-side. Players should never have a button that
 *  invokes this; the world is meant to be persistent. */
export function clearStoredConversationId(walletAddress: string, gotchiId: string): void {
  if (typeof window === 'undefined' || !walletAddress || !gotchiId) return;
  localStorage.removeItem(storageKey(walletAddress, gotchiId));
}
