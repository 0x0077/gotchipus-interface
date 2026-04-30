"use client"

import type { JSX } from "react"
import { useState } from "react"
import Image from "next/image"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import type { WindowType } from "@/lib/types"
import { CustomConnectButton } from "@/components/footer/CustomConnectButton"
import AboutContent from "@/components/window-content/AboutContent"
import { Locale, LOCALE_LABELS } from "@i18n/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BlockIndicator } from "./BlockIndicator"
import { NetworkStats } from "./NetworkStats"
import { SocialLinks } from "./SocialLinks"

interface TaskbarDesktopProps {
  onOpenWindow: (id: string, title: string, content: JSX.Element, icon?: string) => void
  openWindows: WindowType[]
  activeWindow: string | null
  onActivateWindow: (id: string) => void
  onRestoreWindow: (id: string) => void
}

export const TaskbarDesktop = observer(({
  onOpenWindow,
  openWindows,
  activeWindow,
  onActivateWindow,
  onRestoreWindow,
}: TaskbarDesktopProps) => {
  const { t, i18n } = useTranslation()
  const [isStartPressed, setIsStartPressed] = useState(false)
  const [pressedButton, setPressedButton] = useState<string | null>(null)

  const handleOpenAbout = () => onOpenWindow("about", "About", <AboutContent />)

  const handleButtonMouseUp = (id: string) => {
    if (id !== pressedButton) {
      setPressedButton(null)
      return
    }
    setPressedButton(null)
    if (openWindows.find((w) => w.id === id)?.minimized) {
      onRestoreWindow(id)
    } else {
      onActivateWindow(id)
    }
  }

  return (
    <div className="absolute bottom-0 left-0 w-full bg-win98-face border-t-2 border-win98-highlight shadow-win98-outer flex items-center justify-between px-1 z-50 h-14">
      <div className="flex items-center flex-1 overflow-hidden h-10">
        <button
          type="button"
          className={`px-3 mr-1 font-bold text-sm flex items-center justify-center text-white border border-[#808080] h-10 min-w-[80px] ${
            isStartPressed
              ? "bg-uni-bg-01 shadow-win98-inner"
              : "bg-uni-bg-01 shadow-win98-outer"
          }`}
          onClick={handleOpenAbout}
          onMouseDown={() => setIsStartPressed(true)}
          onMouseUp={() => setIsStartPressed(false)}
          onMouseLeave={() => setIsStartPressed(false)}
        >
          <Image src="/windows98.svg" alt="Start" width={24} height={24} />
          <span className="ml-1 text-sm">{t("taskbar.start")}</span>
        </button>

        <div className="text-sm flex items-center justify-center bg-win98-face border border-[#808080] shadow-win98-outer active:shadow-inner h-10 min-w-[100px]">
          <CustomConnectButton />
        </div>

        <div className="flex items-center overflow-x-auto scrollbar-hide ml-1">
          {openWindows.map((window) => (
            <button
              key={window.id}
              type="button"
              className={`min-w-[120px] px-2 ml-1 text-sm flex items-center justify-start truncate border border-[#808080] bg-win98-face h-10 gap-1.5 ${
                pressedButton === window.id || activeWindow === window.id
                  ? "shadow-win98-inner"
                  : "shadow-win98-outer"
              }`}
              onMouseDown={() => setPressedButton(window.id)}
              onMouseUp={() => handleButtonMouseUp(window.id)}
              onMouseLeave={() => setPressedButton(null)}
            >
              {window.icon && (
                <Image src={window.icon} alt="" width={16} height={16} className="flex-shrink-0" />
              )}
              <span className="truncate">{window.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center h-10 gap-2">
        <Select value={i18n.language} onValueChange={(v) => i18n.changeLanguage(v)}>
          <SelectTrigger className="bg-win98-face border border-[#808080] shadow-win98-inner cursor-pointer rounded-none w-[80px] h-10">
            <SelectValue placeholder={t("taskbar.language")} />
          </SelectTrigger>
          <SelectContent className="bg-win98-face border-2 border-[#808080] shadow-win98-outer rounded-none p-0">
            {Object.values(Locale).map((locale) => (
              <SelectItem
                key={locale}
                value={locale}
                className="hover:bg-[#000080] hover:text-white focus:bg-[#000080] focus:text-white cursor-pointer px-3 py-1 border-b border-[#808080] last:border-b-0"
              >
                {LOCALE_LABELS[locale]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <NetworkStats variant="desktop" />
        <SocialLinks variant="desktop" />
        <BlockIndicator variant="desktop" />
      </div>
    </div>
  )
})
