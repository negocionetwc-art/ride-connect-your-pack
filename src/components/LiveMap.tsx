import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, AlertTriangle, Users, Radio, ChevronUp, X } from 'lucide-react';
import { users } from '@/data/mockData';

const onlineRiders = users.filter(u => u.isOnline);

export const LiveMap = () => {
  const [selectedRider, setSelectedRider] = useState<typeof users[0] | null>(null);
  const [showSOS, setShowSOS] = useState(false);

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            <h1 className="font-semibold">Mapa Ao Vivo</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{onlineRiders.length} online</span>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="relative h-[calc(100vh-180px)] bg-secondary overflow-hidden">
        {/* Fake Map Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-muted to-secondary">
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Roads */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600">
            <path d="M 50 0 Q 100 150 200 300 T 350 600" stroke="hsl(var(--muted-foreground))" strokeWidth="8" fill="none" opacity="0.3" />
            <path d="M 0 200 Q 150 250 400 180" stroke="hsl(var(--muted-foreground))" strokeWidth="6" fill="none" opacity="0.3" />
            <path d="M 0 450 Q 200 400 400 480" stroke="hsl(var(--muted-foreground))" strokeWidth="6" fill="none" opacity="0.3" />
          </svg>
        </div>

        {/* Riders on Map */}
        {onlineRiders.map((rider, index) => (
          <motion.button
            key={rider.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.2, type: 'spring' }}
            onClick={() => setSelectedRider(rider)}
            className="absolute"
            style={{
              left: `${20 + index * 25}%`,
              top: `${25 + index * 18}%`,
            }}
          >
            {/* Pulse Ring */}
            <div className="absolute inset-0 -m-4">
              <div className="w-16 h-16 rounded-full border-2 border-primary/40 animate-ping-slow" />
            </div>
            
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-3 border-primary overflow-hidden shadow-lg glow">
                <img src={rider.avatar} alt={rider.name} className="w-full h-full object-cover" />
              </div>
              
              {/* Speed Badge */}
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground">
                {rider.speed} km/h
              </div>
            </div>
          </motion.button>
        ))}

        {/* Current Location */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute inset-0 -m-6 bg-primary/20 rounded-full animate-pulse" />
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-primary-foreground shadow-lg" />
          </div>
        </div>

        {/* SOS Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSOS(true)}
          className="absolute bottom-6 right-4 p-4 bg-destructive rounded-full shadow-lg"
        >
          <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
        </motion.button>

        {/* Convoy Mode Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-6 left-4 flex items-center gap-2 px-4 py-3 bg-card rounded-full shadow-lg border border-border"
        >
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Modo Comboio</span>
        </motion.button>
      </div>

      {/* Online Riders List */}
      <div className="absolute bottom-24 left-4 right-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" />
              Pilotos Próximos
            </h3>
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {onlineRiders.map((rider) => (
              <button
                key={rider.id}
                onClick={() => setSelectedRider(rider)}
                className="flex-shrink-0 flex items-center gap-2 p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <img src={rider.avatar} alt={rider.name} className="w-8 h-8 rounded-full" />
                <div className="text-left">
                  <p className="text-xs font-medium">{rider.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-primary">{rider.speed} km/h</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rider Detail Sheet */}
      <AnimatePresence>
        {selectedRider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedRider(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 pb-10"
            >
              <button
                onClick={() => setSelectedRider(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedRider.avatar}
                  alt={selectedRider.name}
                  className="w-16 h-16 rounded-full ring-2 ring-primary"
                />
                <div>
                  <h3 className="font-bold text-lg">{selectedRider.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRider.bike}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{selectedRider.speed}</p>
                  <p className="text-xs text-muted-foreground">km/h</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{selectedRider.level}</p>
                  <p className="text-xs text-muted-foreground">Nível</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{(selectedRider.totalKm / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-muted-foreground">km total</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">
                  Seguir no Mapa
                </button>
                <button className="flex-1 py-3 bg-secondary rounded-xl font-semibold">
                  Mensagem
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowSOS(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enviar SOS?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Sua localização será compartilhada com todos os membros do grupo e contatos de emergência.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSOS(false)}
                  className="flex-1 py-3 bg-secondary rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-semibold">
                  Enviar SOS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
