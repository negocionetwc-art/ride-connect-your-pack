interface StoryTextOverlayProps {
  text?: string;
  position?: 'top' | 'center' | 'bottom';
  color?: string;
  bg?: boolean;
  yPercent?: number; // Posição Y em percentual (0-100)
}

export function StoryTextOverlay({
  text,
  position = 'center',
  color = '#fff',
  bg = false,
  yPercent,
}: StoryTextOverlayProps) {
  if (!text) return null;

  // UPGRADE 4: Fundo automático se texto > 12 caracteres
  const needsBg = bg || text.length > 12;

  // Se yPercent estiver definido, usar ele (prioridade)
  // Senão, usar position
  const positionStyle = yPercent !== undefined
    ? { top: `${yPercent}%`, transform: 'translateY(-50%)' }
    : undefined;

  const positionClass = yPercent === undefined
    ? {
        top: 'top-24',
        center: 'top-1/2 -translate-y-1/2',
        bottom: 'bottom-28',
      }[position]
    : undefined;

  return (
    <div
      className={`absolute ${positionClass || ''} left-0 right-0 z-40 px-6`}
      style={positionStyle}
    >
      <p
        className={`text-xl font-semibold text-center break-words ${
          needsBg ? 'bg-black/50 px-4 py-2 rounded-xl' : ''
        }`}
        style={{ color }}
      >
        {text}
      </p>
    </div>
  );
}
