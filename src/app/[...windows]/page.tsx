"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useWindowRouter } from "@/hooks/useWindowRouter"
import useResponsive from "@/hooks/useResponsive"
import Desktop from "@/components/home/Desktop"
import Taskbar from "@/components/home/Taskbar"
import Window from "@/components/home/Window"
import type { WindowType } from "@/lib/types"
import type { JSX } from "react/jsx-runtime"
import { WINDOW_SIZE } from "@/lib/constant"
import { getWindowIcon, getWindowContent } from "@/lib/windowConfig"
import { WINDOW_OPEN_EVENT, type WindowOpenEventDetail } from "@/lib/windowEvents"

export const runtime = 'edge';

function computeWindowLayout(windowId: string, existingCount: number, isMobile: boolean) {
  let size = {
    width: WINDOW_SIZE[windowId as keyof typeof WINDOW_SIZE].width,
    height: WINDOW_SIZE[windowId as keyof typeof WINDOW_SIZE].height,
  }
  let position: { x: number; y: number }

  if (isMobile) {
    size = {
      width: Math.min(window.innerWidth - 20, 400),
      height: Math.min(window.innerHeight - 120, 600),
    }
    if (windowId === "wallet-connect-tba") {
      position = {
        x: Math.max(5, (window.innerWidth - size.width) / 2),
        y: Math.max(40, (window.innerHeight - size.height) / 2),
      }
    } else {
      position = { x: 10, y: 60 }
    }
  } else {
    const centerX = Math.max(0, (window.innerWidth - size.width) / 2)
    const centerY = Math.max(0, (window.innerHeight - size.height) / 2)
    const offset = existingCount * 20
    position = { x: centerX + offset, y: centerY + offset }
  }

  return { size, position }
}

export default function CatchAllPage() {
  const [openWindows, setOpenWindows] = useState<WindowType[]>([])
  const zIndexRef = useRef(100)
  const isMobile = useResponsive()
  const windowRouter = useWindowRouter()

  const routerRef = useRef(windowRouter)
  routerRef.current = windowRouter
  const openWindowsRef = useRef(openWindows)
  openWindowsRef.current = openWindows
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile

  useEffect(() => {
    setOpenWindows((prev) =>
      prev.filter((window) => windowRouter.openWindows.includes(window.id))
    )
  }, [windowRouter.openWindows])

  const handleActivateWindow = useCallback((windowId: string) => {
    if (routerRef.current.activeWindow === windowId) return

    let newZIndex = zIndexRef.current
    if (windowId === "wallet-connect-tba") {
      newZIndex = Math.max(zIndexRef.current, 1000)
    }

    setOpenWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, zIndex: newZIndex, minimized: false } : w))
    )
    zIndexRef.current = Math.max(zIndexRef.current + 1, newZIndex + 1)

    routerRef.current.activateWindow(windowId)
  }, [])

  const handleCloseWindow = useCallback((windowId: string) => {
    routerRef.current.closeWindow(windowId)
  }, [])

  const handleMinimizeWindow = useCallback((windowId: string) => {
    setOpenWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, minimized: true } : w)))
  }, [])

  const handleMoveWindow = useCallback((windowId: string, position: { x: number; y: number }) => {
    setOpenWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, position } : w)))
  }, [])

  const handleResizeWindow = useCallback(
    (windowId: string, size: { width: number; height: number }, position?: { x: number; y: number }) => {
      setOpenWindows((prev) =>
        prev.map((w) => {
          if (w.id === windowId) {
            return { ...w, size, ...(position && { position }) }
          }
          return w
        })
      )
    },
    []
  )

  const handleRestoreWindow = useCallback((windowId: string) => {
    setOpenWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, minimized: false } : w)))
    handleActivateWindow(windowId)
  }, [handleActivateWindow])

  const handleOpenWindow = useCallback(
    (windowId: string, title: string, content: JSX.Element, icon?: string) => {
      if (openWindowsRef.current.some((w) => w.id === windowId)) {
        handleActivateWindow(windowId)
        return
      }

      const { size, position } = computeWindowLayout(
        windowId,
        openWindowsRef.current.length,
        isMobileRef.current
      )

      let windowZIndex = zIndexRef.current
      if (windowId === "wallet-connect-tba") {
        windowZIndex = Math.max(zIndexRef.current, 5000)
      }

      const newWindow: WindowType = {
        id: windowId,
        title,
        icon,
        content,
        position,
        size,
        zIndex: windowZIndex,
        minimized: false,
      }

      setOpenWindows((prev) => [...prev, newWindow])
      zIndexRef.current = Math.max(zIndexRef.current + 1, windowZIndex + 1)

      if (!routerRef.current.openWindows.includes(windowId)) {
        routerRef.current.openWindow(windowId)
      }

      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          handleActivateWindow(windowId)
        })
      } else {
        handleActivateWindow(windowId)
      }
    },
    [handleActivateWindow]
  )

  useEffect(() => {
    windowRouter.openWindows.forEach((windowId) => {
      if (openWindowsRef.current.some((w) => w.id === windowId)) return

      const icon = getWindowIcon(windowId)
      if (!icon) return

      const content = getWindowContent(windowId)
      handleOpenWindow(windowId, icon.title, content, icon.icon)
    })
  }, [windowRouter.openWindows, handleOpenWindow])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleExternalOpen = (event: Event) => {
      const { windowId } = (event as CustomEvent<WindowOpenEventDetail>).detail || {}
      if (!windowId) return

      const icon = getWindowIcon(windowId)
      if (!icon) return

      const content = getWindowContent(windowId)
      handleOpenWindow(windowId, icon.title, content, icon.icon)
    }

    window.addEventListener(WINDOW_OPEN_EVENT, handleExternalOpen)
    return () => {
      window.removeEventListener(WINDOW_OPEN_EVENT, handleExternalOpen)
    }
  }, [handleOpenWindow])

  return (
    <main className={`w-full min-w-[800px] min-h-screen overflow-auto bg-uni-bg-01 relative ${isMobile ? 'touch-manipulation' : ''}`}>
      <Desktop
        onOpenWindow={handleOpenWindow}
        activeWindow={windowRouter.activeWindow}
        isMobile={isMobile}
        openWindowIds={openWindows.map((w) => w.id)}
      />

      {openWindows.map(
        (window) =>
          !window.minimized && (
            <Window
              key={window.id}
              window={window}
              isActive={windowRouter.activeWindow === window.id}
              onClose={handleCloseWindow}
              onMinimize={handleMinimizeWindow}
              onActivate={handleActivateWindow}
              onMove={handleMoveWindow}
              onResize={handleResizeWindow}
              isMobile={isMobile}
            />
          )
      )}

      <Taskbar
        onOpenWindow={handleOpenWindow}
        openWindows={openWindows}
        activeWindow={windowRouter.activeWindow}
        onActivateWindow={handleActivateWindow}
        onRestoreWindow={handleRestoreWindow}
        isMobile={isMobile}
      />
    </main>
  )
}
