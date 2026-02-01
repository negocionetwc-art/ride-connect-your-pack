interface StoryTextOverlayProps {
  text?: string;
  position?: 'top' | 'center' | 'bottom';
}

export function StoryTextOverlay({
  text,
  position = 'center',
}: StoryTextOverlayProps) {
  if (!text) return null;

  const positionClass = {
    top: 'top-20',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-24',
  }[position];

  return (
    <div
      className={`absolute ${positionClass} left-0 right-0 px-6 text-center z-40`}
    >
      <p
        className="text-white text-xl font-semibold drop-shadow-lg break-words"
        style={{
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
        }}
      >
        {text}
      </p>
    </div>
  );
}
