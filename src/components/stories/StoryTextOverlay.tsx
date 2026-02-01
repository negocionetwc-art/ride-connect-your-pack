interface StoryTextOverlayProps {
  text?: string;
  position?: 'top' | 'center' | 'bottom';
  color?: string;
  bg?: boolean;
}

export function StoryTextOverlay({
  text,
  position = 'center',
  color = '#fff',
  bg = false,
}: StoryTextOverlayProps) {
  if (!text) return null;

  const positionClass = {
    top: 'top-24',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-28',
  }[position];

  return (
    <div
      className={`absolute ${positionClass} left-0 right-0 z-40 px-6`}
    >
      <p
        className={`text-xl font-semibold text-center break-words ${
          bg ? 'bg-black/50 px-4 py-2 rounded-xl' : ''
        }`}
        style={{ color }}
      >
        {text}
      </p>
    </div>
  );
}
