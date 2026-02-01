import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Image, MapPin, Route, Users, Zap, Loader2 } from 'lucide-react';
import { useCreatePost } from '@/hooks/useCreatePost';
import { toast } from '@/hooks/use-toast';

interface CreatePostProps {
  onClose: () => void;
}

const postTypes = [
  { id: 'photo', icon: Camera, label: 'Foto', color: 'from-blue-500 to-cyan-500' },
  { id: 'route', icon: Route, label: 'Rota', color: 'from-primary to-orange-400' },
  { id: 'live', icon: Zap, label: 'Ao Vivo', color: 'from-red-500 to-pink-500' },
  { id: 'group', icon: Users, label: 'Grupo', color: 'from-green-500 to-emerald-500' },
];

const MAX_CAPTION_LENGTH = 2000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10; // Máximo de imagens por post

export const CreatePost = ({ onClose }: CreatePostProps) => {
  const [selectedType, setSelectedType] = useState('photo');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: createPost, isPending } = useCreatePost();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Verificar limite de imagens
    const totalImages = selectedFiles.length + files.length;
    if (totalImages > MAX_IMAGES) {
      toast({
        title: 'Limite excedido',
        description: `Você pode adicionar no máximo ${MAX_IMAGES} imagens por post`,
        variant: 'destructive',
      });
      return;
    }

    // Validar cada arquivo
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro',
          description: `${file.name} não é uma imagem válida`,
          variant: 'destructive',
        });
        continue;
      }

      // Validar tamanho
      if (file.size > MAX_IMAGE_SIZE) {
        toast({
          title: 'Erro',
          description: `${file.name} excede o tamanho máximo de 5MB`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    
    // Resetar input se todas as imagens foram removidas
    if (selectedFiles.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = () => {
    // Validações
    if (!caption.trim() && selectedFiles.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos uma imagem ou legenda',
        variant: 'destructive',
      });
      return;
    }

    if (caption.length > MAX_CAPTION_LENGTH) {
      toast({
        title: 'Atenção',
        description: `A legenda deve ter no máximo ${MAX_CAPTION_LENGTH} caracteres`,
        variant: 'destructive',
      });
      return;
    }

    createPost(
      {
        caption: caption.trim(),
        images: selectedFiles.length > 0 ? selectedFiles : undefined,
        location: location.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const remainingChars = MAX_CAPTION_LENGTH - caption.length;
  const isOverLimit = remainingChars < 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-secondary"
          disabled={isPending}
        >
          <X className="w-5 h-5" />
        </motion.button>
        <h1 className="font-semibold">Nova Publicação</h1>
        <button 
          onClick={handlePublish}
          disabled={isPending || (!caption.trim() && selectedFiles.length === 0)}
          className="text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Publicando...
            </span>
          ) : (
            'Publicar'
          )}
        </button>
      </header>

      <div className="p-4 space-y-6 overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Post Type Selection */}
        <div className="grid grid-cols-4 gap-3">
          {postTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <motion.button
                key={type.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedType(type.id)}
                disabled={isPending}
                className={`relative p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${
                  isSelected ? 'bg-card border-2 border-primary' : 'bg-card border border-border'
                }`}
              >
                <div className={`p-2 rounded-full bg-gradient-to-br ${type.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium">{type.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Image Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {previews.length > 0 ? (
            <div className="space-y-3">
              {/* Grid de previews */}
              <div className={`grid gap-2 ${
                previews.length === 1 ? 'grid-cols-1' :
                previews.length === 2 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      disabled={isPending}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {/* Número da imagem */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão adicionar mais imagens */}
              {previews.length < MAX_IMAGES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <Image className="w-5 h-5" />
                  Adicionar mais imagens ({previews.length}/{MAX_IMAGES})
                </button>
              )}
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-secondary/50 transition-colors"
            >
              <div className="p-4 rounded-full bg-primary/10">
                <Image className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Adicionar fotos</p>
                <p className="text-sm text-muted-foreground">Toque para selecionar (até {MAX_IMAGES})</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isPending}
          />
        </motion.div>

        {/* Caption */}
        <div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Conte sobre seu rolê..."
            disabled={isPending}
            className="w-full h-24 p-4 bg-card rounded-xl border border-border resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
          <div className="flex justify-between items-center mt-1 px-1">
            <span className="text-xs text-muted-foreground">
              {caption.length > 0 && `${caption.length} caracteres`}
            </span>
            <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {remainingChars < 100 && `${remainingChars} restantes`}
            </span>
          </div>
        </div>

        {/* Location Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Adicionar localização"
                disabled={isPending}
                className="w-full bg-transparent text-sm focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Future features - disabled for now */}
          <button 
            className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border opacity-50 cursor-not-allowed"
            disabled
          >
            <Users className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Marcar pessoas</p>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </div>
          </button>

          <button 
            className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border opacity-50 cursor-not-allowed"
            disabled
          >
            <Route className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Anexar rota</p>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
