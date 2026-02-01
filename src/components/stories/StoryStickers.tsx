import { motion } from 'framer-motion';

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface StoryStickersProps {
  stickers?: Sticker[];
  onStickerMove?: (stickerId: string, x: number, y: number) => void;
  isEditable?: boolean;
}

export function StoryStickers({
  stickers = [],
  onStickerMove,
  isEditable = false,
}: StoryStickersProps) {
  if (!stickers || stickers.length === 0) return null;

  return (
    <>
      {stickers.map((sticker) => (
        <motion.div
          key={sticker.id}
          drag={isEditable}
          dragConstraints={{
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
          dragElastic={0}
          onDragEnd={(_, info) => {
            if (onStickerMove && isEditable) {
              // Calcular posição em percentual
              const container = info.point;
              // Assumindo container de 400x600 (aspect 9:16)
              const xPercent = Math.max(0, Math.min(100, (container.x / 400) * 100));
              const yPercent = Math.max(0, Math.min(100, (container.y / 600) * 100));
              onStickerMove(sticker.id, xPercent, yPercent);
            }
          }}
          className="absolute text-4xl cursor-move z-30"
          style={{
            left: `${sticker.x}%`,
            top: `${sticker.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {sticker.emoji}
        </motion.div>
      ))}
    </>
  );
}
