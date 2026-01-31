import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [bike, setBike] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setBike(profile.bike || '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(
      {
        name,
        username,
        bio: bio || null,
        bike: bike || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (isLoadingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">@username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              pattern="[a-z0-9_]+"
              title="Apenas letras minúsculas, números e underscore"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bike">Moto</Label>
            <Input
              id="bike"
              value={bike}
              onChange={(e) => setBike(e.target.value)}
              placeholder="Ex: Harley-Davidson Iron 883"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
