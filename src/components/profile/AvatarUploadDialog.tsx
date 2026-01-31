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
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AvatarUploadDialog = ({ open, onOpenChange }: AvatarUploadDialogProps) => {
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

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB',
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
      // O caminho não deve incluir o nome do bucket, apenas o caminho dentro do bucket
      const filePath = fileName;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
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
            'Bucket "avatars" não encontrado no projeto do Supabase. Crie o bucket "avatars" em Storage > Files, ou execute a migration `supabase/migrations/20260131160000_avatars_storage.sql`.'
          );
        }

        // Bucket existe, mas sem policies/RLS (no seu print aparece Policies = 0)
        if (
          msg.toLowerCase().includes('row level security') ||
          msg.toLowerCase().includes('violates row-level security') ||
          msg.toLowerCase().includes('permission denied') ||
          msg.toLowerCase().includes('not allowed')
        ) {
          throw new Error(
            'Sem permissão para upload no bucket "avatars". No Supabase Dashboard, vá em Storage > Policies e crie as policies (veja `supabase/migrations/20260131160000_avatars_storage.sql`).'
          );
        }

        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar perfil
      updateProfile(
        { avatar_url: publicUrl },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
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
          <DialogTitle>Trocar avatar</DialogTitle>
          <DialogDescription>
            Selecione uma nova imagem de perfil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={preview || profile?.avatar_url || 'https://via.placeholder.com/150'}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-border"
              />
              {preview && (
                <button
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
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
              id="avatar-upload"
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
