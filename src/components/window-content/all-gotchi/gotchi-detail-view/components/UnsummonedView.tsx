"use client";

import React from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface UnsummonedViewProps {
  tokenId: number;
}

export const UnsummonedView: React.FC<UnsummonedViewProps> = ({ tokenId }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center">
        <div className="mb-4">
          <Image
            src="/beacon-summon.gif"
            alt="Unsummoned"
            width={200}
            height={200}
            className="mx-auto"
            unoptimized
          />
        </div>
        <h2 className="text-2xl font-bold text-[#808080] mb-2">{t('allGotchi.notSummoned')}</h2>
        <p className="text-sm text-[#808080]">{t('allGotchi.notSummonedDesc')}</p>
        <div className="mt-4 bg-white border-2 border-[#808080] shadow-win98-inner p-3 inline-block">
          <div className="text-xs font-bold text-[#000080]">{t('allGotchi.tokenIdLabel', { id: tokenId })}</div>
        </div>
      </div>
    </div>
  );
};
