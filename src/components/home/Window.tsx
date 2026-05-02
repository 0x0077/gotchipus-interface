"use client"

import React, { useState, useRef, useEffect, useCallback, memo } from "react"
import Image from "next/image"
import { X, Minus } from "lucide-react"
import type { WindowType } from "@/lib/types"
import { WINDOW_BREAKPOINTS, WINDOW_MAX_CONTENT_WIDTH } from "@/lib/constant"
import { WindowModeProvider } from "@/hooks/useWindowMode"
import { useDragResize, type ResizeDirection } from "@/hooks/useDragResize"
import ResizeHandleIcon from "@assets/icons/ResizeHandleIcon"

const EDGE_HANDLES = [
  { dir: 'top', cursor: 'cursor-ns-resize', hoverSize: 'hover:h-1.5', style: { top: '-2px', left: 0, right: 0, height: '6px' } as React.CSSProperties },
  { dir: 'right', cursor: 'cursor-ew-resize', hoverSize: 'hover:w-1.5', style: { top: 0, right: '-2px', bottom: 0, width: '6px' } as React.CSSProperties },
  { dir: 'bottom', cursor: 'cursor-ns-resize', hoverSize: 'hover:h-1.5', style: { bottom: '-2px', left: 0, right: 0, height: '6px' } as React.CSSProperties },
  { dir: 'left', cursor: 'cursor-ew-resize', hoverSize: 'hover:w-1.5', style: { top: 0, left: '-2px', bottom: 0, width: '6px' } as React.CSSProperties },
] as const

// NOTE: top corners currently bind to 'left'/'right' (horizontal resize only) — matches cursor-ew-resize.
// Preserving existing behavior; revisit if we want true diagonal top-corner resize.
const CORNER_HANDLES = [
  { dir: 'left',         cursor: 'cursor-ew-resize',    hintClass: 'top-0 left-0 border-l-2',                style: { top: '-2px', left: '-2px', width: '12px', height: '12px' } as React.CSSProperties },
  { dir: 'right',        cursor: 'cursor-ew-resize',    hintClass: 'top-0 right-0 border-r-2',               style: { top: '-2px', right: '-2px', width: '12px', height: '12px' } as React.CSSProperties },
  { dir: 'bottom-left',  cursor: 'cursor-nesw-resize',  hintClass: 'bottom-0 left-0 border-b-2 border-l-2',  style: { bottom: '-2px', left: '-2px', width: '12px', height: '12px' } as React.CSSProperties },
  { dir: 'bottom-right', cursor: 'cursor-nwse-resize',  hintClass: 'bottom-0 right-0 border-b-2 border-r-2', style: { bottom: '-2px', right: '-2px', width: '12px', height: '12px' } as React.CSSProperties },
] as const

interface WindowProps {
  window: WindowType
  isActive: boolean
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onActivate: (id: string) => void
  onMove: (id: string, position: { x: number; y: number }) => void
  onResize: (id: string, size: { width: number; height: number }, position?: { x: number; y: number }) => void
  isMobile?: boolean
}

function Window({ window, isActive, onClose, onMinimize, onActivate, onMove, onResize, isMobile = false }: WindowProps) {
  const [isAppearing, setIsAppearing] = useState(true)
  const windowRef = useRef<HTMLDivElement>(null)

  const isMobileMode = window.size.width <= WINDOW_BREAKPOINTS.MOBILE
  const maxContentWidth = WINDOW_MAX_CONTENT_WIDTH[window.id] || WINDOW_MAX_CONTENT_WIDTH.default
  const isWiderThanMax = window.size.width > maxContentWidth

  useEffect(() => {
    const timeout = setTimeout(() => setIsAppearing(false), 300)
    return () => clearTimeout(timeout)
  }, [])

  // Snapshot geometry at pointerdown — resize math uses it as the reference frame.
  const geomRef = useRef({ x: window.position.x, y: window.position.y, width: window.size.width, height: window.size.height })
  geomRef.current = { x: window.position.x, y: window.position.y, width: window.size.width, height: window.size.height }

  const handleDragMove = useCallback((pos: { x: number; y: number }) => {
    onMove(window.id, pos)
  }, [onMove, window.id])

  const handleResizeMove = useCallback(
    (size: { width: number; height: number }, pos?: { x: number; y: number }) => {
      onResize(window.id, size, pos)
    },
    [onResize, window.id]
  )

  const handleActivateForHook = useCallback(() => {
    onActivate(window.id)
  }, [onActivate, window.id])

  const { onDragPointerDown, onResizePointerDown } = useDragResize({
    onDragMove: handleDragMove,
    onResizeMove: handleResizeMove,
    getGeometry: () => geomRef.current,
    onActivate: handleActivateForHook,
  })

  // Title bar drag: skip when the pointerdown lands on a button (X / minimize).
  const handleTitleBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target?.tagName === "BUTTON" || target?.closest("button")) return
    e.preventDefault()
    onDragPointerDown(e)
  }

  // `active:border-*` below opts the window chrome out of `.win98-bezel:active`
  // press-invert — mousedown inside (e.g. chat input) should not flip the bevel.
  return (
    <div
      ref={windowRef}
      className={`absolute win98-bezel shadow-win98-outer bg-win98-face overflow-hidden active:border-t-white active:border-l-white active:border-r-win98-shadow active:border-b-win98-shadow ${
        isAppearing ? "animate-window-appear origin-center" : ""
      } ${isMobile ? 'touch-manipulation' : ''}`}
      style={{
        left: `${window.position.x}px`,
        top: `${window.position.y}px`,
        width: `${window.size.width}px`,
        height: `${window.size.height}px`,
        zIndex: window.zIndex,
      }}
      onClick={() => onActivate(window.id)}
    >
      <div
        className={`h-7 flex items-center justify-between pl-3 pr-1.5 cursor-move ${
          isActive ? "bg-uni-bg-02 text-white" : "bg-[#808080] text-[#c0c0c0]"
        }`}
        onPointerDown={handleTitleBarPointerDown}
      >
        <div className="flex items-center gap-2 truncate">
          {window.icon && (
            <Image
              src={window.icon}
              alt=""
              width={20}
              height={20}
              className="flex-shrink-0"
            />
          )}
          <div className="text-base font-bold truncate">{window.title}</div>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Minimize"
            className="flex items-center justify-center border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-win98-face hover:bg-[#d4d0c8] active:bg-[#b0b0b0] w-[18px] h-[18px] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(window.id);
            }}
          >
            <Minus className="text-black w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Close"
            className="flex items-center justify-center border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-win98-face hover:bg-[#d4d0c8] active:bg-[#b0b0b0] w-[18px] h-[18px] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClose(window.id);
            }}
          >
            <X className="text-black w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>
      </div>

      <WindowModeProvider
        mode={isMobileMode ? 'mobile' : 'desktop'}
        width={window.size.width}
      >
        <div className="scrollbar-hide h-[calc(100%-var(--titlebar-h))] overflow-auto">
          {window.id === 'terminal' || window.id === 'pharos-world' ? (
            <div
              className={`h-full transition-all ${isWiderThanMax ? 'mx-auto' : ''}`}
              style={{
                maxWidth: isWiderThanMax ? `${maxContentWidth}px` : '100%',
                minWidth: isMobileMode ? '100%' : 'auto'
              }}
            >
              {window.content}
            </div>
          ) : (
            <div
              className={`h-full transition-all ${isWiderThanMax ? 'mx-auto' : ''} p-2`}
              style={{
                maxWidth: isWiderThanMax ? `${maxContentWidth}px` : '100%',
                minWidth: isMobileMode ? '100%' : 'auto'
              }}
            >
              {window.content}
            </div>
          )}
        </div>
      </WindowModeProvider>

      {!isMobile && (
        <>
          {EDGE_HANDLES.map(({ dir, cursor, hoverSize, style }) => (
            <div
              key={`edge-${dir}`}
              className={`absolute ${cursor} ${hoverSize} hover:bg-blue-400/20 transition-all`}
              style={style}
              onPointerDown={(e) => onResizePointerDown(dir as ResizeDirection, e)}
            />
          ))}
          {CORNER_HANDLES.map(({ dir, cursor, style, hintClass }) => (
            <div
              key={`corner-${dir}`}
              className={`absolute ${cursor} hover:bg-blue-400/30 transition-all z-10 group`}
              style={style}
              onPointerDown={(e) => onResizePointerDown(dir as ResizeDirection, e)}
            >
              <div className={`absolute w-2 h-2 border-[#808080] opacity-0 group-hover:opacity-100 transition-opacity ${hintClass}`} />
            </div>
          ))}
        </>
      )}

      {isMobile && (
        <div
          className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-10 flex items-end justify-end touch-manipulation"
          onPointerDown={(e) => onResizePointerDown('bottom-right', e)}
        >
          <div className="w-5 h-5 flex items-end justify-end">
            <ResizeHandleIcon className="text-[#808080]" />
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(Window)