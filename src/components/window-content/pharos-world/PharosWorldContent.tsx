'use client'

import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStores } from '@stores/context'
import { useAuth } from '@/hooks/useAuth'
import { useOwnerGotchis } from '@/hooks/useOwnerGotchis'
import usePharosStream, { PharosToolResultEvent } from '@/hooks/usePharosStream'
import {
  PharosFaction,
  PharosMessage,
  PharosMode,
  PharosNpcState,
  PharosRoomBrief,
  PharosSession,
  clearStoredConversationId,
  fetchPharosState,
  loadStoredConversationId,
  movePharosTo,
  saveStoredConversationId,
  startPharosSession,
} from '@/lib/pharos-world-api'
import { factionKey } from '@/lib/faction'


const MONO = 'font-mono'
const W98_BTN =
  'border border-t-white border-l-white border-r-[#404040] border-b-[#404040] ' +
  'shadow-[inset_1px_1px_0_#DFDFDF,inset_-1px_-1px_0_#808080] ' +
  'bg-[#C0C0C0] hover:bg-[#b0b0b0] ' +
  'active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white ' +
  'active:shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_#DFDFDF] ' +
  'px-3 py-1 text-xs text-black select-none disabled:opacity-50 disabled:cursor-not-allowed'


const ROOM_NAMES: Record<string, string> = {
  wharf_plaza: 'Wharf Plaza',
  the_tide_forge: 'The Tide Forge',
  salt_and_spire: 'Salt and Spire',
  lighthouse_chapel: 'The Pharos Chapel',
  anchor_tavern: 'The Anchor Tavern',
}

const ROOM_GIF: Record<string, string> = {
  wharf_plaza:        '/desktop/pharosworld/wharf-plaza.gif',
  the_tide_forge:     '/desktop/pharosworld/the-tide-forge.gif',
  salt_and_spire:     '/desktop/pharosworld/salt-and-spire.gif',
  lighthouse_chapel:  '/desktop/pharosworld/lighthouse-chapel.gif',
  anchor_tavern:      '/desktop/pharosworld/anchor-tavern.gif',
}

const NPC_DISPLAY: Record<
  string,
  { name: string; title: string; faction: 'combat' | 'defense' | 'technology' | 'neutral'; element: string | null; color: string; home_room: string }
> = {
  wick:    { name: 'Old Wick',        title: 'the Old Lighthouse-keeper',  faction: 'neutral',    element: null,       color: '#B5B5B5', home_room: 'anchor_tavern'      },
  brann:   { name: 'Brann',           title: 'the Smith of Tide Forge',    faction: 'combat',     element: 'flame',    color: '#FF6B6B', home_room: 'the_tide_forge'     },
  marlow:  { name: 'Marlow',          title: 'the Rift-walker',            faction: 'technology', element: 'water',    color: '#86E1FC', home_room: 'salt_and_spire'     },
  halyard: { name: 'Brother Halyard', title: 'Custodian of the Chapel',    faction: 'defense',    element: 'light',    color: '#FFCB6B', home_room: 'lighthouse_chapel'  },
}

const FACTION_COPY: Record<PharosFaction, { label: string; tagline: string; accent: string }> = {
  combat:     { label: 'Combat',     tagline: '+15% STR · Flame · Storm · Shadow', accent: '#FF6B6B' },
  defense:    { label: 'Defense',    tagline: '+15% DEF · Ice · Earth · Light',    accent: '#FFCB6B' },
  technology: { label: 'Technology', tagline: '+15% MIND · Lightning · Water · Void', accent: '#86E1FC' },
}

function chainFactionToPharos(n: number | undefined | null): PharosFaction | null {
  return factionKey(n) as PharosFaction | null
}


type DisplayMode = 'DO' | 'SAY' | 'STORY' | 'LOOK'
const DISPLAY_TO_API: Record<DisplayMode, PharosMode> = {
  DO: 'do', SAY: 'say', STORY: 'story', LOOK: 'look',
}

function modePlaceholder(mode: DisplayMode, room: string | null): string {
  const placeName = room ? ROOM_NAMES[room] ?? room : 'the world'
  switch (mode) {
    case 'DO':    return 'do an action…'
    case 'SAY':   return 'say something aloud…'
    case 'STORY': return 'narrate your character…'
    case 'LOOK':  return `look around ${placeName}…`
  }
}


function Dot({ tone = 'active' }: { tone?: 'active' | 'warn' | 'bad' }) {
  const color = tone === 'active' ? '#4ADE5C' : tone === 'warn' ? '#FFB86C' : '#FF6B6B'
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: color, boxShadow: `0 0 4px ${color}` }}
    />
  )
}

function GroupBox({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative border border-[#3A3A3A] bg-[#2A2A2A] pt-3.5 px-3 pb-3 ${className}`}>
      {title && (
        <div className={`${MONO} absolute -top-2 left-2.5 bg-[#1F1F1F] px-1.5 text-[#B5B5B5] text-[11px] tracking-wide`}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`${MONO} inline-flex items-center gap-1 px-1.5 py-px border border-[#4A4A4A] bg-[#1F1F1F] text-[#B5B5B5] text-[9px] ${className}`}
    >
      {children}
    </span>
  )
}

function Timestamp({ children }: { children: React.ReactNode }) {
  return <span className={`${MONO} text-[#7A7A7A] text-[10px] tracking-wide uppercase`}>{children}</span>
}

function PlayerAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className={`${MONO} flex items-center justify-center bg-[#1a0820] text-[#FFCB6B] font-bold border border-[#FFCB6B]`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      YOU
    </div>
  )
}

function paragraphsOf(text: string): string[] {
  return text.split(/\n\s*\n+/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean)
}

function renderInline(text: string): React.ReactNode {
  if (!text) return text
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|(?<![A-Za-z0-9_])_([^_\n]+)_(?![A-Za-z0-9_])/g
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      out.push(<code key={`c${key++}`} className="bg-[#1F1F1F] border border-[#3A3A3A] px-1 text-[12px] text-[#FFCB6B]">{m[1]}</code>)
    } else if (m[2] !== undefined || m[3] !== undefined) {
      out.push(<strong key={`b${key++}`} className="text-[#E8E8E8]">{m[2] ?? m[3]}</strong>)
    } else if (m[4] !== undefined || m[5] !== undefined) {
      out.push(<em key={`i${key++}`} className="text-[#B5B5B5]">{m[4] ?? m[5]}</em>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out.length === 1 ? out[0] : <>{out}</>
}

function NarratorAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-black border border-[#C792EA]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 16 16" shapeRendering="crispEdges">
        {/* tower */}
        <rect x="7" y="6" width="2" height="8" fill="#C792EA" />
        <rect x="6" y="13" width="4" height="1" fill="#C792EA" />
        {/* lantern */}
        <rect x="6" y="4" width="4" height="2" fill="#FFCB6B" />
        <rect x="7" y="3" width="2" height="1" fill="#FFCB6B" />
        {/* beam */}
        <rect x="2" y="4" width="3" height="1" fill="#FFCB6B" opacity="0.4" />
        <rect x="11" y="4" width="3" height="1" fill="#FFCB6B" opacity="0.4" />
      </svg>
    </div>
  )
}

function NarrativeRow({
  time, text, trailing, location,
}: {
  time: string
  text: string
  trailing?: React.ReactNode
  location?: string | null
}) {
  const paragraphs = paragraphsOf(text)
  const place = location ? (ROOM_NAMES[location] ?? location) : null
  return (
    <div className="flex gap-2.5 items-start">
      <NarratorAvatar size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 items-baseline">
          <span className="font-bold text-sm text-[#C792EA]">PHAROS</span>
          {place && (
            <span className={`${MONO} text-[#7A7A7A] text-[10px] tracking-wide uppercase`}>
              · {place}
            </span>
          )}
          <Timestamp>{time}</Timestamp>
        </div>
        <div className="bg-[#2A2A2A] border-l-2 border-[#C792EA] text-[#E8E8E8] text-sm leading-relaxed px-3 py-2 mt-1">
          {paragraphs.length === 0 && trailing ? (
            <p>{trailing}</p>
          ) : paragraphs.map((p, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {renderInline(p)}
              {i === paragraphs.length - 1 && trailing}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlayerRow({
  time, mode, content,
}: { time: string; mode: PharosMode | null | undefined; content: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <PlayerAvatar size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 items-baseline">
          <span className="font-bold text-sm text-[#FFCB6B]">YOU</span>
          {mode && <Chip>{mode.toUpperCase()}</Chip>}
          <Timestamp>{time}</Timestamp>
        </div>
        <div className="bg-[#FFCB6B]/[0.06] border-l-2 border-[#FFCB6B] text-[#E8E8E8] text-sm leading-snug px-3 py-2 mt-1 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  )
}

function SystemBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-[42px] bg-[#2A2A2A] border-l-2 border-[#555555] text-[#B5B5B5] italic text-xs px-2.5 py-1">
      {children}
    </div>
  )
}

function ScanCard({ data, mode }: { data: any; mode: PharosMode | undefined }) {
  // Only render for explicit player LOOK; auto-look from the engine should be silent.
  if (mode !== 'look') return null
  const room = data?.room
  if (!room) return null
  return (
    <div className="ml-[42px]">
      <GroupBox className="!p-2.5">
        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#3A3A3A]">
          <div className="flex items-center gap-1.5">
            <Dot />
            <span className={`${MONO} text-[11px] text-[#E8E8E8]`}>SCANNING SURROUNDINGS</span>
          </div>
          <Timestamp>{room.name ?? room.id}</Timestamp>
        </div>
        <table className={`${MONO} w-full text-[11px] text-[#E8E8E8] border-collapse`}>
          <tbody>
            {Object.entries(room.exits ?? {}).map(([dir, target]) => (
              <tr key={dir}>
                <td className="text-[#7A7A7A] py-[3px] w-[80px]">{dir}</td>
                <td className="py-[3px]">{ROOM_NAMES[target as string] ?? (target as string)}</td>
              </tr>
            ))}
            {(room.present_npcs ?? []).map((npcId: string) => {
              const display = NPC_DISPLAY[npcId]
              return (
                <tr key={'npc-' + npcId}>
                  <td className="text-[#7A7A7A] py-[3px]">here</td>
                  <td className="py-[3px]">
                    {display?.name ?? npcId}
                    {display && (
                      <span style={{ color: display.color }}> · {display.faction}{display.element ? ` / ${display.element}` : ''}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GroupBox>
    </div>
  )
}

function ThresholdCard({ data }: { data: any }) {
  const before = Number(data?.rapport_before)
  const after = Number(data?.rapport_after)
  const crossed = data?.threshold_crossed
  if (!Number.isFinite(before) || !Number.isFinite(after)) return null
  if (typeof crossed !== 'number') return null

  const npcId = data?.npc_id as string | undefined
  const display = npcId ? NPC_DISPLAY[npcId] : undefined

  return (
    <div className="ml-[42px] relative border border-[#4ADE5C] bg-[#4ADE5C]/[0.04] p-2.5">
      <div className={`${MONO} absolute -top-2 left-2.5 bg-[#1F1F1F] px-1.5 text-[#4ADE5C] text-[11px] tracking-wide`}>
        ✓ rapport.threshold
      </div>
      <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#4ADE5C]/30">
        <div className="flex items-center gap-1.5">
          <Dot />
          <span className={`${MONO} text-[11px] text-[#E8E8E8]`}>BOND THRESHOLD CROSSED</span>
        </div>
        <Timestamp>{display?.name ?? npcId ?? 'NPC'}</Timestamp>
      </div>
      <table className={`${MONO} w-full text-[11px] text-[#E8E8E8] border-collapse`}>
        <tbody>
          {display && (
            <tr>
              <td className="text-[#7A7A7A] py-[3px] w-[120px]">npc</td>
              <td className="py-[3px]">{display.name} <span style={{ color: display.color }}>· {display.faction}{display.element ? ` / ${display.element}` : ''}</span></td>
            </tr>
          )}
          <tr>
            <td className="text-[#7A7A7A] py-[3px]">rapport</td>
            <td className="py-[3px] text-[#4ADE5C]">{before} → {after}</td>
          </tr>
          <tr>
            <td className="text-[#7A7A7A] py-[3px]">threshold</td>
            <td className="py-[3px] text-[#4ADE5C] font-bold">crossed {crossed}  ✓</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function AwardCard({ data }: { data: any }) {
  const outcome = data?.outcome
  if (outcome === 'success') {
    const itemName = data?.item_name ?? data?.item_id ?? 'item'
    const txHash = data?.tx_hash as string | undefined
    return (
      <div className="ml-[42px] relative border border-[#FFCB6B] bg-[#FFCB6B]/[0.05] p-2.5">
        <div className={`${MONO} absolute -top-2 left-2.5 bg-[#1F1F1F] px-1.5 text-[#FFCB6B] text-[11px] tracking-wide`}>
          ✦ wearable.minted
        </div>
        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#FFCB6B]/30">
          <div className="flex items-center gap-1.5">
            <Dot tone="warn" />
            <span className={`${MONO} text-[11px] text-[#E8E8E8]`}>ITEM AWARDED</span>
          </div>
          <Timestamp>on-chain</Timestamp>
        </div>
        <table className={`${MONO} w-full text-[11px] text-[#E8E8E8] border-collapse`}>
          <tbody>
            <tr>
              <td className="text-[#7A7A7A] py-[3px] w-[80px]">item</td>
              <td className="py-[3px] text-[#FFCB6B] font-bold">{itemName}</td>
            </tr>
            {txHash && (
              <tr>
                <td className="text-[#7A7A7A] py-[3px]">tx</td>
                <td className="py-[3px] text-[#B5B5B5] truncate max-w-[260px]" title={txHash}>{txHash}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }
  if (outcome === 'out_of_stock') {
    return <SystemBubble>// the shopkeeper reaches for the hook and finds it empty. sold last moon.</SystemBubble>
  }
  return null
}

function ToolResultCard({ ev, turnMode }: { ev: PharosToolResultEvent; turnMode: PharosMode | undefined }) {
  switch (ev.tool) {
    case 'pw_look_around': return <ScanCard data={ev.data} mode={turnMode} />
    case 'pw_talk':         return <ThresholdCard data={ev.data} />
    case 'pw_award_item':   return <AwardCard data={ev.data} />
    default:                return null
  }
}

function ExitsBlock({
  exits, onMove, disabled, currentRoomId,
}: {
  exits: Record<string, string>
  onMove: (targetRoomId: string) => void
  disabled?: boolean
  currentRoomId: string
}) {
  const entries = Object.entries(exits)
  if (entries.length === 0) return null
  return (
    <div className="mt-2.5">
      <div className={`${MONO} text-[10px] text-[#7A7A7A] mb-1 flex items-center justify-between`}>
        <span>EXITS</span>
        <span className="text-[#5A5A5A] normal-case">click to walk</span>
      </div>
      <div className="flex flex-col gap-1">
        {entries.map(([dir, target]) => (
          <button
            key={dir}
            onClick={() => onMove(target)}
            disabled={disabled || target === currentRoomId}
            title={`Walk ${dir} to ${ROOM_NAMES[target] ?? target}`}
            className={`${MONO} flex items-center gap-1.5 text-[11px] text-[#E8E8E8] px-1.5 py-1 border border-[#3A3A3A] bg-[#1F1F1F]/60 hover:border-[#4ADE5C]/60 hover:bg-[#4ADE5C]/[0.06] hover:text-[#4ADE5C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left`}
          >
            <span className="w-7 flex-shrink-0 text-[10px] text-[#7A7A7A] tracking-wide uppercase">{dir}</span>
            <span className="flex-1 truncate">{ROOM_NAMES[target] ?? target}</span>
            <span className="text-[10px] text-[#5A5A5A]">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function NpcFocusCard({
  npcId, npcState, room, onMove, disabled,
}: {
  npcId: string
  npcState: PharosNpcState | undefined
  room: PharosRoomBrief | null
  onMove: (targetRoomId: string) => void
  disabled?: boolean
}) {
  const display = NPC_DISPLAY[npcId]
  const rapport = npcState?.rapport ?? 0
  const cap = 9
  const filled = Math.max(0, Math.min(cap, rapport))
  const moodLabel = (() => {
    if (rapport >= 9) return 'bonded'
    if (rapport >= 7) return 'trusts you'
    if (rapport >= 5) return 'opens up'
    if (rapport >= 1) return 'curious'
    return 'wary'
  })()
  const homeGif = display?.home_room ? ROOM_GIF[display.home_room] : undefined
  return (
    <GroupBox title={`${npcId}.npc`}>
      <div className="bg-black border border-[#3A3A3A] aspect-square overflow-hidden relative">
        {homeGif && (
          <img
            src={homeGif}
            alt={display?.name ?? npcId}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        {/* faction-tinted vignette: pulls the gif toward the NPC's color
            without obscuring it, gives each shop a distinct "feel" */}
        {display?.color && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
            style={{ background: `radial-gradient(circle at 50% 60%, transparent 40%, ${display.color} 130%)` }}
          />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className={`${MONO} text-[11px]`} style={{ color: display?.color ?? '#B5B5B5' }}>{display?.faction.toUpperCase() ?? 'NEUTRAL'}</span>
        <span className={`${MONO} text-[#B5B5B5] text-[11px]`}>{display?.name ?? npcId}</span>
        {display?.element && <span className={`${MONO} text-[#7A7A7A] text-[10px]`}>{display.faction} / {display.element}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`${MONO} text-[10px] text-[#7A7A7A]`}>RAPPORT</span>
        <div className="flex-1 flex gap-px">
          {Array.from({ length: cap }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-2 border border-[#3A3A3A]"
              style={{ background: i < filled ? '#4ADE5C' : '#1F1F1F' }}
            />
          ))}
        </div>
        <span className={`${MONO} text-[10px] text-[#4ADE5C]`}>{rapport}/{cap}</span>
      </div>
      <div className={`${MONO} text-[10px] text-[#7A7A7A] mt-1`}>
        mood: <span className="text-[#4ADE5C]">"{moodLabel}"</span>
      </div>
      {!!(npcState?.awarded_items?.length) && (
        <div className="mt-2.5">
          <div className={`${MONO} text-[10px] text-[#7A7A7A] mb-1`}>AWARDED</div>
          <div className="flex flex-wrap gap-1">
            {npcState!.awarded_items.map((id) => (
              <span key={id} className={`${MONO} text-[10px] text-[#FFCB6B] border border-[#FFCB6B]/40 bg-[#FFCB6B]/[0.05] px-1.5 py-px`}>{id}</span>
            ))}
          </div>
        </div>
      )}
      {room && (
        <ExitsBlock
          exits={room.exits}
          onMove={onMove}
          disabled={disabled}
          currentRoomId={room.id}
        />
      )}
    </GroupBox>
  )
}

function PlaceFocusCard({
  room, onMove, disabled,
}: {
  room: PharosRoomBrief
  onMove: (targetRoomId: string) => void
  disabled?: boolean
}) {
  const gif = ROOM_GIF[room.id]
  return (
    <GroupBox title={`${room.id}.scene`}>
      <div className="bg-black border border-[#3A3A3A] aspect-square overflow-hidden relative">
        {gif ? (
          <img
            src={gif}
            alt={room.name}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#FFCB6B]/40 text-xs italic px-3 text-center">
            {room.tagline}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className={`${MONO} text-[#86E1FC] text-[11px]`}>PUBLIC</span>
        <span className={`${MONO} text-[#B5B5B5] text-[11px]`}>{room.name}</span>
      </div>
      <div className={`${MONO} text-[10px] text-[#B5B5B5] mt-1.5 leading-snug`}>
        {room.description.slice(0, 160)}{room.description.length > 160 ? '…' : ''}
      </div>
      {room.present_npcs.length > 0 && (
        <div className="mt-2.5">
          <div className={`${MONO} text-[10px] text-[#7A7A7A] mb-1`}>HERE</div>
          <div className="flex flex-col gap-0.5">
            {room.present_npcs.map((id) => {
              const display = NPC_DISPLAY[id]
              return (
                <div key={id} className={`${MONO} flex items-center gap-1.5 text-[11px] text-[#E8E8E8] py-px`}>
                  <span style={{ color: display?.color ?? '#B5B5B5' }}>◆</span>
                  <span className="flex-1 truncate">{display?.name ?? id}</span>
                  <span className="text-[10px]" style={{ color: display?.color ?? '#7A7A7A' }}>{display?.faction ?? ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <ExitsBlock
        exits={room.exits}
        onMove={onMove}
        disabled={disabled}
        currentRoomId={room.id}
      />
    </GroupBox>
  )
}

function Breadcrumb({
  roomName, lastActiveAt,
}: { roomName: string; lastActiveAt: string | null }) {
  const clock = lastActiveAt ? new Date(lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
  return (
    <div className="bg-[#C0C0C0] border border-[#808080] border-b-white border-r-white shadow-[inset_-1px_-1px_0_#FFFFFF,inset_1px_1px_0_#808080] flex items-center gap-2 px-2 py-1">
      <span className="text-[11px] text-black">
        Scene: <strong>{roomName}</strong>
      </span>
      <span className="text-[11px] text-[#444]">· Pharos Town · {clock}</span>
      <div className="flex-1" />
    </div>
  )
}

function StatusBar({
  isStreaming, session, npcStates, onSwitchGotchi,
}: {
  isStreaming: boolean
  session: PharosSession | null
  npcStates: PharosNpcState[]
  onSwitchGotchi?: () => void
}) {
  const engaged = npcStates.filter((s) => s.rapport > 0).length
  const room = session?.location ?? '--'
  const dot = isStreaming ? <Dot tone="warn" /> : <Dot />
  const cells = [
    { node: <>{dot} {isStreaming ? 'Streaming' : 'Connected'}</>, w: 'min-w-[120px]' },
    { node: <>HP <strong className="ml-1">{session?.hp ?? 100}/100</strong></>, w: 'min-w-[90px]' },
    { node: <>Rapport <strong className="ml-1">{engaged} npc{engaged === 1 ? '' : 's'}</strong></>, w: 'min-w-[120px]' },
    { node: <>Room <span className="ml-1 text-[#444]">{ROOM_NAMES[room] ?? room}</span></>, w: 'flex-1' },
    { node: <>{session?.last_active_at ? new Date(session.last_active_at).toLocaleTimeString() : '--:--:--'}</>, w: 'min-w-[100px] justify-center' },
  ]
  return (
    <div className="bg-[#C0C0C0] flex gap-0.5 p-0.5 flex-shrink-0">
      {cells.map((c, i) => (
        <div
          key={i}
          className={`${c.w} flex items-center gap-1.5 border border-[#808080] border-b-white border-r-white px-2 py-0.5 text-[11px] text-black`}
        >
          {c.node}
        </div>
      ))}
      {onSwitchGotchi && (
        <button
          onClick={onSwitchGotchi}
          title="Switch to a different Gotchipus (this one keeps its world; you can return any time)"
          className={`${MONO} text-[10px] tracking-wider px-2 py-0.5 border border-[#808080] border-b-white border-r-white bg-[#C0C0C0] hover:bg-[#b8b8b8] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white text-black`}
        >
          ⇄ switch
        </button>
      )}
    </div>
  )
}


function ModeTabs({ mode, setMode }: { mode: DisplayMode; setMode: (m: DisplayMode) => void }) {
  const modes: DisplayMode[] = ['DO', 'SAY', 'STORY', 'LOOK']
  return (
    <div className="flex bg-[#2A2A2A] border-t border-[#3A3A3A]">
      {modes.map((m) => {
        const active = mode === m
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`${MONO} border-r border-[#3A3A3A] px-3.5 py-1.5 text-[11px] tracking-widest cursor-pointer ${
              active
                ? 'bg-[#2A6E33] text-[#E8E8E8] border-b-2 border-b-[#4ADE5C]'
                : 'text-[#7A7A7A] hover:text-[#E8E8E8]'
            }`}
          >
            {m}
          </button>
        )
      })}
      <div className="flex-1 border-r border-[#3A3A3A]" />
    </div>
  )
}


function formatTime(iso: string | null | undefined): string {
  if (!iso) return '--:--:--'
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '--:--:--'
  }
}

function GateBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/desktop/pharosworld-bg.png)',
          backgroundColor: '#0A0F1A',
          filter: 'blur(10px) saturate(1.1)',
          transform: 'scale(1.08)',
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/60 to-black/70" />
      <div aria-hidden className="absolute inset-0 bg-[#1A2A3A]/15 mix-blend-overlay" />
      <div className="relative flex-1 flex flex-col">{children}</div>
    </div>
  )
}

function BootstrapForm({
  address, onStart, isStarting, error,
}: {
  address: string
  onStart: (
    gotchiId: string,
    faction: PharosFaction,
    gotchiName: string | null,
  ) => void
  isStarting: boolean
  error: string | null
}) {
  const { gotchis, isLoading } = useOwnerGotchis(address)
  const [selectedGotchi, setSelectedGotchi] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedGotchi && gotchis.length > 0) {
      setSelectedGotchi(String(gotchis[0].token_id))
    }
  }, [gotchis, selectedGotchi])

  const selectedMeta = useMemo(
    () => gotchis.find((g) => String(g.token_id) === selectedGotchi),
    [gotchis, selectedGotchi],
  )
  const chainFaction = chainFactionToPharos(selectedMeta?.faction)
  const effectiveFaction: PharosFaction = chainFaction ?? 'combat'
  const canStart = !!selectedGotchi && !isStarting
  const isResuming = !!(selectedGotchi && loadStoredConversationId(address, selectedGotchi))

  return (
    <div className="flex-1 flex items-center justify-center text-[#E8E8E8] p-6 overflow-y-auto">
      <div className="max-w-[480px] w-full bg-[#1F1F1F]/80 backdrop-blur-sm border border-[#3A3A3A] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6">
        <div className={`${MONO} text-[#FFCB6B] text-sm tracking-widest mb-1`}>PHAROS TOWN</div>
        <h2 className="text-xl text-[#E8E8E8] mb-6 leading-snug">
          The lighthouse waits.<br />
          <span className="text-[#B5B5B5] text-base italic">Choose your guardian.</span>
        </h2>

        <GroupBox title="select.gotchi" className="mb-4">
          {isLoading ? (
            <div className={`${MONO} text-[#7A7A7A] text-xs py-2`}>loading your gotchis…</div>
          ) : gotchis.length === 0 ? (
            <div className={`${MONO} text-[#FF6B6B] text-xs py-2`}>
              no gotchis owned by this wallet — summon one first
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {gotchis.map((g) => {
                const id = String(g.token_id)
                const active = selectedGotchi === id
                const f = chainFactionToPharos(g.faction)
                const accent = f ? FACTION_COPY[f].accent : '#7A7A7A'
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedGotchi(id)}
                    className={`${MONO} border px-2.5 py-1 text-[11px] flex items-center gap-1.5 ${
                      active
                        ? 'border-[#4ADE5C] text-[#4ADE5C] bg-[#4ADE5C]/[0.08]'
                        : 'border-[#4A4A4A] text-[#E8E8E8] hover:border-[#4ADE5C]/60'
                    }`}
                  >
                    <span>#{id}{g.name ? ` · ${g.name}` : ''}</span>
                    <span className="text-[9px] tracking-widest" style={{ color: accent }}>
                      {f ? FACTION_COPY[f].label.toUpperCase() : '?'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </GroupBox>

        {chainFaction && (
          <GroupBox title="faction.from-chain" className="mb-6">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: FACTION_COPY[chainFaction].accent, boxShadow: `0 0 6px ${FACTION_COPY[chainFaction].accent}` }}
              />
              <div className="flex-1">
                <div
                  className={`${MONO} font-bold tracking-wide text-[12px]`}
                  style={{ color: FACTION_COPY[chainFaction].accent }}
                >
                  {FACTION_COPY[chainFaction].label}
                </div>
                <div className={`${MONO} text-[10px] text-[#7A7A7A] mt-0.5`}>
                  {FACTION_COPY[chainFaction].tagline}
                </div>
              </div>
              <span className={`${MONO} text-[9px] text-[#4ADE5C] tracking-widest`}>BONDED</span>
            </div>
          </GroupBox>
        )}

        {error && (
          <div className={`${MONO} text-[11px] text-[#FF6B6B] mb-3`}>{error}</div>
        )}

        <button
          className={`${W98_BTN} w-full !py-2 !text-sm`}
          disabled={!canStart}
          onClick={() => selectedGotchi && onStart(
            selectedGotchi,
            effectiveFaction,
            selectedMeta?.name?.trim() || null,
          )}
        >
          {isStarting
            ? (isResuming ? 'returning…' : 'opening the gate…')
            : (isResuming ? '▶  Return to Pharos Town' : '▶  Step into Pharos Town')}
        </button>
      </div>
    </div>
  )
}


interface PlayingProps {
  session: PharosSession
  messages: PharosMessage[]
  npcStates: PharosNpcState[]
  currentRoom: PharosRoomBrief | null
  isStreaming: boolean
  isMoving: boolean
  streamingText: string
  streamingTools: PharosToolResultEvent[]
  currentTurnMode: PharosMode | undefined
  onSubmit: (mode: DisplayMode, text: string) => void
  onQuickMove: (targetRoomId: string) => void
  onSwitchGotchi: () => void
}

function PlayingView({
  session, messages, npcStates, currentRoom,
  isStreaming, isMoving, streamingText, streamingTools, currentTurnMode,
  onSubmit, onQuickMove, onSwitchGotchi,
}: PlayingProps) {
  const [mode, setMode] = useState<DisplayMode>('DO')
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, streamingText, streamingTools.length])

  const handleSubmit = useCallback(() => {
    const text = input.trim()
    if (!text || isStreaming) return
    onSubmit(mode, text)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }, [input, mode, isStreaming, onSubmit])

  const focusNpcId = currentRoom?.present_npcs[0] ?? null
  const focusNpcState = focusNpcId ? npcStates.find((s) => s.npc_id === focusNpcId) : undefined
  const roomName = currentRoom?.name ?? ROOM_NAMES[session.location] ?? session.location

  return (
    <div className="w-full h-full flex flex-col bg-[#C0C0C0] overflow-hidden">
      <Breadcrumb roomName={roomName} lastActiveAt={session.last_active_at} />

      <div className="flex-1 flex bg-[#1F1F1F] text-[#E8E8E8] min-h-0">
        <aside className="w-[280px] flex-shrink-0 p-3.5 flex flex-col gap-3.5 border-r border-[#3A3A3A] overflow-y-auto scrollbar-hide">
          {focusNpcId
            ? <NpcFocusCard
                npcId={focusNpcId}
                npcState={focusNpcState}
                room={currentRoom}
                onMove={onQuickMove}
                disabled={isMoving}
              />
            : (currentRoom && <PlaceFocusCard
                room={currentRoom}
                onMove={onQuickMove}
                disabled={isMoving}
              />)}
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 flex flex-col gap-2.5">
            {messages.map((m, idx) => {
              const t = formatTime(m.created_at)
              if (m.role === 'player') return <PlayerRow key={m.id ?? idx} time={t} mode={m.mode ?? null} content={m.content} />
              if (m.role === 'system') return <SystemBubble key={m.id ?? idx}>{m.content}</SystemBubble>
              if (m.role === 'tool_result') {
                try {
                  const parsed = JSON.parse(m.content) as { ev: PharosToolResultEvent; turnMode?: PharosMode }
                  return <ToolResultCard key={m.id ?? idx} ev={parsed.ev} turnMode={parsed.turnMode} />
                } catch {
                  return null
                }
              }
              return <NarrativeRow key={m.id ?? idx} time={t} text={m.content} location={m.location} />
            })}

            {streamingTools.map((ev, i) => (
              <ToolResultCard key={`tool-${i}`} ev={ev} turnMode={currentTurnMode} />
            ))}
            {streamingText && (
              <NarrativeRow
                time="now"
                text={streamingText}
                location={session.location}
                trailing={<span className="inline-block w-[7px] h-3 bg-[#4ADE5C] ml-1 align-middle animate-pulse" />}
              />
            )}
            {isStreaming && !streamingText && streamingTools.length === 0 && (
              <div className={`${MONO} text-[#7A7A7A] text-[11px] pl-[42px]`}>narrator is thinking…</div>
            )}
          </div>

          <ModeTabs mode={mode} setMode={setMode} />

          <div className="flex items-start gap-2.5 bg-[#2A2A2A] border-t border-[#3A3A3A] px-3 py-2">
            <span className={`${MONO} text-[#4ADE5C] text-sm pt-[2px] flex-shrink-0`}>&gt; {mode.toLowerCase()}_</span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={modePlaceholder(mode, session.location)}
              disabled={isStreaming}
              rows={1}
              className={`${MONO} flex-1 bg-transparent border-none outline-none text-[#E8E8E8] text-sm leading-snug placeholder:text-[#7A7A7A] disabled:opacity-50 resize-none overflow-y-auto py-[2px] scrollbar-hide`}
            />
            <span className={`${MONO} text-[#7A7A7A] text-[10px] tracking-wider pt-[4px] flex-shrink-0`}>⏎ SEND · ⇧⏎ NEWLINE</span>
          </div>
        </main>
      </div>

      <StatusBar
        isStreaming={isStreaming}
        session={session}
        npcStates={npcStates}
        onSwitchGotchi={onSwitchGotchi}
      />
    </div>
  )
}


type Phase = 'await-wallet' | 'await-auth' | 'bootstrap' | 'loading' | 'playing'

const PharosWorldContent = observer(function PharosWorldContent() {
  const { walletStore } = useStores()
  const address = walletStore.address ?? ''

  const { login, retryLogin, isAuthenticated, isLoggingIn } = useAuth()
  useEffect(() => {
    if (walletStore.isConnected && !isAuthenticated && !isLoggingIn) {
      login()
    }
  }, [walletStore.isConnected, walletStore.address, isAuthenticated, isLoggingIn]) // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState<Phase>('await-wallet')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [session, setSession] = useState<PharosSession | null>(null)
  const [messages, setMessages] = useState<PharosMessage[]>([])
  const [npcStates, setNpcStates] = useState<PharosNpcState[]>([])
  const [currentRoom, setCurrentRoom] = useState<PharosRoomBrief | null>(null)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingTools, setStreamingTools] = useState<PharosToolResultEvent[]>([])
  const [currentTurnMode, setCurrentTurnMode] = useState<PharosMode | undefined>(undefined)

  const [isMoving, setIsMoving] = useState(false)

  const { stream, stop } = usePharosStream()

  useEffect(() => {
    if (!address) {
      setPhase('await-wallet')
      return
    }
    if (!isAuthenticated) {
      setPhase('await-auth')
      return
    }
    setPhase((prev) => {
      if (prev === 'playing' || prev === 'loading') return prev
      return 'bootstrap'
    })
  }, [address, isAuthenticated])

  const hydrateState = useCallback(async (convId: string) => {
    const data = await fetchPharosState(convId)
    setSession(data.session)
    setMessages(data.messages)
    setNpcStates(data.npc_states)
    setCurrentRoom(data.current_room)
  }, [])

  const hydrateLiveState = useCallback(async (convId: string) => {
    const data = await fetchPharosState(convId)
    setSession(data.session)
    setNpcStates(data.npc_states)
    setCurrentRoom(data.current_room)
  }, [])

  const handleStart = useCallback(async (
    gotchiId: string,
    faction: PharosFaction,
    gotchiName: string | null,
  ) => {
    if (!address) return
    setIsStarting(true)
    setBootstrapError(null)
    try {
      const stored = loadStoredConversationId(address, gotchiId)
      if (stored) {
        try {
          await hydrateState(stored)
          setConversationId(stored)
          setPhase('playing')
          return
        } catch {
          clearStoredConversationId(address, gotchiId)
        }
      }
      const start = await startPharosSession({
        gotchi_id: gotchiId,
        faction,
        gotchi_name: gotchiName,
      })
      saveStoredConversationId(address, gotchiId, start.conversation_id)
      setConversationId(start.conversation_id)
      setPhase('loading')
      await hydrateState(start.conversation_id)
      setPhase('playing')
    } catch (e: any) {
      setBootstrapError(e?.message ?? 'failed to start session')
    } finally {
      setIsStarting(false)
    }
  }, [address, hydrateState])

  const handleQuickMove = useCallback(async (targetRoomId: string) => {
    if (!conversationId || isMoving) return
    setIsMoving(true)
    try {
      const res = await movePharosTo(conversationId, targetRoomId)
      setSession(res.session)
      setCurrentRoom(res.current_room)
      if (res.transition_message) {
        setMessages((prev) => [...prev, res.transition_message as PharosMessage])
      }
    } catch (e) {
      if (session) {
        setMessages((prev) => [
          ...prev,
          {
            session_id: session.id,
            role: 'system',
            content: `// move blocked: ${e instanceof Error ? e.message : String(e)}`,
            tool_calls: [],
            location: session.location,
            created_at: new Date().toISOString(),
          } as PharosMessage,
        ])
      }
    } finally {
      setIsMoving(false)
    }
  }, [conversationId, session, isMoving])

  const handleSwitchGotchi = useCallback(() => {
    stop()
    setIsStreaming(false)
    setStreamingText('')
    setStreamingTools([])
    setSession(null)
    setMessages([])
    setNpcStates([])
    setCurrentRoom(null)
    setConversationId(null)
    setPhase('bootstrap')
  }, [stop])

  const handleSubmit = useCallback((displayMode: DisplayMode, text: string) => {
    if (!conversationId || !session) return
    const apiMode = DISPLAY_TO_API[displayMode]

    setMessages((prev) => [
      ...prev,
      {
        session_id: session.id,
        role: 'player',
        mode: apiMode,
        content: text,
        tool_calls: [],
        location: session.location,
        created_at: new Date().toISOString(),
      } as PharosMessage,
    ])

    setStreamingText('')
    setStreamingTools([])
    setCurrentTurnMode(apiMode)
    setIsStreaming(true)

    let buffered = ''
    let pending = ''
    let raf: number | null = null
    const flushPending = () => {
      raf = null
      if (!pending) return
      const next = pending
      pending = ''
      setStreamingText((prev) => prev + next)
    }
    const scheduleFlush = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(flushPending)
    }
    const tools: PharosToolResultEvent[] = []

    stream(
      { conversation_id: conversationId, mode: apiMode, text },
      {
        onTextDelta: (t) => {
          buffered += t
          pending += t
          scheduleFlush()
        },
        onTextReplace: (t) => {
          if (raf !== null) { cancelAnimationFrame(raf); raf = null }
          pending = ''
          buffered = t
          setStreamingText(t)
        },
        onToolResult: (ev) => {
          tools.push(ev)
          setStreamingTools((prev) => [...prev, ev])
        },
        onError: (err: any) => {
          if (raf !== null) { cancelAnimationFrame(raf); raf = null }
          setIsStreaming(false)
          setMessages((prev) => [
            ...prev,
            {
              session_id: session.id,
              role: 'system',
              content: `// stream error: ${String(err?.message ?? err)}`,
              tool_calls: [],
              location: session.location,
              created_at: new Date().toISOString(),
            } as PharosMessage,
          ])
          setStreamingText('')
          setStreamingTools([])
          setCurrentTurnMode(undefined)
        },
        onComplete: async () => {
          if (raf !== null) {
            cancelAnimationFrame(raf)
            raf = null
            if (pending) { buffered += pending; pending = '' }
          }

          const finalText = buffered
          const capturedTools = tools.slice()
          const capturedTurnMode = apiMode
          const now = new Date().toISOString()
          setMessages((prev) => [
            ...prev,
            ...capturedTools.map((ev) => ({
              session_id: session.id,
              role: 'tool_result' as const,
              content: JSON.stringify({ ev, turnMode: capturedTurnMode }),
              tool_calls: [],
              location: session.location,
              created_at: now,
            })),
            ...(finalText
              ? [{
                  session_id: session.id,
                  role: 'narrator' as const,
                  content: finalText,
                  tool_calls: [],
                  location: session.location,
                  created_at: now,
                }]
              : []),
          ] as PharosMessage[])
          setStreamingText('')
          setStreamingTools([])
          setCurrentTurnMode(undefined)
          setIsStreaming(false)

          try {
            await hydrateLiveState(conversationId)
          } catch {
            // best-effort — local optimistic state is still usable
          }
        },
      },
    )
  }, [conversationId, session, stream, hydrateLiveState])

  if (phase === 'await-wallet') {
    return (
      <div className="w-full h-full flex flex-col bg-[#C0C0C0]">
        <GateBackground>
          <div className="flex-1 flex items-center justify-center text-[#E8E8E8] text-sm">
            connect your wallet to enter Pharos Town
          </div>
        </GateBackground>
      </div>
    )
  }

  if (phase === 'await-auth') {
    return (
      <div className="w-full h-full flex flex-col bg-[#C0C0C0]">
        <GateBackground>
          <div className="flex-1 flex flex-col items-center justify-center text-[#E8E8E8] text-sm gap-4 p-6 text-center">
            {isLoggingIn ? (
              <>
                <div className={`${MONO} text-[#FFCB6B] text-xs tracking-widest`}>SIGNING IN…</div>
                <div className="text-[#B5B5B5] text-xs max-w-[360px]">
                  approve the signature in your wallet to authorize this session.
                  no transaction, no gas — just a one-time signature.
                </div>
              </>
            ) : (
              <>
                <div className={`${MONO} text-[#FF6B6B] text-xs tracking-widest`}>SIGN-IN REQUIRED</div>
                <div className="text-[#B5B5B5] text-xs max-w-[360px]">
                  Pharos Town needs a JWT to talk to the backend. sign once with your wallet to continue.
                </div>
                <button
                  className={`${W98_BTN} !py-2 !text-sm`}
                  onClick={() => { retryLogin(); login() }}
                >
                  ▶  Sign in with wallet
                </button>
              </>
            )}
          </div>
        </GateBackground>
      </div>
    )
  }

  if (phase === 'bootstrap') {
    return (
      <div className="w-full h-full flex flex-col bg-[#C0C0C0]">
        <GateBackground>
          <BootstrapForm
            address={address}
            onStart={handleStart}
            isStarting={isStarting}
            error={bootstrapError}
          />
        </GateBackground>
      </div>
    )
  }

  if (phase === 'loading' || !session) {
    return (
      <div className="w-full h-full flex flex-col bg-[#C0C0C0]">
        <GateBackground>
          <div className="flex-1 flex items-center justify-center text-[#E8E8E8] text-sm">
            opening Pharos Town…
          </div>
        </GateBackground>
      </div>
    )
  }

  return (
    <PlayingView
      session={session}
      messages={messages}
      npcStates={npcStates}
      currentRoom={currentRoom}
      isStreaming={isStreaming}
      isMoving={isMoving}
      streamingText={streamingText}
      streamingTools={streamingTools}
      currentTurnMode={currentTurnMode}
      onSubmit={handleSubmit}
      onQuickMove={handleQuickMove}
      onSwitchGotchi={handleSwitchGotchi}
    />
  )
})

export default PharosWorldContent
