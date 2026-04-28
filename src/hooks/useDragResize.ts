"use client"

import { useRef } from "react"

export type ResizeDirection =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

type Mode = "drag" | ResizeDirection

interface Geometry {
  x: number
  y: number
  width: number
  height: number
}

interface UseDragResizeOptions {
  onDragMove: (pos: { x: number; y: number }) => void
  onResizeMove: (size: { width: number; height: number }, pos?: { x: number; y: number }) => void
  /** Snapshot taken at pointerdown; used as the reference frame for the whole gesture. */
  getGeometry: () => Geometry
  onActivate: () => void
  minWidth?: number
  minHeight?: number
}

interface StartState {
  mode: Mode
  startX: number
  startY: number
  offsetX: number // for drag
  offsetY: number
  origW: number // for resize
  origH: number
  origX: number
  origY: number
  target: HTMLElement
  pointerId: number
}

/**
 * Unified pointer-based drag + resize. Uses `setPointerCapture` so the same
 * element receives all subsequent pointermove/up events even outside its bounds
 * — eliminating separate mouse/touch code paths and document-level listeners.
 *
 * rAF-coalesced: at most one onMove/onResize call per frame.
 */
export function useDragResize({
  onDragMove,
  onResizeMove,
  getGeometry,
  onActivate,
  minWidth = 300,
  minHeight = 200,
}: UseDragResizeOptions) {
  // Mirror mutable options so stable handlers always read the latest closures.
  const optsRef = useRef({ onDragMove, onResizeMove, minWidth, minHeight })
  optsRef.current = { onDragMove, onResizeMove, minWidth, minHeight }

  const stateRef = useRef<StartState | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingRef = useRef<{ clientX: number; clientY: number } | null>(null)

  // Lazy-init stable handlers — referential equality matters for removeEventListener.
  const handlersRef = useRef<{
    move: (e: PointerEvent) => void
    up: (e: PointerEvent) => void
  } | null>(null)

  if (!handlersRef.current) {
    const flush = () => {
      rafRef.current = null
      const pending = pendingRef.current
      pendingRef.current = null
      const s = stateRef.current
      if (!pending || !s) return

      const { clientX, clientY } = pending
      const { onDragMove, onResizeMove, minWidth, minHeight } = optsRef.current

      if (s.mode === "drag") {
        onDragMove({ x: clientX - s.offsetX, y: clientY - s.offsetY })
        return
      }

      const deltaX = clientX - s.startX
      const deltaY = clientY - s.startY
      const maxW = typeof globalThis.window !== "undefined" ? globalThis.window.innerWidth - 20 : 1600
      const maxH = typeof globalThis.window !== "undefined" ? globalThis.window.innerHeight - 80 : 1200

      let newW = s.origW
      let newH = s.origH
      let newX = s.origX
      let newY = s.origY
      const dir = s.mode

      if (dir.includes("right")) {
        newW = Math.min(Math.max(minWidth, s.origW + deltaX), maxW - newX)
      }
      if (dir.includes("left")) {
        const pot = s.origW - deltaX
        newW = Math.max(minWidth, Math.min(pot, s.origX + s.origW - 10))
        if (newW > minWidth && pot >= minWidth) {
          newX = Math.max(10, s.origX + deltaX)
        }
      }
      if (dir.includes("bottom")) {
        newH = Math.min(Math.max(minHeight, s.origH + deltaY), maxH - newY)
      }
      if (dir.includes("top")) {
        const pot = s.origH - deltaY
        newH = Math.max(minHeight, Math.min(pot, s.origY + s.origH - 40))
        if (newH > minHeight && pot >= minHeight) {
          newY = Math.max(20, s.origY + deltaY)
        }
      }

      onResizeMove(
        { width: newW, height: newH },
        newX !== s.origX || newY !== s.origY ? { x: newX, y: newY } : undefined
      )
    }

    const schedule = (clientX: number, clientY: number) => {
      pendingRef.current = { clientX, clientY }
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(flush)
    }

    const endOp = () => {
      const s = stateRef.current
      if (!s) return
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        if (pendingRef.current) flush()
      }
      const h = handlersRef.current!
      s.target.removeEventListener("pointermove", h.move)
      s.target.removeEventListener("pointerup", h.up)
      s.target.removeEventListener("pointercancel", h.up)
      try {
        s.target.releasePointerCapture(s.pointerId)
      } catch {
        /* capture may already be released (e.g. pointercancel) */
      }
      s.target.style.userSelect = ""
      stateRef.current = null
    }

    handlersRef.current = {
      move: (e: PointerEvent) => {
        if (!stateRef.current) return
        e.preventDefault()
        schedule(e.clientX, e.clientY)
      },
      up: () => endOp(),
    }
  }

  const begin = (mode: Mode, e: React.PointerEvent<HTMLElement>) => {
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const g = mode === "drag" ? null : getGeometry()
    stateRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      origW: g?.width ?? 0,
      origH: g?.height ?? 0,
      origX: g?.x ?? 0,
      origY: g?.y ?? 0,
      target,
      pointerId: e.pointerId,
    }
    try {
      target.setPointerCapture(e.pointerId)
    } catch {
      /* older browsers */
    }
    const h = handlersRef.current!
    target.addEventListener("pointermove", h.move)
    target.addEventListener("pointerup", h.up)
    target.addEventListener("pointercancel", h.up)
    target.style.userSelect = "none"
    onActivate()
  }

  const onDragPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    begin("drag", e)
  }

  const onResizePointerDown = (dir: ResizeDirection, e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation()
    begin(dir, e)
  }

  return { onDragPointerDown, onResizePointerDown }
}
