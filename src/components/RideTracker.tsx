import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Camera, MapPin, Route, Clock, Zap, X } from 'lucide-react';
import { useRideTracking } from '@/hooks/useRideTracking';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { MotivationalMessages } from '@/components/MotivationalMessages';
import { RideComplete } from '@/components/RideComplete';

interface RideTrackerProps {
  onComplete?: () => void;
}

export const RideTracker = ({ onComplete }: RideTrackerProps) => {
  const [showComplete, setShowComplete] = useState(false);
  const {
    currentRide,
    isTracking,
    currentDistance,
    elapsedTime,
    currentSpeed,
    photos,
    startRide,
    addPhoto,
    completeRide,
    cancelRide,
    isStarting,
    isCompleting,
  } = useRideTracking();

  const { data: profile } = useProfile();
  const { data: stats } = useProfileStats();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatar distância
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(2)} km`;
  };

  // Calcular próximo objetivo (30km para primeiro nível)
  const nextLevelKm = profile?.level ? (profile.level >= 10 ? 0 : 30 * (profile.level + 1)) : 30;
  const kmToNextLevel = nextLevelKm - (stats?.totalKm || 0) - currentDistance;
  const progressToNextLevel = Math.max(0, Math.min(100, ((stats?.totalKm || 0) + currentDistance) / nextLevelKm * 100));

  // Upload de foto
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upload para storage (assumindo bucket 'ride-photos')
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await (await import('@/integrations/supabase/client')).supabase.storage
        .from('ride-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = (await import('@/integrations/supabase/client')).supabase.storage
        .from('ride-photos')
        .getPublicUrl(fileName);

      addPhoto(publicUrl);
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Iniciar rolê
  const handleStartRide = () => {
    startRide();
  };

  // Finalizar rolê
  const handleCompleteRide = () => {
    completeRide({});
    if (currentRide) {
      setShowComplete(true);
    }
    if (onComplete) {
      setTimeout(onComplete, 500);
    }
  };

  // Cancelar rolê
  const handleCancelRide = () => {
    if (confirm('Tem certeza que deseja cancelar este rolê? O progresso será perdido.')) {
      cancelRide();
    }
  };

  return (
    <>
      {/* Mensagens motivacionais */}
      {isTracking && (
        <MotivationalMessages currentDistance={currentDistance} isTracking={isTracking} />
      )}

      {/* Tela de conclusão */}
      <AnimatePresence>
        {showComplete && currentRide && (
          <RideComplete
            rideId={currentRide.id}
            onClose={() => {
              setShowComplete(false);
              if (onComplete) onComplete();
            }}
          />
        )}
      </AnimatePresence>

      {!showComplete && (
        <div className="min-h-screen pb-20 bg-background">
      {!isTracking ? (
        // Tela inicial - Botão para iniciar rolê
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 w-full max-w-md"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/20">
                <Route className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">Iniciar Rolê</h2>
                <p className="text-muted-foreground text-sm">
                  Registre sua viagem e comece a acumular quilometragem para subir de nível!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleStartRide}
                disabled={isStarting}
                size="lg"
                className="w-full h-14 text-lg font-semibold"
              >
                {isStarting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Iniciar Rolê
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>• O rastreamento GPS será ativado</p>
                <p>• Você pode tirar fotos durante a viagem</p>
                <p>• A quilometragem será contabilizada ao finalizar</p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        // Tela durante o rolê
        <div className="flex flex-col h-screen pb-20">
          {/* Header fixo */}
          <header className="sticky top-0 z-40 glass border-b border-border/30">
            <div className="flex items-center justify-between px-4 h-14">
              <h1 className="font-semibold text-lg">Rolê em Andamento</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelRide}
                className="text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Métricas principais */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-8">
            {/* Distância */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mb-1">Distância</p>
              <p className="text-5xl font-bold text-primary">
                {formatDistance(currentDistance)}
              </p>
            </motion.div>

            {/* Grid de métricas */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-card rounded-xl border border-border/50 text-center"
              >
                <Clock className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
                <p className="text-xs text-muted-foreground">Tempo</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-card rounded-xl border border-border/50 text-center"
              >
                <Zap className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{Math.round(currentSpeed)}</p>
                <p className="text-xs text-muted-foreground">km/h</p>
              </motion.div>
            </div>

            {/* Progresso para próximo nível */}
            {kmToNextLevel > 0 && kmToNextLevel <= 10 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso para próximo nível</span>
                  <span className="font-medium">{progressToNextLevel.toFixed(0)}%</span>
                </div>
                <Progress value={progressToNextLevel} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Faltam {formatDistance(kmToNextLevel)} para o nível {profile?.level ? profile.level + 1 : 2}
                </p>
              </motion.div>
            )}

            {/* Fotos tiradas */}
            {photos.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm"
              >
                <p className="text-sm text-muted-foreground mb-2">Fotos ({photos.length})</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Botões de ação fixos */}
          <div className="sticky bottom-0 glass border-t border-border/30 p-4 space-y-3">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isUploadingPhoto ? 'Enviando...' : 'Foto'}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <Button
                onClick={handleCompleteRide}
                disabled={isCompleting || currentDistance < 0.01}
                className="flex-1"
              >
                {isCompleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Finalizar
                  </>
                )}
              </Button>
            </div>

            {currentDistance < 0.01 && (
              <p className="text-xs text-center text-muted-foreground">
                Mova-se um pouco para poder finalizar o rolê
              </p>
            )}
          </div>
        </div>
      )}
        </div>
      )}
    </>
  );
};
