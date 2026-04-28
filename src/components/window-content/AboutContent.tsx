'use client'

import Image from "next/image"
import { Trans, useTranslation } from "react-i18next"
import { useWindowMode } from "@/hooks/useWindowMode"

const PARTNERS = [
  { name: "FaroSwap", img: "/partners/faroswap.png" },
  { name: "Zenith", img: "/partners/zenith.svg" },
  { name: "Zentra", img: "/partners/zentra.png" },
  { name: "BrokeX", img: "/partners/brokex.png" },
  { name: "AutoStaking", img: "/partners/autostaking.png" },
  { name: "PNS", img: "/partners/pns.png" },
  { name: "Spout", img: "/partners/spout.png" },
];

export default function AboutContent() {
  const { t } = useTranslation()
  const { isMobile } = useWindowMode()

  return (
    <div className={`bg-win98-face w-full h-full ${isMobile ? 'p-2' : 'p-4'} space-y-4`}>
      
      <div className="bg-win98-face win98-bezel p-4">
        <div className="flex items-center space-x-4">
          <div className="bg-white border border-[#808080]">
            <Image 
              src="/favicon.png" 
              alt="App Icon" 
              width={48} 
              height={48} 
              className="pixelated"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t("about.appName")}</h2>
            <p className="text-sm">{t("about.version")}</p>
            <p className="text-xs text-gray-600">{t("about.copyright")}</p>
          </div>
        </div>
      </div>

      <div className="bg-win98-face win98-bezel-inset p-3">
        <h3 className="font-bold mb-2 text-sm">{t("about.title")}</h3>
        <p className="text-sm leading-relaxed">
          <Trans i18nKey="about.about">{t("about.about")}</Trans>
        </p>
      </div>

      <div className="bg-win98-face win98-bezel-inset p-4">
        <h3 className="font-bold mb-3 text-sm">{t("about.partners.title")}</h3>
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {PARTNERS.map((partner) => (
            <div key={partner.name} className="bg-win98-face win98-bezel p-3 hover:bg-[#b8b8b8] transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="bg-white border border-[#808080] p-1">
                  <Image src={partner.img} alt={partner.name} width={32} height={32} className="pixelated" />
                </div>
                <span className="text-sm font-bold">{partner.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}