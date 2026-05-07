"use client"

import Link from "next/link"
import { memo } from "react"
import { useBlockNumber } from "wagmi"

interface BlockIndicatorProps {
  variant: "mobile" | "desktop"
}

function BlockIndicatorBase({ variant }: BlockIndicatorProps) {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    chainId: 8453,
  })

  if (variant === "mobile") {
    return (
      <div className="bg-win98-face border border-[#808080] shadow-win98-inner h-8 px-2 flex items-center">
        <div className="w-1.5 h-1.5 rounded-full bg-[#008000] mr-1" />
        <span className="text-xs text-[#000080]">{blockNumber?.toString()}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center bg-win98-face h-10 px-3 ml-2 border border-[#808080] cursor-pointer shadow-win98-inner justify-center">
      <div className="relative">
        <div className="w-2 h-2 mr-2 rounded-full bg-[#008000]" />
        <div className="absolute top-0 left-0 w-2 h-2 mr-2 rounded-full animate-ping bg-[#008000]" />
      </div>
      <Link
        href={`https://basescan.org/block/${blockNumber?.toString()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base text-[#000080] hover:underline break-all"
      >
        {blockNumber?.toString()}
      </Link>
    </div>
  )
}

export const BlockIndicator = memo(BlockIndicatorBase)
