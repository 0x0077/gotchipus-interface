import type { SlashCommand } from "./types";

export const SLASH_COMMAND_DEFS: SlashCommand[] = [
  { cmd: "/balance", descKey: "terminal.chat.cmd.balance", hint: "", native: false },
  { cmd: "/swap", descKey: "terminal.chat.cmd.swap", hint: "<amount> <from> <to>", native: false },
  { cmd: "/send", descKey: "terminal.chat.cmd.send", hint: "<amount> <token> <addr>", native: false },
  { cmd: "/deploy", descKey: "terminal.chat.cmd.deploy", hint: "<name>", native: false },
  { cmd: "/clear", descKey: "terminal.chat.cmd.clear", hint: "", native: false },
];
