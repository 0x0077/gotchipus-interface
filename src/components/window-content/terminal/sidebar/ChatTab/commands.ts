import type { SlashCommand } from "./types";

/** Slash command palette shown in the input-area popover and the welcome
 *  hints. `native: true` means the agent / frontend intercepts the literal
 *  command; `native: false` means it just gets sent as a plain prompt that
 *  the LLM handles as natural language. */
export const SLASH_COMMAND_DEFS: SlashCommand[] = [
  { cmd: "/summon", descKey: "terminal.chat.cmd.summon", hint: "#<id>", native: true },
  { cmd: "/balance", descKey: "terminal.chat.cmd.balance", hint: "", native: false },
  { cmd: "/swap", descKey: "terminal.chat.cmd.swap", hint: "<amount> <from> <to>", native: false },
  { cmd: "/send", descKey: "terminal.chat.cmd.send", hint: "<amount> <token> <addr>", native: false },
  { cmd: "/deploy", descKey: "terminal.chat.cmd.deploy", hint: "<name>", native: false },
  { cmd: "/clear", descKey: "terminal.chat.cmd.clear", hint: "", native: false },
];
