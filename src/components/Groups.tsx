import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Plus, ChevronRight, TrendingUp } from 'lucide-react';
import { groups } from '@/data/mockData';

const categories = ['Todos', 'Marca', 'Região', 'Estilo'];

export const Groups = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = groups.filter(group => {
    const matchesCategory = activeCategory === 'Todos' || group.category === activeCategory;
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-semibold text-lg">Grupos</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full bg-primary"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar grupos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* My Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Meus Grupos
            </h2>
            <button className="text-sm text-primary font-medium">Ver todos</button>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {groups.filter(g => g.isJoined).map((group, index) => (
              <motion.button
                key={group.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-32"
              >
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-medium text-white truncate">{group.name}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Discover Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Descobrir
            </h2>
          </div>

          <div className="space-y-3">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border/50"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{group.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{group.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {group.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.members.toLocaleString()} membros
                    </span>
                  </div>
                </div>

                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    group.isJoined
                      ? 'bg-secondary text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {group.isJoined ? 'Entrou' : 'Entrar'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
