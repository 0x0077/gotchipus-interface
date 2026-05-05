import React from "react"
import type { JSX } from "react/jsx-runtime"
import MintContent from "@/components/window-content/MintContent"
import WearableMarketplaceContent from "@/src/components/window-content/WearableMarketplaceContent"
import AllGotchiContent from "@/components/window-content/AllGotchiContent"
import HookRankContent from "@/components/window-content/HookRankContent"
import TerminalContent from "@/components/window-content/terminal/TerminalContent"
import PharosWorldContent from "@/components/window-content/pharos-world/PharosWorldContent"

export interface WindowIconConfig {
  id: string
  title: string
  icon: string
  enabled: boolean
}

export interface WindowContentFactory {
  (props?: any): JSX.Element
}

export const WINDOW_ICONS: WindowIconConfig[] = [
  {
    id: "mint",
    title: "Mint",
    icon: "/desktop/mint.png",
    enabled: false,
  },
  {
    id: "wearable",
    title: "Wearable Marketplace",
    icon: "/desktop/wearable.png",
    enabled: false,
  },
  {
    id: "all-gotchi",
    title: "All Gotchi",
    icon: "/desktop/all-gotchi.png",
    enabled: false,
  },
  {
    id: "hook-rank",
    title: "HookRank",
    icon: "/desktop/hook.png",
    enabled: false,
  },
  {
    id: "terminal",
    title: "Gotchipus Terminal",
    icon: "/desktop/dashboard.png",
    enabled: false,
  },
  {
    id: "pharos-world",
    title: "PharosWorld",
    icon: "/desktop/pharos.png",
    enabled: false,
  },
]

export const getEnabledWindowIcons = (): WindowIconConfig[] => {
  return WINDOW_ICONS.filter(icon => icon.enabled)
}

export const getWindowIcon = (windowId: string): WindowIconConfig | undefined => {
  return WINDOW_ICONS.find(icon => icon.id === windowId && icon.enabled)
}

export const getWindowContent = (
  windowId: string,
  props?: any
): JSX.Element => {
  switch (windowId) {
    case "mint":
      return <MintContent />
    case "wearable":
      return <WearableMarketplaceContent />
    case "all-gotchi":
      return <AllGotchiContent />
    case "hook-rank":
      return <HookRankContent />
    case "terminal":
      return <TerminalContent />
    case "pharos-world":
      return <PharosWorldContent />
    default:
      return <div>Unknown window: {windowId}</div>
  }
}

export const isValidWindowId = (windowId: string): boolean => {
  return getWindowIcon(windowId) !== undefined
}

