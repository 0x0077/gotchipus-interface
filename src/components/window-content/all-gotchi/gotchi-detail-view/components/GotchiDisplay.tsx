"use client";

import React from "react";
import { motion } from "framer-motion";
import EnhancedGotchiSvg from "@/components/gotchiSvg/EnhancedGotchiSvg";
import { FLOAT_ANIMATION } from "../constants";

interface GotchiDisplayProps {
  wearableIndices: any;
  backgroundStyle: React.CSSProperties;
}

export const GotchiDisplay: React.FC<GotchiDisplayProps> = ({
  wearableIndices,
  backgroundStyle
}) => {
  return (
    <div
      className="border-2 border-[#808080] shadow-win98-outer rounded-sm p-4 sm:p-8 bg-cover bg-center w-full max-w-[400px] aspect-square"
      style={{
        ...backgroundStyle,
        backgroundColor: backgroundStyle.backgroundImage ? 'transparent' : '#ffffff'
      }}
    >
      <motion.div
        className="w-full h-full flex items-center justify-center"
        animate={FLOAT_ANIMATION}
      >
        <EnhancedGotchiSvg
          wearableIndices={wearableIndices}
          width="100%"
          height="100%"
        />
      </motion.div>
    </div>
  );
};
