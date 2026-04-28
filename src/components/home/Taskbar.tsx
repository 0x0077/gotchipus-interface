"use client"

import type { JSX } from "react"
import type { WindowType } from "@/lib/types"
import { TaskbarDesktop } from "./taskbar/TaskbarDesktop"
import { TaskbarMobile } from "./taskbar/TaskbarMobile"

interface TaskbarProps {
  onOpenWindow: (id: string, title: string, content: JSX.Element, icon?: string) => void
  openWindows: WindowType[]
  activeWindow: string | null
  onActivateWindow: (id: string) => void
  onRestoreWindow: (id: string) => void
  isMobile?: boolean
}

export default function Taskbar(props: TaskbarProps) {
  const { isMobile, ...rest } = props
  return isMobile ? <TaskbarMobile {...rest} /> : <TaskbarDesktop {...rest} />
}
