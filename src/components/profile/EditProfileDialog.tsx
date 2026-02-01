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
import { Loader2, Bike } from 'lucide-react';
import { BikeImageViewer } from './BikeImageViewer';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditBikeImage?: () => void;
}

export const EditProfileDialog = ({ open, onOpenChange, onEditBikeImage }: EditProfileDialogProps) => {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [bike, setBike] = useState('');
  const [showBikeImageViewer, setShowBikeImageViewer] = useState(false);

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
            <Label htmlFor="bike">Minha companheira</Label>
            <Input
              id="bike"
              value={bike}
              onChange={(e) => setBike(e.target.value)}
              placeholder="Ex: Harley-Davidson Iron 883"
            />
          </div>

          {/* Seção da imagem da moto */}
          <div className="space-y-2">
            <Label>Foto da moto</Label>
            <div className="flex gap-3 items-start">
              {/* Preview ou ícone padrão */}
              <div 
                className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  if (profile?.bike_image_url) {
                    setShowBikeImageViewer(true);
                  }
                }}
              >
                {profile?.bike_image_url ? (
                  <img
                    src={profile.bike_image_url}
                    alt="Moto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Bike className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Botão para trocar imagem */}
              <div className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (onEditBikeImage) {
                      onEditBikeImage();
                      onOpenChange(false);
                    }
                  }}
                >
                  <Bike className="w-4 h-4 mr-2" />
                  {profile?.bike_image_url ? 'Trocar foto' : 'Adicionar foto'}
                </Button>
                {profile?.bike_image_url && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Clique na imagem para ver em tamanho grande
                  </p>
                )}
              </div>
            </div>
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

        {/* Visualizador de imagem da moto */}
        {profile?.bike_image_url && (
          <BikeImageViewer
            open={showBikeImageViewer}
            onOpenChange={setShowBikeImageViewer}
            imageUrl={profile.bike_image_url}
            bikeName={bike || profile.bike || undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
