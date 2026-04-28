"use client"

import type { JSX } from "react"
import { useState } from "react"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import type { WindowType } from "@/lib/types"
import { CustomConnectButton } from "@/components/footer/CustomConnectButton"
import AboutContent from "@/components/window-content/AboutContent"
import { Locale, LOCALE_LABELS } from "@i18n/constants"
import { BlockIndicator } from "./BlockIndicator"
import { SocialLinks } from "./SocialLinks"

interface TaskbarMobileProps {
  onOpenWindow: (id: string, title: string, content: JSX.Element, icon?: string) => void
  openWindows: WindowType[]
  activeWindow: string | null
  onActivateWindow: (id: string) => void
  onRestoreWindow: (id: string) => void
}

export const TaskbarMobile = observer(({
  onOpenWindow,
  openWindows,
  activeWindow,
  onActivateWindow,
  onRestoreWindow,
}: TaskbarMobileProps) => {
  const { t, i18n } = useTranslation()
  const [isStartPressed, setIsStartPressed] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const toggleMobileMenu = () => setShowMobileMenu((v) => !v)
  const closeMenu = () => setShowMobileMenu(false)

  const handleOpenAbout = () => {
    onOpenWindow("about", "About", <AboutContent />)
    closeMenu()
  }

  const handleWindowButton = (id: string) => {
    const target = openWindows.find((w) => w.id === id)
    if (target?.minimized) onRestoreWindow(id)
    else onActivateWindow(id)
    closeMenu()
  }

  const active = openWindows.find((w) => w.id === activeWindow)

  return (
    <>
      <div className="absolute bottom-0 left-0 w-full bg-win98-face border-t-2 border-win98-highlight shadow-win98-outer flex items-center justify-between px-2 z-50 h-12">
        <button
          type="button"
          className={`px-3 h-8 font-bold text-sm flex items-center justify-center text-white border border-[#808080] min-w-[50px] ${
            isStartPressed
              ? "bg-uni-bg-01 shadow-win98-inner"
              : "bg-uni-bg-01 shadow-win98-outer"
          }`}
          onClick={toggleMobileMenu}
          onMouseDown={() => setIsStartPressed(true)}
          onMouseUp={() => setIsStartPressed(false)}
          onMouseLeave={() => setIsStartPressed(false)}
        >
          <Menu size={16} className="mr-1" />
          <span className="text-xs">{t("taskbar.mobileMenu")}</span>
        </button>

        <div className="flex-1 mx-2 overflow-hidden">
          {active && (
            <div className="bg-win98-face border border-[#808080] shadow-win98-inner px-2 py-1 h-8 flex items-center gap-1">
              {active.icon && (
                <Image src={active.icon} alt="" width={12} height={12} className="flex-shrink-0" />
              )}
              <span className="text-xs truncate">{active.title || active.id}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="bg-win98-face border border-[#808080] shadow-win98-outer h-8 px-2 flex items-center">
            <CustomConnectButton />
          </div>
          <BlockIndicator variant="mobile" />
        </div>
      </div>

      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={closeMenu}>
          <div
            className="absolute bottom-12 left-2 right-2 bg-win98-face border-2 border-[#808080] shadow-win98-outer max-h-[60vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#000080] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center">
                <Image src="/windows98.svg" alt="Start" width={16} height={16} className="mr-2" />
                <span className="text-sm font-bold">{t("taskbar.menu")}</span>
              </div>
              <button type="button" onClick={closeMenu} className="text-white" aria-label="Close menu">
                <X size={16} />
              </button>
            </div>

            <div className="p-2 space-y-1 max-h-[50vh] overflow-y-auto">
              <button
                type="button"
                onClick={handleOpenAbout}
                className="w-full text-left px-3 py-2 bg-win98-face border border-[#808080] shadow-win98-outer hover:bg-[#d4d0c8] flex items-center"
              >
                <div className="w-4 h-4 bg-[#000080] mr-2 flex items-center justify-center">
                  <span className="text-white text-xs">i</span>
                </div>
                <span className="text-sm">{t("about.title")}</span>
              </button>

              {openWindows.length > 0 && (
                <div className="border-t border-[#808080] pt-1">
                  <div className="text-xs font-bold text-[#000080] px-3 py-1">{t("taskbar.openWindows")}</div>
                  {openWindows.map((window) => (
                    <button
                      key={window.id}
                      type="button"
                      onClick={() => handleWindowButton(window.id)}
                      className={`w-full text-left px-3 py-2 border border-[#808080] flex items-center ${
                        activeWindow === window.id
                          ? "bg-[#000080] text-white shadow-win98-inner"
                          : "bg-win98-face shadow-win98-outer hover:bg-[#d4d0c8]"
                      }`}
                    >
                      {window.icon ? (
                        <Image src={window.icon} alt="" width={16} height={16} className="flex-shrink-0 mr-2" />
                      ) : (
                        <div className="w-3 h-3 bg-win98-face border border-[#808080] mr-2 flex items-center justify-center">
                          {activeWindow === window.id && <div className="w-1.5 h-1.5 bg-[#000080]" />}
                        </div>
                      )}
                      <span className="text-sm truncate">{window.title}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-[#808080] pt-1">
                <div className="text-xs font-bold text-[#000080] px-3 py-1">{t("taskbar.language")}</div>
                <div className="grid grid-cols-3 gap-1">
                  {Object.values(Locale).map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => i18n.changeLanguage(locale)}
                      className={`px-2 py-2 border border-[#808080] flex items-center justify-center ${
                        i18n.language === locale
                          ? "bg-[#000080] text-white shadow-win98-inner"
                          : "bg-win98-face shadow-win98-outer hover:bg-[#d4d0c8]"
                      }`}
                    >
                      <span className="text-xs">{LOCALE_LABELS[locale]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#808080] pt-1">
                <div className="text-xs font-bold text-[#000080] px-3 py-1">{t("taskbar.community")}</div>
                <SocialLinks variant="mobile" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})
