import { useAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { PostsManagement } from '@/components/admin/PostsManagement';
import { GroupsManagement } from '@/components/admin/GroupsManagement';
import { StatsOverview } from '@/components/admin/StatsOverview';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { isAdmin, isLoading } = useAdmin();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-lg">Painel Administrativo</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Voltar ao App
          </Button>
        </div>
      </header>

      <div className="p-4">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4">
            <StatsOverview />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="posts" className="mt-4">
            <PostsManagement />
          </TabsContent>

          <TabsContent value="groups" className="mt-4">
            <GroupsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
