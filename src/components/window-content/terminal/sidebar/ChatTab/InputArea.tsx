"use client";

import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import type { SlashCommand } from "./types";

interface Props {
  chatInput: string;
  onChatInputChange: (v: string) => void;
  onResize: (ta: HTMLTextAreaElement) => void;
  isStreaming: boolean;
  selectedGotchi: string | null;
  slashOpen: boolean;
  slashFiltered: SlashCommand[];
  slashIdx: number;
  setSlashIdx: (i: number) => void;
  onSlashDismiss: () => void;
  onSlashPick: (c: SlashCommand) => void;
  onSubmit: () => void;
  onStopStreaming?: () => void;
}

/** Bottom-of-ChatTab composer: slash autocomplete popover + textarea + send/stop
 *  button. Forwards the textarea ref so the parent can `focus()` / measure /
 *  resize height on external actions (edit fill-in, /clear reset, etc). */
export const InputArea = forwardRef<HTMLTextAreaElement, Props>(function InputArea(
  {
    chatInput,
    onChatInputChange,
    onResize,
    isStreaming,
    selectedGotchi,
    slashOpen,
    slashFiltered,
    slashIdx,
    setSlashIdx,
    onSlashDismiss,
    onSlashPick,
    onSubmit,
    onStopStreaming,
  },
  ref,
) {
  const { t } = useTranslation();

  return (
    <div className="relative p-[3px] border-t border-t-white bg-win98-face flex gap-[3px] items-end flex-shrink-0">
      {slashOpen && (
        <div
          id="slash-popover"
          className="rx-slash w98s"
          role="listbox"
          aria-label={t("terminal.chat.slashTag")}
        >
          <div className="rx-slash-hd">
            <span className="tag">{t("terminal.chat.slashTag")}</span>
            <span>
              {t("terminal.chat.slashMatching", { query: chatInput.split(/\s/)[0] })}
            </span>
          </div>
          {slashFiltered.map((c, i) => (
            <div
              key={c.cmd}
              id={`slash-opt-${i}`}
              role="option"
              aria-selected={i === slashIdx}
              className={`rx-slash-item ${i === slashIdx ? "active" : ""}`}
              onMouseEnter={() => setSlashIdx(i)}
              onMouseDown={e => {
                e.preventDefault();
                onSlashPick(c);
              }}
            >
              <span className="cmd">{c.cmd}</span>
              <span className={`badge ${c.native ? "live" : "prompt"}`}>
                {c.native ? t("terminal.chat.badgeLive") : t("terminal.chat.badgePrompt")}
              </span>
              <span className="desc">{t(c.descKey)}</span>
              <span className="hint">{c.hint}</span>
            </div>
          ))}
          <div className="rx-slash-foot">{t("terminal.chat.slashFoot")}</div>
        </div>
      )}

      <div
        className={`flex-1 border border-[#808080] shadow-win98-inner px-1 py-[1px] ${
          isStreaming || !selectedGotchi ? "bg-[#d4d0c8]" : "bg-white"
        }`}
      >
        <textarea
          ref={ref}
          value={chatInput}
          disabled={isStreaming || !selectedGotchi}
          onChange={e => {
            onChatInputChange(e.target.value);
            onResize(e.target);
          }}
          onKeyDown={e => {
            if (slashOpen) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSlashIdx((slashIdx + 1) % slashFiltered.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSlashIdx((slashIdx - 1 + slashFiltered.length) % slashFiltered.length);
                return;
              }
              if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
                e.preventDefault();
                onSlashPick(slashFiltered[slashIdx]);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                onSlashDismiss();
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={
            !selectedGotchi
              ? t("terminal.chat.selectGotchiFirst", "Select a Gotchi first...")
              : isStreaming
                ? t("terminal.chat.waitingResponse")
                : `${t("terminal.chat.askAnything")} — ${t("terminal.chat.typeForCommands")}`
          }
          rows={1}
          role="combobox"
          aria-expanded={slashOpen}
          aria-controls={slashOpen ? "slash-popover" : undefined}
          aria-activedescendant={slashOpen ? `slash-opt-${slashIdx}` : undefined}
          aria-autocomplete="list"
          className="w-full bg-transparent border-none text-[12px] text-[#000000] outline-none placeholder:text-[#808080] resize-none overflow-y-hidden py-[2px] leading-snug disabled:cursor-not-allowed disabled:text-[#808080] max-h-[80px] block"
        />
        <div className="text-[9px] text-[#b0b0b0] text-right leading-[1] pb-[1px] select-none pointer-events-none">
          {t("terminal.chat.sendHint")}
        </div>
      </div>
      {isStreaming ? (
        <button
          onClick={() => onStopStreaming?.()}
          className="rx-send stop"
          title={t("terminal.chat.stop", "Stop")}
          aria-label={t("terminal.chat.stop", "Stop")}
        >
          ■
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!chatInput.trim() || isStreaming || !selectedGotchi}
          className="rx-send"
          title={t("terminal.chat.send")}
          aria-label={t("terminal.chat.send")}
        >
          ➤
        </button>
      )}
    </div>
  );
});
