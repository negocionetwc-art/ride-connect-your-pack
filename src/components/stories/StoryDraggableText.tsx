import { motion } from 'framer-motion';
import { useRef } from 'react';

interface StoryDraggableTextProps {
  text: string;
  color?: string;
  bg?: boolean;
  xPercent?: number;
  yPercent?: number;
  onPositionChange?: (xPercent: number, yPercent: number) => void;
}

export function StoryDraggableText({
  text,
  color = '#fff',
  bg = false,
  xPercent = 0.5,
  yPercent = 0.5,
  onPositionChange,
}: StoryDraggableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40"
    >
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.2}
        dragConstraints={containerRef}
        onDragEnd={(_, info) => {
          if (!containerRef.current) return;

          const rect = containerRef.current.getBoundingClientRect();
          const xPercent = (info.point.x - rect.left) / rect.width;
          const yPercent = (info.point.y - rect.top) / rect.height;

          onPositionChange?.(
            Math.min(Math.max(xPercent, 0), 1),
            Math.min(Math.max(yPercent, 0), 1)
          );
        }}
        className="absolute cursor-move select-none touch-none"
        style={{
          left: `${xPercent * 100}%`,
          top: `${yPercent * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <p
          className={`text-xl font-semibold whitespace-pre-wrap break-words ${
            bg ? 'bg-black/50 px-4 py-2 rounded-xl' : ''
          }`}
          style={{
            color,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {text}
        </p>
      </motion.div>
    </div>
  );
}
