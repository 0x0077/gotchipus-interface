"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import Link from "next/link";
import ExternalLinkIcon from "@assets/icons/ExternalLinkIcon";
import { Win98GroupBox, TokenItem, NftCollection } from "./GotchiDetailHelpers";
import { chiNameSvgDataUri } from "@/src/utils/chiNameSvg";

interface TbaAssetsPanelProps {
  tokens: TokenItem[];
  nftCollections: NftCollection[];
  tbaAddress: string;
  totalUsd: number;
}

export function TbaAssetsPanel({ tokens, nftCollections, tbaAddress, totalUsd }: TbaAssetsPanelProps) {
  const { t } = useTranslation();
  const [walletTab, setWalletTab] = useState<"tokens" | "nfts">("tokens");
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);

  const totalNfts = nftCollections.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <Win98GroupBox label={`TBA Assets — ${tbaAddress ? `${tbaAddress.slice(0, 6)}...${tbaAddress.slice(-4)}` : "N/A"}`}>
      <div className="flex gap-1 mb-1.5 items-center">
        <button
          onClick={() => setWalletTab("tokens")}
          className={`px-2.5 py-1 text-xs font-medium border cursor-pointer transition-colors ${
            walletTab === "tokens"
              ? "border-t-[#404040] border-l-[#404040] border-r-white border-b-white bg-[#e8f5ee] text-[#006633] shadow-[inset_1px_1px_0_#808080] pt-1.5 pl-3"
              : "border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-win98-face text-[#333333] hover:bg-[#b0b0b0]"
          }`}
        >
          <span className={walletTab === "tokens" ? "text-[#006633]" : "text-[#555555]"}>■ </span>
          {t('terminal.detail.tokens')} ({tokens.length})
        </button>
        <button
          onClick={() => setWalletTab("nfts")}
          className={`px-2.5 py-1 text-xs font-medium border cursor-pointer transition-colors ${
            walletTab === "nfts"
              ? "border-t-[#404040] border-l-[#404040] border-r-white border-b-white bg-[#f5eeff] text-[#6600aa] shadow-[inset_1px_1px_0_#808080] pt-1.5 pl-3"
              : "border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-win98-face text-[#333333] hover:bg-[#b0b0b0]"
          }`}
        >
          <span className={walletTab === "nfts" ? "text-[#6600aa]" : "text-[#555555]"}>■ </span>
          {t('terminal.detail.nfts')} ({totalNfts})
        </button>
        <div className="flex-1" />
        <button className="px-2.5 py-1 text-xs font-medium border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face text-[#333333] hover:bg-[#b0b0b0]">
          {t('common.deposit')}
        </button>
        <button className="px-2.5 py-1 text-xs font-medium border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face text-[#333333] hover:bg-[#b0b0b0]">
          {t('common.send')}
        </button>
      </div>

      <div className="border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] bg-white">
        {walletTab === "tokens" && (
          <>
            <div className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_32px] px-2 py-1 border-b border-[#808080] bg-win98-face text-xs font-bold">
              <span>{t('terminal.detail.asset')}</span>
              <span className="text-right">{t('terminal.detail.balance')}</span>
              <span className="text-right">{t('terminal.detail.valueUsd')}</span>
              <span className="text-right">{t('terminal.detail.contract')}</span>
              <span></span>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
            {tokens.map((tk, i) => (
              <div
                key={i}
                className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_32px] px-2 py-1.5 border-b border-[#e0e0e0] items-center cursor-pointer transition-colors hover:bg-[#eef2fb]"
                style={{ background: i % 2 === 0 ? "#ffffff" : "#f8f8f8" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#eef2fb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "#f8f8f8"; }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] bg-[#e0e0e0] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {tk.logoPath && tk.logoPath !== "/tokens/default.png" ? (
                      <Image src={tk.logoPath} alt={tk.symbol} width={16} height={16} className="object-contain" />
                    ) : (
                      <span className="text-[8px] font-bold text-[#333] leading-none select-none">
                        {(tk.symbol || tk.name || "??").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{tk.symbol}</div>
                    <div className="text-xs text-[#808080]">{tk.name}</div>
                  </div>
                </div>
                <div className="text-right text-xs font-courier">
                  {tk.amount < 1 ? tk.amount.toFixed(4) : tk.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-right text-xs font-courier">
                  ${tk.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-right text-xs text-[#808080] font-courier">
                  {tk.contract === "native"
                    ? t('terminal.detail.native')
                    : `${tk.contract.slice(0, 6)}...${tk.contract.slice(-7)}`}
                </div>
                <div className="flex items-center justify-center">
                  <Link
                    href={tk.contract === "native" ? `https://pharosscan.xyz/address/${tbaAddress}` : `https://pharosscan.xyz/token/${tk.contract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0000ff] flex items-center"
                  >
                    <ExternalLinkIcon width={12} height={12} />
                  </Link>
                </div>
              </div>
            ))}
            </div>
            <div className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_32px] px-2 py-1.5 bg-[#f0f0f0] border-t border-[#808080] text-xs font-bold">
              <span>{t('terminal.detail.total')}</span>
              <span></span>
              <span className="text-right font-courier">
                ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span></span>
              <span></span>
            </div>
          </>
        )}

        {walletTab === "nfts" && (
          totalNfts === 0 ? (
            <div className="text-center py-6 text-[#808080]">
              <div className="text-xs">{t('terminal.detail.noNfts')}</div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {nftCollections.map((collection) => (
                <div key={collection.type}>
                  <button
                    onClick={() => setExpandedCollection(expandedCollection === collection.type ? null : collection.type)}
                    className="w-full flex items-center gap-1.5 px-1.5 py-1 bg-win98-face border border-t-white border-l-white border-r-[#404040] border-b-[#404040] cursor-pointer hover:bg-[#b0b0b0] text-left"
                  >
                    <span className="text-[10px] font-bold text-[#000]">
                      {expandedCollection === collection.type ? "▼" : "►"}
                    </span>
                    <span className="text-xs font-bold text-[#000]">
                      {collection.label}
                    </span>
                    <span className="text-[10px] text-[#808080]">({collection.items.length})</span>
                  </button>

                  {expandedCollection !== collection.type && (
                    <div className="mt-1 flex gap-1.5 flex-wrap">
                      <div
                        onClick={() => setExpandedCollection(collection.type)}
                        className="w-[100px] h-[100px] border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] bg-[#e0e0e0] relative cursor-pointer overflow-hidden"
                      >
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px p-1">
                          {collection.items.slice(0, 4).map((item) => (
                            <div key={item.tokenId} className="bg-white border border-win98-face flex items-center justify-center overflow-hidden">
                              {collection.type === "wearable" && item.imagePath ? (
                                <Image src={item.imagePath} alt={item.name} width={36} height={36} className="object-contain" />
                              ) : collection.type === "chiname" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={chiNameSvgDataUri(item.name.replace(/\.chi$/, ""))} alt={item.name} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-[8px] text-[#808080]">#{item.tokenId}</span>
                              )}
                            </div>
                          ))}
                          {Array.from({ length: Math.max(0, 4 - collection.items.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-white border border-win98-face" />
                          ))}
                        </div>
                        <span className="absolute bottom-1 right-1 text-[9px] font-bold text-[#000] bg-win98-face border border-t-white border-l-white border-r-[#404040] border-b-[#404040] px-1 py-px">
                          {collection.items.length}
                        </span>
                      </div>
                    </div>
                  )}

                  {expandedCollection === collection.type && (
                    <div className="mt-1 border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] bg-white p-1.5 max-h-[200px] overflow-y-auto">
                      {collection.type === "wearable" ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1">
                          {collection.items.map((item) => (
                            <div
                              key={item.tokenId}
                              className="aspect-square border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-[#e0e0e0] flex flex-col items-center justify-center overflow-hidden relative"
                            >
                              {item.imagePath ? (
                                <Image src={item.imagePath} alt={item.name} width={48} height={48} className="object-contain" />
                              ) : (
                                <span className="text-[9px] text-[#808080]">#{item.tokenId}</span>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-win98-face border-t border-[#808080] px-0.5 py-px">
                                <span className="text-[7px] font-bold text-[#000] block truncate text-center">
                                  #{item.tokenId}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : collection.type === "chiname" ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1">
                          {collection.items.map((item) => (
                            <div
                              key={item.tokenId}
                              className="aspect-square border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] overflow-hidden"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={chiNameSvgDataUri(item.name.replace(/\.chi$/, ""))} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1">
                          {collection.items.map((item) => (
                            <div
                              key={item.tokenId}
                              className="aspect-square border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-[#e0e0e0] flex flex-col items-center justify-center overflow-hidden relative"
                            >
                              {item.imagePath ? (
                                <Image src={item.imagePath} alt={item.name} width={48} height={48} className="object-contain" />
                              ) : (
                                <span className="text-[9px] text-[#808080]">#{item.tokenId}</span>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-win98-face border-t border-[#808080] px-0.5 py-px">
                                <span className="text-[7px] font-bold text-[#000] block truncate text-center">
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </Win98GroupBox>
  );
}
