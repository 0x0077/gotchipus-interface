"use client";

import React from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useWindowMode } from "@/hooks/useWindowMode";

interface Attribute {
  name: string;
  value: number;
  icon: string;
}

interface AttributesSectionProps {
  attributes: Attribute[];
}

export const AttributesSection: React.FC<AttributesSectionProps> = ({ attributes }) => {
  const { t } = useTranslation();
  const { isMobile } = useWindowMode();
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Image src="/icons/attribute.png" alt="Attributes" width={18} height={18} />
        <h5 className="text-sm font-bold text-[#000080] uppercase">{t('gotchiDetailView.attributes')}</h5>
      </div>
      <div className={`grid gap-2 ${isMobile ? 'grid-cols-3' : 'grid-cols-6'}`}>
        {attributes.map((attr, index) => (
          <div key={index} className="bg-[#d4d0c8] border border-[#808080] shadow-win98-inner rounded-sm p-2">
            <div className="flex items-center gap-1 mb-1">
              <Image src={`/icons/${attr.icon}.png`} alt={attr.name} width={14} height={14} />
              <span className="text-xs text-[#808080] uppercase">{attr.name}</span>
            </div>
            <div className="text-lg font-bold text-[#000080]">{attr.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
