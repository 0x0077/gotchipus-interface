"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import HistoryIcon from "@assets/icons/HistoryIcon";
import type { SessionStatus } from "./types";
import { useTypewriter } from "./useTypewriter";

interface Props {
  selectedGotchiName: string | null;
  sessionStatus: SessionStatus;
  sessionExpiresAt?: number;
  currentConversationName?: string | null;
  onOpenSetup?: () => void;
  onOpenHistory: () => void;
  onNewConversation?: () => void;
}

/** Top of ChatTab: title row + merged status row (session + conversation name
 *  + nav). Session controls (Set up / Renew) live inline in the status row so
 *  we don't need a third banner when session state is `none` / `expired`. */
export function ChatHeader({
  selectedGotchiName,
  sessionStatus,
  sessionExpiresAt = 0,
  currentConversationName,
  onOpenSetup,
  onOpenHistory,
  onNewConversation,
}: Props) {
  const { t } = useTranslation();
  const { displayed: typedName, isTyping: isTypingName } = useTypewriter(
    currentConversationName,
    40,
  );

  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (sessionStatus !== "active" || !sessionExpiresAt) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const r = sessionExpiresAt - Date.now();
      if (r <= 0) {
        setCountdown("00:00:00");
        return;
      }
      setCountdown(
        `${String(Math.floor(r / 3600000)).padStart(2, "0")}:${String(
          Math.floor((r % 3600000) / 60000),
        ).padStart(2, "0")}:${String(Math.floor((r % 60000) / 1000)).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionStatus, sessionExpiresAt]);

  const statusBg =
    sessionStatus === "active"
      ? "bg-[#e0ffe0]"
      : sessionStatus === "none"
        ? "bg-[#ffffcc]"
        : sessionStatus === "expired"
          ? "bg-[#ffe8d0]"
          : "bg-win98-face";

  return (
    <>
      <div className="h-[22px] px-2 border-b border-[#808080] flex items-center bg-gradient-to-r from-[#000080] to-[#1084d0] flex-shrink-0">
        <span className="text-[11px] font-bold text-white tracking-wide">
          GOTCHI {selectedGotchiName && <span className="opacity-70">▸</span>}{" "}
          {selectedGotchiName || (
            <span className="opacity-60">{t("terminal.chat.unselected")}</span>
          )}
        </span>
        <div className="flex-1" />
        <span className="text-[9px] px-[3px] bg-white/20 text-white border border-white/30 leading-none py-[1px]">
          v1.0.0-beta
        </span>
      </div>

      <div
        className={`flex items-center px-2 py-[3px] border-b border-[#808080] flex-shrink-0 gap-1.5 text-[10px] ${statusBg}`}
      >
        {sessionStatus === "active" && (
          <>
            <span className="w-[6px] h-[6px] rounded-full bg-[#008000] pd flex-shrink-0" />
            <span className="font-bold text-[#008000]">
              {t("terminal.chat.activeBanner")}
            </span>
            <span className="text-[#606060] font-mono">{countdown}</span>
          </>
        )}
        {sessionStatus === "none" && (
          <>
            <span className="w-[6px] h-[6px] rounded-full bg-[#806000] flex-shrink-0" />
            <span className="text-[#806000]">{t("terminal.chat.noSessionBanner")}</span>
            <button
              onClick={onOpenSetup}
              className="ml-0.5 px-1 font-bold bg-[#000080] text-white border border-t-[#1084d0] border-l-[#1084d0] border-r-[#000040] border-b-[#000040] hover:bg-[#1a3a99] leading-[14px]"
            >
              {t("terminal.chat.setUp")}
            </button>
          </>
        )}
        {sessionStatus === "expired" && (
          <>
            <span className="text-[#cc6600]">⚠ {t("terminal.chat.expiredBanner")}</span>
            <button
              onClick={onOpenSetup}
              className="ml-0.5 px-1 font-bold bg-[#cc6600] text-white border border-t-[#e08040] border-l-[#e08040] border-r-[#804000] border-b-[#804000] hover:bg-[#dd7700] leading-[14px]"
            >
              {t("terminal.chat.renewBanner")}
            </button>
          </>
        )}

        {currentConversationName && (
          <>
            <span className="text-[#a0a0a0]">|</span>
            <span className="text-[#000080] font-bold truncate max-w-[120px]">
              {typedName}
              {isTypingName && (
                <span className="inline-block w-[1px] h-[10px] bg-[#000080] ml-[1px] align-middle animate-[blink_0.7s_step-end_infinite]" />
              )}
            </span>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={onOpenHistory}
          className="text-[#000080] font-bold hover:underline px-1 inline-flex items-center gap-0.5"
          title={t("terminal.chat.history")}
        >
          <HistoryIcon width={9} height={9} />
          <span>{t("terminal.chat.history")}</span>
        </button>
        <span className="text-[#a0a0a0]">|</span>
        <button
          onClick={() => onNewConversation?.()}
          className="text-[#000080] font-bold hover:underline px-1 inline-flex items-center gap-0.5"
          title={t("terminal.chat.newChat")}
        >
          <Plus className="w-[9px] h-[9px]" />
          <span>{t("terminal.chat.newChat")}</span>
        </button>
      </div>
    </>
  );
}
