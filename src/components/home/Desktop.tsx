"use client"

import Image from "next/image"
import { useState, useCallback, useMemo, useRef } from "react"
import { useWindowRouter } from "@/hooks/useWindowRouter"
import DesktopIcon from "@/components/home/DesktopIcon"
import type { JSX } from "react/jsx-runtime"
import { getEnabledWindowIcons, getWindowContent } from "@/lib/windowConfig"

interface DesktopProps {
  onOpenWindow: (id: string, title: string, content: JSX.Element, icon?: string) => void
  activeWindow: string | null
  isMobile?: boolean
  openWindowIds?: string[]
}

export default function Desktop({ onOpenWindow, isMobile = false, openWindowIds = [] }: DesktopProps) {
  const [activeIcon, setActiveIcon] = useState<string | null>(null)
  const windowRouter = useWindowRouter()
  const icons = getEnabledWindowIcons()

  const MAX_ICONS_PER_COLUMN = 6

  const columns = useMemo(() => {
    const numberOfColumns = Math.ceil(icons.length / MAX_ICONS_PER_COLUMN)
    return Array.from({ length: numberOfColumns }, (_, columnIndex) => {
      const columnStart = columnIndex * MAX_ICONS_PER_COLUMN
      const columnEnd = Math.min((columnIndex + 1) * MAX_ICONS_PER_COLUMN, icons.length)
      return icons.slice(columnStart, columnEnd)
    })
  }, [icons])

  const routerRef = useRef(windowRouter)
  routerRef.current = windowRouter
  const onOpenWindowRef = useRef(onOpenWindow)
  onOpenWindowRef.current = onOpenWindow
  const iconsRef = useRef(icons)
  iconsRef.current = icons

  const handleIconClick = useCallback((iconId: string) => {
    setActiveIcon(iconId)
    routerRef.current.openWindow(iconId)
    const icon = iconsRef.current.find(i => i.id === iconId)
    if (icon) {
      const content = getWindowContent(iconId)
      onOpenWindowRef.current(iconId, icon.title, content, icon.icon)
    }
  }, [])

  return (
    <div className={`top-0 left-0 w-full h-[calc(100%-var(--titlebar-h))] p-4 flex flex-col items-start gap-2 relative ${isMobile ? 'p-2' : ''}`}>
      <div className="fixed inset-0 bottom-[var(--titlebar-h)] flex items-center justify-center pb-[10%] z-0 pointer-events-none">
        <Image
          src="/gotchipus.png"
          alt="Gotchipus"
          width={isMobile ? 300 : 600}
          height={isMobile ? 300 : 600}
          className="object-contain"
          priority
        />
      </div>
      
      <div className={`relative z-10 flex flex-row gap-4 p-2 ${isMobile ? 'gap-2 p-1' : ''}`}>
        {columns.map((columnIcons, columnIndex) => (
          <div key={`column-${columnIndex}`} className={`flex flex-col gap-2 ${isMobile ? 'gap-1' : ''}`}>
            {columnIcons.map((icon) => {
              const isActive = openWindowIds.includes(icon.id) && windowRouter.activeWindow === icon.id;
              return (
                <DesktopIcon
                  key={icon.id}
                  id={icon.id}
                  title={icon.title}
                  icon={icon.icon}
                  onClick={handleIconClick}
                  isActive={isActive}
                  isMobile={isMobile}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

