import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Image, MapPin, Route, Users, Zap } from 'lucide-react';

interface CreatePostProps {
  onClose: () => void;
}

const postTypes = [
  { id: 'photo', icon: Camera, label: 'Foto', color: 'from-blue-500 to-cyan-500' },
  { id: 'route', icon: Route, label: 'Rota', color: 'from-primary to-orange-400' },
  { id: 'live', icon: Zap, label: 'Ao Vivo', color: 'from-red-500 to-pink-500' },
  { id: 'group', icon: Users, label: 'Grupo', color: 'from-green-500 to-emerald-500' },
];

export const CreatePost = ({ onClose }: CreatePostProps) => {
  const [selectedType, setSelectedType] = useState('photo');

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
        >
          <X className="w-5 h-5" />
        </motion.button>
        <h1 className="font-semibold">Nova Publicação</h1>
        <button className="text-primary font-semibold">Publicar</button>
      </header>

      <div className="p-4 space-y-6">
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
          className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-4"
        >
          <div className="p-4 rounded-full bg-primary/10">
            <Image className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Adicionar foto ou vídeo</p>
            <p className="text-sm text-muted-foreground">Arraste ou toque para selecionar</p>
          </div>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium">
            Escolher arquivo
          </button>
        </motion.div>

        {/* Caption */}
        <div>
          <textarea
            placeholder="Conte sobre seu rolê..."
            className="w-full h-24 p-4 bg-card rounded-xl border border-border resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
            <MapPin className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Adicionar localização</p>
              <p className="text-xs text-muted-foreground">Marque onde você esteve</p>
            </div>
          </button>

          <button className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
            <Users className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Marcar pessoas</p>
              <p className="text-xs text-muted-foreground">Quem estava com você?</p>
            </div>
          </button>

          <button className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
            <Route className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Anexar rota</p>
              <p className="text-xs text-muted-foreground">Compartilhe seu trajeto</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
