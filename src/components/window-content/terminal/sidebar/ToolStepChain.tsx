"use client";

export interface ToolStep {
  tool: string;
  params?: any;
  status: "running" | "success" | "error";
  result?: any;
}

interface ToolStepChainProps {
  steps: ToolStep[];
}

const TOOL_LABELS: Record<string, string> = {
  get_tba_balances: "Loading balances",
  check_balance: "Checking balance",
  transfer_token: "Transferring tokens",
  deploy_token: "Deploying token",
  get_swap_quote: "Getting swap quote",
  execute_swap: "Executing swap",
  add_liquidity: "Adding liquidity",
  remove_liquidity: "Removing liquidity",
  query_pools: "Querying pools",
  get_token_price: "Fetching price",
  get_wallet_assets: "Loading assets",
  get_pet_status: "Reading pet status",
  pet_interaction: "Interacting with pet",
  evolve_pet: "Evolving pet",
};

export function getStepLabel(step: ToolStep): string {
  const base = TOOL_LABELS[step.tool] || step.tool;
  const p = step.params;
  if (!p) return base;

  switch (step.tool) {
    case "check_balance":
      return `Checking ${p.token || ""} balance`;
    case "transfer_token":
      return `Transferring ${p.amount || ""} ${p.token || ""}`;
    case "deploy_token":
      return `Deploying ${p.symbol || p.name || "token"}`;
    case "get_swap_quote":
      return `Quoting ${p.amount || ""} ${p.from_token || ""} → ${p.to_token || ""}`;
    case "execute_swap":
      return `Executing swap`;
    case "add_liquidity":
      return `Adding liquidity ${p.token_a || ""}/${p.token_b || ""}`;
    case "remove_liquidity":
      return `Removing liquidity`;
    case "query_pools":
      return `Querying ${p.token_a || ""}/${p.token_b || ""} pools`;
    default:
      return base;
  }
}

function formatArgs(params: any): string {
  if (!params || typeof params !== "object") return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  const formatted = entries
    .map(([k, v]) => {
      const sv = typeof v === "string" ? JSON.stringify(v.length > 24 ? v.slice(0, 24) + "…" : v) : JSON.stringify(v);
      return `${k}=${sv}`;
    })
    .join(", ");
  return formatted.length > 90 ? formatted.slice(0, 90) + "…" : formatted;
}

function summarizeResult(step: ToolStep): string {
  const r = step.result;
  if (!r) return "OK";
  if (typeof r === "string") return r.slice(0, 100);
  if (r.summary) return String(r.summary);
  if (r.route) return String(r.route);
  if (r.message) return String(r.message).slice(0, 100);
  return "OK";
}

function errorText(step: ToolStep): string {
  const r = step.result;
  if (!r) return "Failed";
  if (typeof r === "string") return r.slice(0, 100);
  if (r.error) return String(r.error).slice(0, 100);
  return "Failed";
}

/** Terminal-style tool call log: one line per `$ tool(args)` + result/pending line. */
export default function ToolStepChain({ steps }: ToolStepChainProps) {
  if (steps.length === 0) return null;

  return (
    <div
      className="w-full mt-1.5 mb-0.5 px-2.5 py-1.5 font-mono text-[11px] leading-[1.55] break-all"
      style={{ background: "#1a1a2e", color: "#c0c0e0" }}
    >
      {steps.map((step, i) => {
        const args = formatArgs(step.params);
        return (
          <div key={i}>
            <div className="flex items-baseline gap-1.5">
              <span className="flex-shrink-0 font-bold" style={{ color: "#90ff90" }}>$</span>
              <span className="text-white">
                {step.tool}
                {args && <span style={{ color: "#9090d0" }}>({args})</span>}
              </span>
            </div>
            {step.status === "running" && (
              <div className="pl-[14px]" style={{ color: "#ffcc66" }}>
                ⋯ {getStepLabel(step)}
              </div>
            )}
            {step.status === "success" && (
              <div className="pl-[14px]" style={{ color: "#a0c0a0" }}>
                <span style={{ color: "#90ff90" }} className="mr-1">✓</span>
                {summarizeResult(step)}
              </div>
            )}
            {step.status === "error" && (
              <div className="pl-[14px]" style={{ color: "#a0c0a0" }}>
                <span style={{ color: "#ff8080" }} className="mr-1">✗</span>
                {errorText(step)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
