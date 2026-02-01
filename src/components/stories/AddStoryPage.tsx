import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Video, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateStory } from '@/hooks/useCreateStory';
import { StoryDraggableText } from './StoryDraggableText';

interface AddStoryPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function AddStoryPage({ isOpen, onClose, onSuccess }: AddStoryPageProps) {
  const { mutate: createStory, isPending } = useCreateStory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storyText, setStoryText] = useState<string>('');
  const [textXPercent, setTextXPercent] = useState<number>(0.5); // Posição X inicial (0.5 = centro)
  const [textYPercent, setTextYPercent] = useState<number>(0.5); // Posição Y inicial (0.5 = centro)

  // Reset state quando fechar
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreview(null);
      setUploadStatus('idle');
      setErrorMessage(null);
      setStoryText('');
      setTextXPercent(0.5);
      setTextYPercent(0.5);
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setErrorMessage('Selecione uma imagem ou vídeo');
      return;
    }

    // Validar tamanho
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage(`Arquivo muito grande. Máximo: ${isVideo ? '50MB' : '10MB'}`);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = () => {
    console.log('handlePublish chamado', { selectedFile, isPending });
    
    if (!selectedFile) {
      console.error('Nenhum arquivo selecionado');
      setErrorMessage('Selecione um arquivo antes de publicar');
      return;
    }

    if (isPending) {
      console.warn('Upload já em andamento');
      return;
    }

    console.log('Iniciando upload...');
    setUploadStatus('uploading');
    setErrorMessage(null);
    
    createStory(
      { 
        file: selectedFile,
        text: storyText.trim() || undefined,
        text_x_percent: storyText.trim() ? textXPercent : undefined,
        text_y_percent: storyText.trim() ? textYPercent : undefined,
        text_bg: storyText.trim() && storyText.trim().length > 12 ? true : undefined,
      },
      {
        onSuccess: () => {
          console.log('Story publicado com sucesso');
          setUploadStatus('success');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1000);
        },
        onError: (error) => {
          console.error('Erro ao publicar story:', error);
          setUploadStatus('error');
          setErrorMessage(error.message || 'Erro ao publicar story');
        },
      }
    );
  };

  const handleCancel = () => {
    if (preview) {
      setSelectedFile(null);
      setPreview(null);
      setUploadStatus('idle');
      setErrorMessage(null);
      setStoryText('');
      setTextXPercent(0.5);
      setTextYPercent(0.5);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } else {
      onClose();
    }
  };

  const isImage = selectedFile?.type.startsWith('image/');
  const isVideo = selectedFile?.type.startsWith('video/');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background to-transparent">
          <button
            onClick={handleCancel}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-lg">
            {preview ? 'Confirmar Story' : 'Adicionar Story'}
          </h2>
          <div className="w-9" /> {/* Spacer para centralizar título */}
        </div>

        {/* Conteúdo */}
        <div className="h-full pt-16 pb-24 flex flex-col">
          {!preview ? (
            // Tela de seleção de mídia
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
              <div className="text-center mb-4">
                <p className="text-muted-foreground">
                  Selecione uma foto ou vídeo para compartilhar
                </p>
              </div>

              {/* Inputs ocultos */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="story-gallery-input"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="story-camera-input"
              />

              {/* Botões de seleção */}
              <div className="flex gap-6">
                <motion.label
                  htmlFor="story-camera-input"
                  className="flex flex-col items-center gap-3 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">Câmera</span>
                </motion.label>

                <motion.label
                  htmlFor="story-gallery-input"
                  className="flex flex-col items-center gap-3 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <span className="text-sm font-medium">Galeria</span>
                </motion.label>
              </div>

              {/* Erro */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errorMessage}</span>
                </motion.div>
              )}

              {/* Instruções */}
              <div className="text-center text-xs text-muted-foreground mt-8">
                <p>Formatos aceitos: JPEG, PNG, GIF, MP4, MOV</p>
                <p className="mt-1">Imagens: até 10MB • Vídeos: até 50MB</p>
                <p className="mt-1">O story expira em 24 horas</p>
              </div>
            </div>
          ) : (
            // Tela de confirmação/preview
            <div className="flex-1 flex flex-col">
              {/* Preview da mídia */}
              <div className="flex-1 flex items-center justify-center p-4">
                <div 
                  ref={previewContainerRef}
                  className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-muted"
                >
                  {isImage ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : isVideo ? (
                    <video
                      src={preview}
                      controls
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  ) : null}

                  {/* Input de texto sobre o preview */}
                  {uploadStatus === 'idle' && (
                    <input
                      type="text"
                      placeholder="Digite algo..."
                      className="absolute bottom-32 left-4 right-4 bg-black/40 text-white px-4 py-2 rounded-xl border border-white/20 focus:border-white/40 focus:outline-none placeholder:text-white/60 z-50"
                      value={storyText}
                      onChange={(e) => setStoryText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                    />
                  )}

                  {/* Texto arrastável sobre o preview */}
                  {uploadStatus === 'idle' && storyText.trim() && (
                    <StoryDraggableText
                      text={storyText}
                      color="#fff"
                      bg={storyText.trim().length > 12}
                      initialX={textXPercent}
                      initialY={textYPercent}
                      onPositionChange={(x, y) => {
                        setTextXPercent(x);
                        setTextYPercent(y);
                      }}
                    />
                  )}

                  {/* Overlay de status */}
                  <AnimatePresence>
                    {uploadStatus !== 'idle' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4"
                      >
                        {uploadStatus === 'uploading' && (
                          <>
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                            <p className="text-white font-medium">Publicando...</p>
                          </>
                        )}
                        {uploadStatus === 'success' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-white font-medium">Story publicado!</p>
                          </motion.div>
                        )}
                        {uploadStatus === 'error' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                              <AlertCircle className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-white font-medium">Erro ao publicar</p>
                            <p className="text-white/70 text-sm text-center px-8">
                              {errorMessage}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Info do arquivo */}
              {uploadStatus === 'idle' && selectedFile && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  {isImage && <ImageIcon className="w-4 h-4" />}
                  {isVideo && <Video className="w-4 h-4" />}
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <span>({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com botões */}
        {preview && uploadStatus === 'idle' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
            <div className="flex gap-3 max-w-sm mx-auto">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePublish();
                }}
                disabled={isPending || !selectedFile}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  'Publicar'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Botão de tentar novamente em caso de erro */}
        {uploadStatus === 'error' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
            <div className="flex gap-3 max-w-sm mx-auto">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePublish}
                className="flex-1"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
