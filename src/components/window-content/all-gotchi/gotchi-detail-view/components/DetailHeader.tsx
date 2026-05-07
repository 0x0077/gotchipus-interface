"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { GotchiMetadata } from "@/lib/types";
import { calculateExpProgress, calculateExpPercentage } from "../utils";

interface DetailHeaderProps {
  metadata: GotchiMetadata;
  calculatedLevel: number;
  currentExp: number;
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({
  metadata,
  calculatedLevel,
  currentExp
}) => {
  const { t } = useTranslation();
  const expProgress = calculateExpProgress(currentExp);
  const expPercentage = calculateExpPercentage(currentExp);

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <h4 className="text-xl font-bold text-[#000080] uppercase truncate">
              {metadata.name || `Gotchipus #${metadata.token_id}`}
            </h4>
            <span className="text-sm text-[#808080] flex-shrink-0">#{metadata.token_id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#808080]">{t('gotchiDetailView.owner')}</span>
              {metadata.owner ? (
                <a
                  href={`https://basescan.org/address/${metadata.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#000080] font-mono text-xs hover:underline hover:text-[#0000ff] cursor-pointer"
                >
                  {metadata.owner.slice(0, 6)}...{metadata.owner.slice(-4)}
                </a>
              ) : (
                <span className="text-[#000080] font-mono text-xs">{t('gotchiDetailView.unknown')}</span>
              )}
            </div>
            {metadata.singer && (
              <div className="flex items-center gap-2">
                <span className="text-[#808080]">{t('gotchiDetailView.account')}</span>
                <a
                  href={`https://basescan.org/address/${metadata.singer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#000080] font-mono text-xs hover:underline hover:text-[#0000ff] cursor-pointer"
                >
                  {metadata.singer.slice(0, 6)}...{metadata.singer.slice(-4)}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="w-40">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[#000080] font-bold">
              {t('allGotchi.level')} {calculatedLevel}
            </div>
            <div className="text-xs text-[#808080]">
              {expProgress}/100 XP
            </div>
          </div>
          <div className="w-full bg-white border border-[#808080] h-3">
            <div
              className="bg-[#000080] h-full"
              style={{ width: `${expPercentage}%` }}
            />
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-[#808080]"></div>
    </div>
  );
};
