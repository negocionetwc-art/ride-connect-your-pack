import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, UsersRound, MapPin, Loader2 } from 'lucide-react';

export function StatsOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalGroups: 0,
    onlineUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar estatísticas em paralelo
        const [usersResult, postsResult, groupsResult, locationsResult] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('posts').select('id', { count: 'exact', head: true }),
          supabase.from('groups').select('id', { count: 'exact', head: true }),
          supabase.from('user_locations').select('id', { count: 'exact', head: true }).eq('is_online', true),
        ]);

        setStats({
          totalUsers: usersResult.count || 0,
          totalPosts: postsResult.count || 0,
          totalGroups: groupsResult.count || 0,
          onlineUsers: locationsResult.count || 0,
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      description: 'Usuários cadastrados',
    },
    {
      title: 'Total de Posts',
      value: stats.totalPosts,
      icon: FileText,
      description: 'Posts publicados',
    },
    {
      title: 'Total de Grupos',
      value: stats.totalGroups,
      icon: UsersRound,
      description: 'Grupos criados',
    },
    {
      title: 'Usuários Online',
      value: stats.onlineUsers,
      icon: MapPin,
      description: 'Usuários ativos agora',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
