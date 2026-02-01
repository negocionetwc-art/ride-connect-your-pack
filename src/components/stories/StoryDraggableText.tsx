import { motion } from 'framer-motion';
import { useRef, useState, useLayoutEffect } from 'react';

interface StoryDraggableTextProps {
  text: string;
  color?: string;
  bg?: boolean;
  initialX?: number; // 0 → 1
  initialY?: number; // 0 → 1
  onPositionChange?: (x: number, y: number) => void;
}

export function StoryDraggableText({
  text,
  color = '#fff',
  bg = false,
  initialX = 0.5,
  initialY = 0.5,
  onPositionChange,
}: StoryDraggableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Converter percentual → px APENAS UMA VEZ
  useLayoutEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const c = containerRef.current.getBoundingClientRect();
    const t = textRef.current.getBoundingClientRect();

    setPos({
      x: initialX * c.width - t.width / 2,
      y: initialY * c.height - t.height / 2,
    });
  }, [initialX, initialY]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40"
    >
      <motion.div
        ref={textRef}
        drag
        dragMomentum={false}
        dragElastic={0.15}
        style={{
          x: pos.x,
          y: pos.y,
        }}
        onDragEnd={(_, info) => {
          if (!containerRef.current || !textRef.current) return;

          const c = containerRef.current.getBoundingClientRect();
          const t = textRef.current.getBoundingClientRect();

          const newX = info.point.x - c.left - t.width / 2;
          const newY = info.point.y - c.top - t.height / 2;

          setPos({ x: newX, y: newY });

          onPositionChange?.(
            Math.min(Math.max((newX + t.width / 2) / c.width, 0), 1),
            Math.min(Math.max((newY + t.height / 2) / c.height, 0), 1)
          );
        }}
        className="absolute cursor-move select-none touch-none"
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
