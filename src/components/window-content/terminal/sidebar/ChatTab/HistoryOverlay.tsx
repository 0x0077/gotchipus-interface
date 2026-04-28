"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollText, Trash2, Plus, Star, Pin, Pencil } from "lucide-react";
import CloseIcon from "@assets/icons/CloseIcon";
import type { Conversation } from "@/lib/conversation-api";
import { getTimeAgo } from "./helpers";

interface Props {
  conversations?: Conversation[];
  currentConversationId?: string;
  hasMoreConversations?: boolean;
  isLoadingConversations?: boolean;
  onClose: () => void;
  onSwitchConversation?: (id: string) => void;
  onNewConversation?: () => void;
  onRenameConversation?: (id: string, name: string) => Promise<any>;
  onDeleteConversation?: (id: string) => Promise<any>;
  onStarConversation?: (id: string, starred: boolean) => Promise<any>;
  onPinConversation?: (id: string, pinned: boolean) => Promise<any>;
  onLoadMoreConversations?: () => void;
}

/** Fullscreen overlay inside the ChatTab frame showing the user's conversation
 *  list with inline rename + star/pin/delete actions. */
export function HistoryOverlay({
  conversations,
  currentConversationId,
  hasMoreConversations,
  isLoadingConversations,
  onClose,
  onSwitchConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onStarConversation,
  onPinConversation,
  onLoadMoreConversations,
}: Props) {
  const { t } = useTranslation();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  return (
    <div className="absolute inset-0 bg-win98-face z-20 flex flex-col msg-in">
      <div className="h-[22px] px-1.5 border-b border-[#808080] flex items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0] flex-shrink-0">
        <div className="flex items-center gap-1">
          <ScrollText className="w-[10px] h-[10px] text-white" />
          <span className="text-[11px] font-bold text-white">{t("terminal.chat.chatHistory")}</span>
        </div>
        <button
          onClick={onClose}
          className="border border-[#808080] bg-win98-face hover:bg-[#b0b0b0] w-4 h-4 flex items-center justify-center"
        >
          <CloseIcon width={8} height={8} color="#000000" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-[3px] w98s space-y-[2px]">
        {(conversations ?? []).map(c => {
          const isActive = c.id === currentConversationId;
          const isRenaming = renamingId === c.id;
          const timeAgo = getTimeAgo(c.updated_at || c.created_at);

          return (
            <div
              key={c.id}
              onClick={() => {
                if (!isRenaming) {
                  onSwitchConversation?.(c.id);
                  onClose();
                }
              }}
              className={`px-1.5 py-1 border border-[#808080] cursor-pointer group flex items-center justify-between ${
                isActive ? "bg-[#000080] text-white" : "bg-win98-face hover:bg-white"
              }`}
            >
              <div className="min-w-0 flex-1">
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === "Enter" && renameValue.trim()) {
                        await onRenameConversation?.(c.id, renameValue.trim());
                        setRenamingId(null);
                      } else if (e.key === "Escape") {
                        setRenamingId(null);
                      }
                    }}
                    onBlur={() => setRenamingId(null)}
                    onClick={e => e.stopPropagation()}
                    className="text-[11px] font-bold text-[#000080] bg-white border border-[#808080] w-full px-0.5 outline-none"
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-[3px]">
                      {c.is_pinned && <Pin className="w-[8px] h-[8px] text-[#808080] flex-shrink-0" />}
                      {c.is_starred && <Star className="w-[8px] h-[8px] text-[#cc8800] flex-shrink-0" />}
                      <span
                        className={`text-[11px] font-bold truncate block ${
                          isActive ? "text-white" : "text-[#000080]"
                        }`}
                      >
                        {c.name || t("terminal.chat.newChat")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[9px] ${isActive ? "text-white/60" : "text-[#808080]"}`}
                      >
                        {timeAgo}
                      </span>
                      {c.message_count > 0 && (
                        <span
                          className={`text-[9px] ${isActive ? "text-white/60" : "text-[#808080]"}`}
                        >
                          · {c.message_count} msgs
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-[2px] opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setRenamingId(c.id);
                    setRenameValue(c.name || "");
                  }}
                  className="w-3.5 h-3.5 border border-[#808080] bg-win98-face hover:bg-[#b0b0b0] flex items-center justify-center"
                  title={t("terminal.chat.rename")}
                >
                  <Pencil className="w-2 h-2" />
                </button>
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    await onStarConversation?.(c.id, !c.is_starred);
                  }}
                  className="w-3.5 h-3.5 border border-[#808080] bg-win98-face hover:bg-[#b0b0b0] flex items-center justify-center"
                  title={c.is_starred ? t("terminal.chat.unstar") : t("terminal.chat.star")}
                >
                  <Star className={`w-2 h-2 ${c.is_starred ? "text-[#cc8800]" : ""}`} />
                </button>
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    await onPinConversation?.(c.id, !c.is_pinned);
                  }}
                  className="w-3.5 h-3.5 border border-[#808080] bg-win98-face hover:bg-[#b0b0b0] flex items-center justify-center"
                  title={c.is_pinned ? t("terminal.chat.unpin") : t("terminal.chat.pin")}
                >
                  <Pin className={`w-2 h-2 ${c.is_pinned ? "text-[#000080]" : ""}`} />
                </button>
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    await onDeleteConversation?.(c.id);
                  }}
                  className="w-3.5 h-3.5 border border-[#808080] bg-win98-face hover:bg-[#ff0000] hover:text-white flex items-center justify-center"
                  title={t("terminal.chat.delete")}
                >
                  <Trash2 className="w-2 h-2" />
                </button>
              </div>
            </div>
          );
        })}
        {hasMoreConversations && (
          <button
            onClick={() => onLoadMoreConversations?.()}
            disabled={isLoadingConversations}
            className="w-full text-[10px] text-[#000080] py-1 hover:bg-[#b0b0b0] disabled:opacity-50"
          >
            {isLoadingConversations ? t("terminal.chat.loading") : t("terminal.chat.loadMore")}
          </button>
        )}
        {!conversations?.length && !isLoadingConversations && (
          <div className="text-center py-4 text-[10px] text-[#808080]">
            {t("terminal.chat.noConversations")}
          </div>
        )}
      </div>
      <div className="p-[3px] border-t border-[#808080]">
        <button
          onClick={() => {
            onNewConversation?.();
            onClose();
          }}
          className="w-full border border-[#808080] bg-win98-face hover:bg-[#b0b0b0] px-2 py-[3px] text-[11px] font-bold text-[#000080] flex items-center justify-center gap-1"
        >
          <Plus className="w-[10px] h-[10px]" />
          <span>{t("terminal.chat.newChat")}</span>
        </button>
      </div>
    </div>
  );
}
