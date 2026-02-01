import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGetOrCreateConversation } from '@/hooks/useConversations';

interface Profile {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  level: number;
}

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const NewConversationDialog = ({ 
  isOpen, 
  onClose, 
  onConversationCreated 
}: NewConversationDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { mutate: getOrCreateConversation, isPending } = useGetOrCreateConversation();

  // Buscar usuários
  const { data: users, isLoading } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('profiles')
        .select('id, name, username, avatar_url, level')
        .neq('id', user.id)
        .limit(20);

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
      }

      return data as Profile[];
    },
    enabled: isOpen
  });

  const handleSelectUser = (userId: string) => {
    getOrCreateConversation(userId, {
      onSuccess: (conversationId) => {
        onConversationCreated(conversationId);
        onClose();
        setSearchQuery('');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista de usuários */}
        <ScrollArea className="max-h-[300px]">
          {isLoading || isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  disabled={isPending}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                    <AvatarImage src={user.avatar_url || '/placeholder.svg'} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username} • Nível {user.level}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum usuário encontrado</p>
              <p className="text-sm mt-1">Tente buscar por outro nome</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
