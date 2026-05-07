"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { compactStyles } from "./styles";
import { groupMessagesIntoTurns } from "./helpers";
import { SLASH_COMMAND_DEFS } from "./commands";
import type { ChatTabProps, Message, SlashCommand } from "./types";
import { ChatHeader } from "./ChatHeader";
import { HistoryOverlay } from "./HistoryOverlay";
import { WelcomeCard } from "./WelcomeCard";
import { UserRow } from "./UserRow";
import { AssistantRow } from "./AssistantRow";
import { InputArea } from "./InputArea";

// Flip to false once the agent is wired up to Base.
const AGENT_DISABLED = true;

// Re-export the message types so the rest of the app can import from
// `./ChatTab` transparently (unchanged from pre-split).
export type { Message, ToolStep } from "./types";

export function ChatTab({
  messages,
  chatInput,
  setChatInput,
  handleSendChat,
  chatEndRef,
  status,
  onRegenerate,
  onEditMessage,
  onStopStreaming,
  currentConversationName,
  selectedGotchi,
  selectedGotchiName,
  sessionStatus,
  sessionExpiresAt = 0,
  onOpenSetup,
  conversations,
  currentConversationId,
  onSwitchConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onStarConversation,
  onPinConversation,
  onLoadConversations,
  onLoadMoreConversations,
  hasMoreConversations,
  isLoadingConversations,
}: ChatTabProps) {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Auto-focus input after streaming completes. */
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current === "streaming" && status === "idle") {
      taRef.current?.focus();
    }
    prevStatus.current = status;
  }, [status]);

  /* Smart auto-scroll — only snap to bottom if the user is already near it. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatEndRef]);

  const resize = useCallback((ta: HTMLTextAreaElement) => {
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;
  }, []);

  const isStreaming = messages.some(m => m.isStreaming || m.isThinking);
  const visible = messages.filter(m => m.role !== "system");
  const turns = groupMessagesIntoTurns(visible);

  /* Slash command autocomplete. */
  const [slashIdx, setSlashIdx] = useState(0);
  const [slashDismissed, setSlashDismissed] = useState(false);
  const slashFiltered = useMemo(() => {
    if (!chatInput.startsWith("/")) return [];
    const q = chatInput.slice(1).split(/\s/)[0].toLowerCase();
    return SLASH_COMMAND_DEFS.filter(c => c.cmd.slice(1).startsWith(q));
  }, [chatInput]);
  const slashOpen =
    chatInput.startsWith("/") && slashFiltered.length > 0 && !slashDismissed && !isStreaming;
  useEffect(() => {
    if (slashIdx >= slashFiltered.length) setSlashIdx(0);
  }, [slashFiltered.length, slashIdx]);

  const pickSlash = useCallback(
    (c: SlashCommand) => {
      const next = c.cmd + (c.hint ? " " : "");
      setChatInput(next);
      setSlashDismissed(true);
      setTimeout(() => {
        taRef.current?.focus();
        if (taRef.current) taRef.current.setSelectionRange(next.length, next.length);
      }, 0);
    },
    [setChatInput],
  );

  /* Inline edit state. */
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");

  const startEditingUser = useCallback(
    (m: Message) => {
      if (isStreaming) return;
      setEditingMessageId(m.id);
      setEditingDraft(m.content);
    },
    [isStreaming],
  );

  const cancelEditingUser = useCallback(() => {
    setEditingMessageId(null);
    setEditingDraft("");
  }, []);

  const submitEditingUser = useCallback(() => {
    if (!editingMessageId || !onEditMessage) return;
    const trimmed = editingDraft.trim();
    if (!trimmed) return;
    onEditMessage(editingMessageId, trimmed);
    setEditingMessageId(null);
    setEditingDraft("");
  }, [editingMessageId, editingDraft, onEditMessage]);

  /* Bail out of edit mode if the target message is gone (conversation switch,
   *  /clear, server-side removal). */
  useEffect(() => {
    if (editingMessageId && !messages.some(m => m.id === editingMessageId)) {
      setEditingMessageId(null);
      setEditingDraft("");
    }
  }, [editingMessageId, messages]);

  /* Fill input from a welcome-card slash hint click. */
  const fillToInput = useCallback(
    (content: string) => {
      setChatInput(content);
      setSlashDismissed(false);
      setTimeout(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(content.length, content.length);
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;
      }, 0);
    },
    [setChatInput],
  );

  /* Submit gate — intercepts local-only commands (currently just `/clear`). */
  const submitChat = useCallback(() => {
    if (AGENT_DISABLED) return;
    const trimmed = chatInput.trim();
    if (!trimmed || isStreaming || !selectedGotchi) return;
    if (trimmed === "/clear") {
      onNewConversation?.();
      setChatInput("");
      if (taRef.current) taRef.current.style.height = "auto";
      return;
    }
    handleSendChat();
    setTimeout(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    }, 0);
  }, [chatInput, isStreaming, selectedGotchi, handleSendChat, onNewConversation, setChatInput]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: compactStyles }} />

      {showHistory && (
        <HistoryOverlay
          conversations={conversations}
          currentConversationId={currentConversationId}
          hasMoreConversations={hasMoreConversations}
          isLoadingConversations={isLoadingConversations}
          onClose={() => setShowHistory(false)}
          onSwitchConversation={onSwitchConversation}
          onNewConversation={onNewConversation}
          onRenameConversation={onRenameConversation}
          onDeleteConversation={onDeleteConversation}
          onStarConversation={onStarConversation}
          onPinConversation={onPinConversation}
          onLoadMoreConversations={onLoadMoreConversations}
        />
      )}

      <ChatHeader
        selectedGotchiName={selectedGotchiName}
        sessionStatus={sessionStatus ?? null}
        sessionExpiresAt={sessionExpiresAt}
        currentConversationName={currentConversationName}
        onOpenSetup={onOpenSetup}
        onOpenHistory={() => {
          onLoadConversations?.();
          setShowHistory(true);
        }}
        onNewConversation={onNewConversation}
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto px-2 pt-[3px] pb-3 bg-[#d4d0c8] border-x border-[#808080] shadow-win98-inner w98s"
      >
        {AGENT_DISABLED && (
          <div
            role="status"
            className="mt-2 mb-2 px-3 py-2 bg-[#fffbe6] border border-[#c8a200] shadow-win98-outer text-[#5a4500]"
          >
            <div className="text-[12px] font-bold mb-1">
              {t("terminal.chat.integrationTitle", "Agent integration in progress")}
            </div>
            <div className="text-[11px] leading-snug">
              {t(
                "terminal.chat.integrationBody",
                "Gotchi Assistant is being wired up to Base. The agent is temporarily unavailable — Activity, Hooks, and onchain actions still work as usual.",
              )}
            </div>
          </div>
        )}

        {!AGENT_DISABLED && (
          <WelcomeCard
            selectedGotchi={selectedGotchi}
            selectedGotchiName={selectedGotchiName}
            onHintClick={fillToInput}
          />
        )}

        {turns.map((turn, ti) => (
          <div key={turn.id}>
            {turn.user && (
              <UserRow
                user={turn.user}
                isStreaming={isStreaming}
                canEdit={!!onEditMessage}
                onStartEdit={startEditingUser}
                editing={editingMessageId === turn.user.id}
                editingDraft={editingDraft}
                onEditingDraftChange={setEditingDraft}
                onSubmitEdit={submitEditingUser}
                onCancelEdit={cancelEditingUser}
              />
            )}

            {turn.assistants.map((m, ai) => (
              <AssistantRow
                key={m.id}
                msg={m}
                positionInTurn={ai}
                onRegenerate={onRegenerate}
              />
            ))}

            {ti < turns.length - 1 && <div className="turn-divider" />}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <InputArea
        ref={taRef}
        chatInput={chatInput}
        onChatInputChange={v => {
          setChatInput(v);
          setSlashDismissed(false);
        }}
        onResize={resize}
        isStreaming={isStreaming}
        selectedGotchi={selectedGotchi}
        agentDisabled={AGENT_DISABLED}
        slashOpen={slashOpen}
        slashFiltered={slashFiltered}
        slashIdx={slashIdx}
        setSlashIdx={setSlashIdx}
        onSlashDismiss={() => setSlashDismissed(true)}
        onSlashPick={pickSlash}
        onSubmit={submitChat}
        onStopStreaming={onStopStreaming}
      />
    </div>
  );
}
