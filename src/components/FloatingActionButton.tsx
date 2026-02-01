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

  const handleOptionClick = (optionId: 'photo' | 'route' | 'live' | 'group') => {
    onOptionSelect(optionId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-20 right-6 z-50">
        {/* Options Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-20 right-0 flex flex-col gap-3 mb-3"
            >
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { delay: option.delay }
                    }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    onClick={() => handleOptionClick(option.id as any)}
                    className="flex items-center gap-3 group"
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
                      className="px-3 py-2 bg-card rounded-lg shadow-lg border border-border whitespace-nowrap"
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                    </motion.div>

                    {/* Icon Button */}
                    <div className={`p-3 rounded-full bg-gradient-to-br ${option.color} shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-4 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen 
              ? 'bg-gradient-to-br from-red-500 to-red-600 rotate-45' 
              : 'bg-gradient-to-br from-primary to-orange-600 glow'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            rotate: isOpen ? 45 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="plus"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
              >
                <Plus className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Ripple Effect */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-orange-600 opacity-30"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
    </>
  );
};
