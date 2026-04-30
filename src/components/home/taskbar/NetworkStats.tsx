"use client"

import Image from "next/image"
import { memo } from "react"
import useSWR from "swr"
import { Fuel } from "lucide-react"

interface NetworkStatsProps {
  variant: "mobile" | "desktop"
}

interface NetworkStatsData {
  price: number
  gasFee: string | null
  medianGasPrice: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatPrice(price: number | undefined): string {
  if (!price || !Number.isFinite(price)) return "—"
  return price < 10 ? price.toFixed(4) : price.toFixed(2)
}

function NetworkStatsBase({ variant }: NetworkStatsProps) {
  const { data } = useSWR<{ code: number; data: NetworkStatsData }>(
    "/api/tokens/network-stats",
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: false, dedupingInterval: 4000 }
  )
  const stats = data?.code === 0 ? data.data : undefined

  if (variant === "mobile") {
    return (
      <div className="bg-win98-face border border-[#808080] shadow-win98-inner h-8 px-2 flex items-center gap-1">
        <Image src="/tokens/pros.png" alt="PROS" width={11} height={11} className="flex-shrink-0" />
        <span className="text-[10px] text-[#000080] font-courier">${formatPrice(stats?.price)}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center bg-win98-face h-10 px-2.5 border border-[#808080] shadow-win98-inner gap-1.5"
        title="PROS price"
      >
        <Image src="/tokens/pros.png" alt="PROS" width={13} height={13} className="flex-shrink-0" />
        <span className="text-xs text-[#000080] font-courier">${formatPrice(stats?.price)}</span>
      </div>

      <div
        className="flex items-center bg-win98-face h-10 px-2.5 border border-[#808080] shadow-win98-inner gap-1.5"
        title="Gas fee"
      >
        <Fuel size={12} className="text-[#404040] flex-shrink-0" />
        <span className="text-xs text-[#000080] font-courier">{stats?.gasFee ?? "—"}</span>
      </div>
    </div>
  )
}

export const NetworkStats = memo(NetworkStatsBase)
