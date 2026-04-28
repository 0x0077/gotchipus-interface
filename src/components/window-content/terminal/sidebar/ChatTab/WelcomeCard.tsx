"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { GotchiPfp } from "@/components/gotchiSvg/GotchiPfp";
import { SLASH_COMMAND_DEFS } from "./commands";

interface Props {
  selectedGotchi: string | null;
  selectedGotchiName: string | null;
  onHintClick: (content: string) => void;
}

/** Shown above the message list. Two variants:
 *   - No Gotchi selected: "pick one" prompt.
 *   - Gotchi selected: avatar + name + id + subline + clickable slash hints
 *     (first three commands from the palette). */
export function WelcomeCard({ selectedGotchi, selectedGotchiName, onHintClick }: Props) {
  const { t } = useTranslation();

  if (!selectedGotchi) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-3 msg-in">
        <div className="w-[48px] h-[48px] border border-[#808080] overflow-hidden bg-[#d4d0c8] mb-2">
          <Image
            src="/desktop/all-gotchi.png"
            alt="G"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-[12px] font-bold text-[#000080] mb-1">
          {t("terminal.chat.selectGotchiTitle", "Select a Gotchi")}
        </span>
        <span className="text-[11px] text-[#606060] text-center leading-[1.4]">
          {t(
            "terminal.chat.selectGotchiDesc",
            "Pick a Gotchi from your collection on the left to start chatting.",
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="rx-welcome msg-in">
      <div className="flex-shrink-0">
        <GotchiPfp tokenId={selectedGotchi} size={36} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="name">
          {selectedGotchiName}
          <span className="text-[10px] text-[#808080] font-normal ml-1">· #{selectedGotchi}</span>
        </div>
        <div className="sub">{t("terminal.chat.welcomeSub")}</div>
        <div className="hints">
          {t("terminal.chat.tryHint")}{" "}
          {SLASH_COMMAND_DEFS.slice(0, 3).map(c => (
            <code key={c.cmd} onClick={() => onHintClick(c.cmd + (c.hint ? " " : ""))}>
              {c.cmd}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
