"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useContractRead } from "@/hooks/useContract"
import { useStores } from "@stores/context"
import { observer } from "mobx-react-lite"
import { motion, AnimatePresence } from "framer-motion"
import SvgIcon from "@/components/gotchiSvg/SvgIcon"
import { EquippedItem } from "@/hooks/useEquippedItems"
import { EquipWearableType } from "@/lib/types"
import { TOKEN_ID_TO_IMAGE, KEY_TO_CONFIG_MAP, WearableCategoryKey, TOKEN_ID_TO_LOCAL_INDEX } from "@/components/gotchiSvg/config"
import { BG_BYTES32, BODY_BYTES32, EYE_BYTES32, HAND_BYTES32, FACE_BYTES32, MOUTH_BYTES32, HEAD_BYTES32, CLOTHES_BYTES32 } from "@/lib/constant"
import { normalizeWearableId } from "@/lib/utils"

const EQUIPMENT_SLOTS = [
  { name: "Background", type: BG_BYTES32, canEquip: false },
  { name: "Body", type: BODY_BYTES32, canEquip: false },
  { name: "Eye", type: EYE_BYTES32, canEquip: false },
  { name: "Hand", type: HAND_BYTES32, canEquip: true },
  { name: "Head", type: HEAD_BYTES32, canEquip: true },
  { name: "Clothes", type: CLOTHES_BYTES32, canEquip: true },
  { name: "Face", type: FACE_BYTES32, canEquip: true },
  { name: "Mouth", type: MOUTH_BYTES32, canEquip: true },
];

interface EquipTabProps {
  tokenId: number;
  selectedEquipSlot: number | null
  handleEquipSlotClick: (index: number) => void
  handleEquipWearable: (ids: string[]) => void
  isMobile?: boolean
  wearableTypeInfos?: EquipWearableType[]
  isLoadingWearables?: boolean
  wearablesError?: Error | null
}

interface EquipSlotProps {
  slot: EquippedItem & { wearableName?: string | null }
  index: number
  selectedEquipSlot: number | null
  onSlotClick: (index: number) => void
  isMobile?: boolean
}

const EquipSlot = ({ slot, index, selectedEquipSlot, onSlotClick, isMobile }: EquipSlotProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const displayName = slot.wearableName || `No ${slot.name}`

  return (
    <div
      className={`relative flex flex-col ${slot.canEquip ? "cursor-pointer" : ""} ${selectedEquipSlot === index ? "scale-105" : ""}`}
      onClick={() => onSlotClick(index)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`aspect-square border-2 ${selectedEquipSlot === index ? "border-[#000080]" : "border-[#808080]"} shadow-win98-inner bg-[#c0c0c0] rounded-t-sm flex items-center justify-center ${isMobile ? 'p-2' : 'p-4'}`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <SvgIcon
            svgString={slot.svgString}
            imagePath={slot.imagePath}
            alt={slot.name}
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
      <div
        className={`border-2 border-t-0 ${selectedEquipSlot === index ? "border-[#000080] bg-[#c0c0c0]" : "border-[#808080] bg-[#d4d0c8]"} shadow-win98-outer rounded-b-sm text-center font-medium ${isMobile ? 'p-2 text-sm' : 'p-3 text-base'}`}
      >
        {slot.name}
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-20 bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                       bg-[#FFFFCC] border-2 border-[#000000] p-2 rounded whitespace-nowrap text-xs shadow-win98-outer"
          >
            {displayName}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent border-t-[#000000]"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const getWearableName = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  const fileName = imagePath.split('/').pop();
  if (!fileName) return null;
  return fileName.replace('.png', '').replace(/'/g, "'");
};

const calculateEquippedItems = (wearableTypeInfos: EquipWearableType[] | undefined): (EquippedItem & { wearableName?: string | null })[] => {
  if (!wearableTypeInfos || !Array.isArray(wearableTypeInfos)) {
    return EQUIPMENT_SLOTS.map(slot => ({
      ...slot,
      svgString: null,
      imagePath: null,
      wearableName: null,
    }));
  }

  return EQUIPMENT_SLOTS.map(slot => {
    const wearableInfo = wearableTypeInfos.find(
      (info: EquipWearableType) => info.equiped && info.wearableType === slot.type
    );

    let imagePath: string | null = null;
    let wearableName: string | null = null;

    if (wearableInfo) {
      const config = KEY_TO_CONFIG_MAP[wearableInfo.wearableType as WearableCategoryKey];
      if (config) {
        const categoryMapping = TOKEN_ID_TO_LOCAL_INDEX[config.name];
        if (categoryMapping) {
          const tokenId = normalizeWearableId(Number(wearableInfo.wearableId));
          imagePath = TOKEN_ID_TO_IMAGE[tokenId] || null;
          wearableName = getWearableName(imagePath);
        }
      }
    }

    return {
      ...slot,
      svgString: null,
      imagePath: imagePath,
      wearableName: wearableName,
    };
  });
};

const EquipTab = observer(({ 
  tokenId, 
  selectedEquipSlot, 
  handleEquipSlotClick, 
  handleEquipWearable, 
  isMobile,
  wearableTypeInfos,
  isLoadingWearables = false,
  wearablesError
}: EquipTabProps) => {
  const { walletStore } = useStores();

  const equippedItems = useMemo(() => calculateEquippedItems(wearableTypeInfos), [wearableTypeInfos]);
  const isLoading = isLoadingWearables;
  const error = wearablesError;

  const owners = new Array(85).fill(walletStore.address);
  const tokenIds = Array.from({ length: 85 }, (_, i) => i);
  const {data: balances} = useContractRead("wearableBalanceOfBatch", [owners, tokenIds]);
  
  useEffect(() => {
    if (balances) {
      handleEquipWearable(balances as string[]);
    }
  }, [balances]);

  const handleSlotClick = (index: number) => {
    if (equippedItems[index]?.canEquip) { 
      handleEquipSlotClick(index);
    }
  };

  return (
    <div className={`border-2 border-[#808080] shadow-win98-outer bg-[#d4d0c8] rounded-sm ${isMobile ? 'p-3' : 'p-6'}`}>
      <div className={`font-bold mb-4 flex items-center border-b border-[#808080] pb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
        <Image src="/icons/equip.png" alt="Equip" width={isMobile ? 14 : 18} height={isMobile ? 14 : 18} className={`mr-2 ${isMobile ? 'mr-1' : ''}`} />
        Equip Your Gotchipus
      </div>

      {isLoading && <div className={`text-center p-4 ${isMobile ? 'text-sm' : ''}`}>Loading equipped items...</div>}
      {error && <div className={`text-center p-4 text-red-500 ${isMobile ? 'text-sm' : ''}`}>Failed to load items.</div>}
      
      {!isLoading && !error && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-5'}`}>
          {equippedItems.map((slot, index) => (
            <EquipSlot
              key={index}
              slot={slot}
              index={index}
              selectedEquipSlot={selectedEquipSlot}
              onSlotClick={handleSlotClick}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  )
});

export default EquipTab;