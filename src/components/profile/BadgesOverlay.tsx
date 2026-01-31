import { motion, AnimatePresence } from 'framer-motion';
import { X, Award } from 'lucide-react';
import { useProfileBadges } from '@/hooks/useProfileBadges';
import { BadgeDetailDialog } from './BadgeDetailDialog';
import { useState } from 'react';
import type { BadgeWithUnlocked } from '@/hooks/useProfileBadges';

interface BadgesOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const BadgesOverlay = ({ open, onClose }: BadgesOverlayProps) => {
  const { data: badges, isLoading } = useProfileBadges();
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithUnlocked | null>(null);

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-border/30">
              <div className="flex items-center justify-between px-4 h-14">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <h1 className="font-semibold text-lg">Conquistas</h1>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </header>

            {/* Content */}
            <div className="p-4 pb-20">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Carregando...</div>
                </div>
              ) : badges && badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <motion.button
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setSelectedBadge(badge)}
                      className={`p-4 rounded-xl border text-center transition-colors ${
                        badge.unlocked
                          ? 'bg-card border-primary/30 hover:border-primary/50'
                          : 'bg-secondary/50 border-border/30 opacity-50'
                      }`}
                    >
                      <span className="text-4xl block mb-2">{badge.icon}</span>
                      <p className="text-sm font-medium">{badge.name}</p>
                      {badge.unlocked && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Desbloqueado
                        </p>
                      )}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Award className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma conquista encontrada</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedBadge && (
        <BadgeDetailDialog
          badge={selectedBadge}
          open={!!selectedBadge}
          onOpenChange={(open) => !open && setSelectedBadge(null)}
        />
      )}
    </>
  );
};
