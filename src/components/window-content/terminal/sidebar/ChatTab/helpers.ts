import type { Message, Turn } from "./types";

export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** Group flat message list into conversation turns: one user + following
 *  assistants. Leading assistant-only messages (system welcomes, proactive
 *  prompts) form a pre-turn. */
export function groupMessagesIntoTurns(messages: Message[]): Turn[] {
  const turns: Turn[] = [];
  let current: Turn | null = null;
  for (const m of messages) {
    if (m.role === "user") {
      if (current) turns.push(current);
      current = { id: m.id, user: m, assistants: [] };
    } else {
      if (!current) current = { id: `pre-${m.id}`, assistants: [] };
      current.assistants.push(m);
    }
  }
  if (current) turns.push(current);
  return turns;
}
