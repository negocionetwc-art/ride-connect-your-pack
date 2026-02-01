import { motion } from 'framer-motion';

interface StoryProgressProps {
  stories: Array<{ id: string; media_type: 'image' | 'video' }>;
  currentIndex: number;
  progress: number; // 0 a 100
  isPaused: boolean;
}

export function StoryProgress({ stories, currentIndex, progress, isPaused }: StoryProgressProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-2 flex gap-1">
      {stories.map((story, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const currentProgress = isActive ? progress : isCompleted ? 100 : 0;

        return (
          <div
            key={story.id}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-white rounded-full"
              initial={false}
              animate={{
                width: `${currentProgress}%`,
              }}
              transition={{
                duration: isPaused ? 0 : 0.1,
                ease: 'linear',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
