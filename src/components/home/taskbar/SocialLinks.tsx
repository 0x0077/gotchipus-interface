"use client"

import Link from "next/link"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import XIcon from "@assets/icons/XIcon"
import DiscordIcon from "@assets/icons/DiscordIcon"
import GithubIcon from "@assets/icons/GithubIcon"
import DocsIcon from "@assets/icons/DocsIcon"

interface SocialLinksProps {
  variant: "mobile" | "desktop"
}

const LINKS = [
  { href: "https://x.com/gotchipus", Icon: XIcon, labelKey: "taskbar.xTwitter" },
  { href: "https://discord.gg/gotchilabs", Icon: DiscordIcon, labelKey: "taskbar.discord" },
  { href: "https://github.com/gotchipus", Icon: GithubIcon, labelKey: "taskbar.github" },
  { href: "https://docs.gotchipus.com", Icon: DocsIcon, labelKey: "taskbar.docs" },
] as const

function SocialLinksBase({ variant }: SocialLinksProps) {
  const { t } = useTranslation()

  if (variant === "mobile") {
    return (
      <div className="grid grid-cols-2 gap-1">
        {LINKS.map(({ href, Icon, labelKey }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            className="px-3 py-2 bg-win98-face border border-[#808080] shadow-win98-outer hover:bg-[#d4d0c8] flex items-center justify-center"
          >
            <Icon width={16} height={16} />
            <span className="text-xs">{t(labelKey)}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-row gap-2 items-center bg-win98-face px-2 border border-[#808080] cursor-pointer shadow-win98-inner h-10">
      {LINKS.map(({ href, Icon }) => (
        <Link key={href} href={href} target="_blank">
          <Icon width={24} height={24} />
        </Link>
      ))}
    </div>
  )
}

export const SocialLinks = memo(SocialLinksBase)
