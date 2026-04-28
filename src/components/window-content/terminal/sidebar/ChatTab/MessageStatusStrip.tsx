"use client";

import { useTranslation } from "react-i18next";
import { getStepLabel } from "../ToolStepChain";
import type { Message } from "./types";

/** Single status strip above an assistant message. Replaces three earlier
 *  indicators (bubble "Thinking" placeholder, ThinkingBlock shimmer bar,
 *  ToolStepChain "Executing..." header) into one consistent row. */
export function MessageStatusStrip({ msg }: { msg: Message }) {
  const { t } = useTranslation();
  const runningTool = msg.toolSteps?.find(s => s.status === "running");

  if (msg.isThinking) {
    return (
      <div className="flex items-center gap-1.5 px-0.5 py-1">
        <span className="st-dot st-dot-think" />
        <span className="st-txt text-[11px]">{t("terminal.chat.thinking")}</span>
      </div>
    );
  }
  if (runningTool) {
    return (
      <div className="flex items-center gap-1.5 px-0.5 py-1">
        <span className="st-dot st-dot-tool" />
        <span className="st-txt text-[11px]">{getStepLabel(runningTool)}</span>
      </div>
    );
  }
  if (msg.isStreaming && !msg.content) {
    return (
      <div className="flex items-center gap-1.5 px-0.5 py-1">
        <span className="st-dot st-dot-think" />
        <span className="st-txt text-[11px]">{t("terminal.chat.thinking")}</span>
      </div>
    );
  }
  return null;
}
