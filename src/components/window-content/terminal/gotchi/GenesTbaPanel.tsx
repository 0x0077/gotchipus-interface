"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import CopyIcon from "@assets/icons/CopyIcon";
import ExternalLinkIcon from "@assets/icons/ExternalLinkIcon";
import { Win98GroupBox } from "./GotchiDetailHelpers";

interface GenesTbaPanelProps {
  tbaAddress: string;
  copiedField: "tba" | null;
  onCopy: (text: string, field: "tba") => void;
}

export function GenesTbaPanel({ tbaAddress, copiedField, onCopy }: GenesTbaPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1.5">
      <Win98GroupBox label={t('terminal.detail.tba')}>
        <div className="flex items-center gap-1 min-w-0">
          <div
            className="flex-1 min-w-0 px-1 py-1 border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] bg-white text-xs truncate font-courier"
          >
            {tbaAddress || t('terminal.detail.notAvailable')}
          </div>
          {tbaAddress && (
            <button
              onClick={() => onCopy(tbaAddress, "tba")}
              className="px-1.5 py-1 text-xs border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] whitespace-nowrap flex-shrink-0"
              title={t('terminal.detail.copyTba')}
            >
              {copiedField === "tba" ? "✓" : <CopyIcon width={12} height={12} color="currentColor" />}
            </button>
          )}
          {tbaAddress && (
            <Link
              href={`https://basescan.org/address/${tbaAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-1.5 py-1 border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] flex items-center flex-shrink-0"
            >
              <ExternalLinkIcon width={12} height={12} />
            </Link>
          )}
        </div>
      </Win98GroupBox>
    </div>
  );
}
