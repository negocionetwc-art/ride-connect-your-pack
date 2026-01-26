import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { stories } from '@/data/mockData';

export const Stories = () => {
  return (
    <div className="py-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
        {stories.map((story, index) => (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div
              className={`relative p-0.5 rounded-full ${
                story.isViewed
                  ? 'bg-muted'
                  : 'bg-gradient-to-br from-primary via-orange-500 to-yellow-500'
              }`}
            >
              <div className="p-0.5 bg-background rounded-full">
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <img
                    src={story.thumbnail}
                    alt={story.user.name}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="p-1 rounded-full bg-primary">
                        <Plus className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs text-foreground/80 max-w-[70px] truncate">
              {index === 0 ? 'Adicionar' : story.user.name.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
