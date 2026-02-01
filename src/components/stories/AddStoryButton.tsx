import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateStory } from '@/hooks/useCreateStory';
import { Loader2, Upload, X, Image, Video } from 'lucide-react';

interface AddStoryButtonProps {
  onStoryCreated?: () => void;
}

export function AddStoryButton({ onStoryCreated }: AddStoryButtonProps) {
  const { mutate: createStory, isPending } = useCreateStory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return;
    }

    // Validar tamanho
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB vídeo, 10MB imagem
    if (file.size > maxSize) {
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    createStory(
      { file: selectedFile },
      {
        onSuccess: () => {
          setOpen(false);
          setPreview(null);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onStoryCreated?.();
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setOpen(false);
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isImage = selectedFile?.type.startsWith('image/');
  const isVideo = selectedFile?.type.startsWith('video/');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 flex-shrink-0"
        aria-label="Adicionar Story"
      >
        <div className="relative p-0.5 rounded-full bg-gradient-to-br from-primary via-orange-500 to-yellow-500">
          <div className="p-0.5 bg-background rounded-full">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </div>
        <span className="text-xs text-foreground/80 max-w-[70px] truncate">
          Adicionar
        </span>
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Story</DialogTitle>
            <DialogDescription>
              Compartilhe uma foto ou vídeo que expirará em 24 horas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!preview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="story-file-input"
                />
                <label
                  htmlFor="story-file-input"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="p-4 rounded-full bg-muted">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Imagem (até 10MB) ou Vídeo (até 50MB)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black">
                  {isImage ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : isVideo ? (
                    <video
                      src={preview}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : null}
                  <button
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    disabled={isPending}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isImage && <Image className="w-4 h-4" />}
                  {isVideo && <Video className="w-4 h-4" />}
                  <span>{selectedFile?.name}</span>
                  <span className="text-xs">
                    ({((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isPending}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  'Publicar Story'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
