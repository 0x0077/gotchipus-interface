"use client"

import { memo } from "react"
import Image from "next/image"
import type { DesktopIconProps } from "@/lib/types"

function DesktopIcon({ id, title, icon, onClick, isActive, isMobile = false }: DesktopIconProps) {
  return (
    <button
      type="button"
      aria-label={title}
      className={`flex flex-col items-center cursor-pointer p-2 transition-all hover:-translate-y-0.5 group bg-transparent border-none focus:outline-none focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-white focus-visible:outline-offset-[-2px] ${
        isMobile ? 'w-24' : 'w-24'
      }`}
      onClick={() => onClick(id)}
    >
      <div className={`mb-1 transition-transform ${isActive ? '-translate-y-1' : ''}`}>
        <Image
          src={icon}
          alt={title}
          width={isMobile ? 48 : 48}
          height={isMobile ? 48 : 48}
          className="drop-shadow-lg"
        />
      </div>

      <div
        className={`text-center px-1 text-sm font-medium leading-snug max-w-full break-words rounded-sm whitespace-normal  ${
          isActive
            ? "bg-[#00008010] text-white"
            : "text-white group-hover:bg-[#00008010]"
        }`}
        style={{
          textShadow: isActive ? 'none' : '1px 1px 2px rgba(0,0,0,0.9)',
        }}
      >
        {title}
      </div>
    </button>
  )
}

export default memo(DesktopIcon)

