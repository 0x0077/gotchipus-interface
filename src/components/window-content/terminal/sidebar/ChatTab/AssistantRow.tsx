"use client";

import { MarkdownRenderer } from "../../markdown/MarkdownRenderer";
import ToolStepChain from "../ToolStepChain";
import ToolDataTable from "../ToolDataTable";
import {
  SwapQuoteCard,
  SwapResultCard,
  TbaBalancesCard,
  LiquidityResultCard,
} from "../ToolCards";
import { MessageStatusStrip } from "./MessageStatusStrip";
import { ThoughtsExpander } from "./ThoughtsExpander";
import { MsgActions } from "./MsgActions";
import type { Message } from "./types";

/** A single assistant message's full render stack:
 *  status strip → thoughts expander → tool terminal log → structured tool
 *  data cards → response panel → actions. Empty sections are skipped. */
export function AssistantRow({
  msg,
  positionInTurn,
  onRegenerate,
}: {
  msg: Message;
  /** Used only for top-padding — first assistant in a turn gets a bit more. */
  positionInTurn: number;
  onRegenerate?: (id: string) => void;
}) {
  return (
    <div
      className={`flex justify-start gap-1 msg-in ${
        positionInTurn === 0 ? "pt-[4px]" : "pt-[2px]"
      } pb-[1px]`}
    >
      <div className="flex flex-col min-w-0 items-start flex-1 group">
        <MessageStatusStrip msg={msg} />

        {msg.thinking && !msg.isThinking && <ThoughtsExpander thinking={msg.thinking} />}

        {msg.toolSteps && msg.toolSteps.length > 0 && <ToolStepChain steps={msg.toolSteps} />}

        {msg.toolSteps?.flatMap((step, si) => {
          const r = step.result;
          if (!r || !r._type) return [];
          switch (r._type) {
            case "swap_quote":
              return [<SwapQuoteCard key={`card-${si}`} data={r} />];
            case "swap_result":
              return [<SwapResultCard key={`card-${si}`} data={r} />];
            case "tba_balances":
              return [<TbaBalancesCard key={`card-${si}`} data={r} />];
            case "liquidity_result":
              return [<LiquidityResultCard key={`card-${si}`} data={r} />];
            case "table":
              if (r.columns && r.rows) {
                return [
                  <ToolDataTable
                    key={`table-${si}`}
                    title={r.title || step.tool}
                    columns={r.columns}
                    rows={r.rows}
                  />,
                ];
              }
              return [];
            case "tables":
              if (Array.isArray(r.tables)) {
                return r.tables
                  .filter((t: any) => t.columns && t.rows?.length > 0)
                  .map((t: any, tj: number) => (
                    <ToolDataTable
                      key={`table-${si}-${tj}`}
                      title={t.title || step.tool}
                      columns={t.columns}
                      rows={t.rows}
                    />
                  ));
              }
              return [];
            default:
              return [];
          }
        })}

        {msg.content && (
          <div className="rx-resp break-words">
            <div className="cmd">
              <span className={msg.isStreaming ? "sc" : ""}>
                <MarkdownRenderer content={msg.content} isStreaming={msg.isStreaming || false} />
              </span>
            </div>
          </div>
        )}

        {!msg.isCallTools && !msg.isStreaming && !msg.isThinking && msg.content && (
          <MsgActions msg={msg} onRegenerate={onRegenerate} />
        )}
      </div>
    </div>
  );
}
