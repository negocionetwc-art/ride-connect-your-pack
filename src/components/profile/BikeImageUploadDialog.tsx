import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X, Bike } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface BikeImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BikeImageUploadDialog = ({ open, onOpenChange }: BikeImageUploadDialogProps) => {
  const { data: profile } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (max 10MB para imagens de moto)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para fazer upload. Por favor, faça login primeiro.',
        variant: 'destructive',
      });
      onOpenChange(false);
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from('bike-images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        const msg = (uploadError as any)?.message || String(uploadError);

        // Mensagens comuns do Storage
        if (msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not found')) {
          throw new Error(
            'Bucket "bike-images" não encontrado no projeto do Supabase. Execute a migration `supabase/migrations/20260201010100_bike_images_storage.sql`.'
          );
        }

        // Bucket existe, mas sem policies/RLS
        if (
          msg.toLowerCase().includes('row level security') ||
          msg.toLowerCase().includes('violates row-level security') ||
          msg.toLowerCase().includes('permission denied') ||
          msg.toLowerCase().includes('not allowed')
        ) {
          throw new Error(
            'Sem permissão para upload no bucket "bike-images". No Supabase Dashboard, vá em Storage > Policies e crie as policies (veja `supabase/migrations/20260201010100_bike_images_storage.sql`).'
          );
        }

        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('bike-images')
        .getPublicUrl(filePath);

      // Atualizar perfil
      updateProfile(
        { bike_image_url: publicUrl },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast({
              title: 'Sucesso!',
              description: 'Imagem da moto atualizada com sucesso',
            });
            setPreview(null);
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            onOpenChange(false);
          },
        }
      );
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer upload da imagem',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Foto da sua moto</DialogTitle>
          <DialogDescription>
            Mostre sua companheira de estrada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative">
              {preview || profile?.bike_image_url ? (
                <>
                  <img
                    src={preview || profile?.bike_image_url || ''}
                    alt="Preview da moto"
                    className="w-full h-64 rounded-lg object-cover border-4 border-border"
                  />
                  {preview && (
                    <button
                      onClick={handleRemove}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full h-64 rounded-lg border-4 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-muted/50">
                  <Bike className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhuma foto adicionada</p>
                </div>
              )}
            </div>
          </div>

          {/* File input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="bike-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar imagem
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              className="flex-1"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
