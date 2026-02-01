import { motion } from 'framer-motion';
import { Home, Map, Users, User, PlusCircle, Route } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'feed', icon: Home, label: 'Feed' },
  { id: 'map', icon: Map, label: 'Mapa' },
  { id: 'ride', icon: Route, label: 'Rolê' },
  { id: 'create', icon: PlusCircle, label: 'Criar' },
  { id: 'groups', icon: Users, label: 'Grupos' },
  { id: 'profile', icon: User, label: 'Perfil' },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCreate = tab.id === 'create';

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-colors ${
                isCreate ? '' : isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              {isCreate ? (
                <motion.div
                  className="relative -mt-6 p-3 rounded-full bg-gradient-to-br from-primary to-orange-600 glow"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
