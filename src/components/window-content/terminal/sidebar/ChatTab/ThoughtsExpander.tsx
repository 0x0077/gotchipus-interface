"use client";

import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "../../markdown/MarkdownRenderer";

/** Collapsible "Thoughts" expander — native <details>, left grey line + italic.
 *  Rendered only after thinking is done; live-thinking state is surfaced by
 *  MessageStatusStrip instead. */
export function ThoughtsExpander({ thinking }: { thinking: string }) {
  const { t } = useTranslation();
  const approxTokens = Math.max(1, Math.floor(thinking.length / 5));
  return (
    <details className="rx-thoughts w98s">
      <summary>
        {t("terminal.chat.thoughts")} <span className="text-[#a0a0a0]">· {approxTokens} tok</span>
      </summary>
      <div className="body cmd">
        <MarkdownRenderer content={thinking} isStreaming={false} />
      </div>
    </details>
  );
}
