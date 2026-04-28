"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Message } from "./types";

/** Message actions row — small square bevel buttons with char glyphs. */
export function MsgActions({
  msg,
  onRegenerate,
}: {
  msg: Message;
  onRegenerate?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [msg.content]);

  return (
    <div className="rx-actions">
      <button
        onClick={copy}
        title={t("common.copy")}
        aria-label={t("common.copy")}
        className={copied ? "ok" : ""}
      >
        {copied ? "✓" : "⧉"}
      </button>
      <button title={t("terminal.chat.good")} aria-label={t("terminal.chat.good")}>+</button>
      <button title={t("terminal.chat.bad")} aria-label={t("terminal.chat.bad")}>−</button>
      <button
        onClick={() => onRegenerate?.(msg.id)}
        title={t("terminal.chat.regenerate")}
        aria-label={t("terminal.chat.regenerate")}
      >
        ↻
      </button>
    </div>
  );
}
