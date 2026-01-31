import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BadgeWithUnlocked } from '@/hooks/useProfileBadges';

interface BadgeDetailDialogProps {
  badge: BadgeWithUnlocked;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BadgeDetailDialog = ({
  badge,
  open,
  onOpenChange,
}: BadgeDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{badge.icon}</span>
            <div>
              <DialogTitle>{badge.name}</DialogTitle>
              <DialogDescription className="mt-2">
                {badge.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg border border-border/50">
            <p className="text-sm font-medium mb-2">Requisito</p>
            <p className="text-sm text-muted-foreground">
              {badge.requirement_type === 'km' && `${badge.requirement_value} km rodados`}
              {badge.requirement_type === 'rides' && `${badge.requirement_value} rolê(s) registrado(s)`}
              {badge.requirement_type === 'states' && `Visitar ${badge.requirement_value} estado(s)`}
              {badge.requirement_type === 'followers' && `${badge.requirement_value} seguidor(es)`}
              {badge.requirement_type === 'time' && badge.requirement_value === 6 && 'Rolê antes das 6h'}
              {badge.requirement_type === 'time' && badge.requirement_value === 0 && 'Rolê após meia-noite'}
              {badge.requirement_type === 'weather' && 'Rolê na chuva'}
              {badge.requirement_type === 'special' && 'Conquista especial'}
            </p>
          </div>

          {badge.unlocked && badge.unlockedAt && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm font-medium text-primary mb-1">
                ✓ Desbloqueado
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(badge.unlockedAt).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          {!badge.unlocked && (
            <div className="p-4 bg-secondary/50 rounded-lg border border-border/30">
              <p className="text-sm text-muted-foreground">
                Continue se esforçando para desbloquear esta conquista!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
