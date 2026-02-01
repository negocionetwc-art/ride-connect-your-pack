import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Camera, Route, Zap, Users } from 'lucide-react';

interface FloatingActionButtonProps {
  onOptionSelect: (option: 'photo' | 'route' | 'live' | 'group') => void;
}

const options = [
  { id: 'photo', icon: Camera, label: 'Foto', color: 'from-blue-500 to-cyan-500', delay: 0 },
  { id: 'route', icon: Route, label: 'Rota', color: 'from-primary to-orange-400', delay: 0.05 },
  { id: 'live', icon: Zap, label: 'Ao Vivo', color: 'from-red-500 to-pink-500', delay: 0.1 },
  { id: 'group', icon: Users, label: 'Grupo', color: 'from-green-500 to-emerald-500', delay: 0.15 },
];

export const FloatingActionButton = ({ onOptionSelect }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMainClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔥 FAB: Main button clicked! Current state:', isOpen);
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (e: React.MouseEvent, optionId: 'photo' | 'route' | 'live' | 'group') => {
    e.preventDefault();
    e.stopPropagation();
    console.log('✅ FAB: Option clicked:', optionId);
    onOptionSelect(optionId);
    setIsOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔙 FAB: Backdrop clicked');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-6 z-[60]">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
            style={{ margin: '-80px -24px' }}
          />
        )}
      </AnimatePresence>

      {/* Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-3">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: option.delay }
                  }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  onClick={(e) => handleOptionClick(e, option.id as any)}
                  className="flex items-center gap-3 cursor-pointer relative z-[70]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Label */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: option.delay + 0.1 }
                    }}
                    className="px-3 py-2 bg-card rounded-lg shadow-xl border border-border whitespace-nowrap pointer-events-none"
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </motion.div>

                  {/* Icon Button */}
                  <div className={`p-3 rounded-full bg-gradient-to-br ${option.color} shadow-xl pointer-events-none`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <button
        type="button"
        onClick={handleMainClick}
        className={`relative p-4 rounded-full shadow-2xl transition-all duration-300 cursor-pointer z-[70] ${
          isOpen 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : 'bg-gradient-to-br from-primary to-orange-600'
        }`}
        style={{ 
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" style={{ transform: 'rotate(-45deg)' }} />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
        
        {/* Ripple Effect */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-orange-600 opacity-30 animate-ping" 
                style={{ animationDuration: '2s' }} />
        )}
      </button>
    </div>
  );
};
