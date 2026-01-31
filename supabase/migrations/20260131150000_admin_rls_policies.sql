-- =====================================================
-- ADMIN RLS POLICIES - Acesso Total para Administradores
-- =====================================================
-- Esta migration adiciona políticas RLS que permitem
-- usuários com role 'admin' terem acesso total a todas as tabelas

-- =====================================================
-- PROFILES - Admins podem atualizar/deletar qualquer perfil
-- =====================================================
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- POSTS - Admins podem modificar/deletar qualquer post
-- =====================================================
CREATE POLICY "Admins can update any post" ON public.posts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any post" ON public.posts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- POST_COMMENTS - Admins podem modificar/deletar qualquer comentário
-- =====================================================
CREATE POLICY "Admins can update any comment" ON public.post_comments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any comment" ON public.post_comments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- POST_LIKES - Admins podem gerenciar likes
-- =====================================================
CREATE POLICY "Admins can delete any like" ON public.post_likes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- STORIES - Admins podem ver todas (incluindo expiradas) e deletar qualquer story
-- =====================================================
CREATE POLICY "Admins can view all stories including expired" ON public.stories
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any story" ON public.stories
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- STORY_VIEWS - Admins podem ver todas as visualizações
-- =====================================================
CREATE POLICY "Admins can view all story views" ON public.story_views
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- GROUPS - Admins podem modificar/deletar qualquer grupo
-- =====================================================
CREATE POLICY "Admins can update any group" ON public.groups
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any group" ON public.groups
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- GROUP_MEMBERSHIPS - Admins podem gerenciar membros de qualquer grupo
-- =====================================================
CREATE POLICY "Admins can view all group memberships" ON public.group_memberships
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert group memberships" ON public.group_memberships
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any group membership" ON public.group_memberships
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any group membership" ON public.group_memberships
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- USER_LOCATIONS - Admins podem ver todas as localizações (online e offline)
-- =====================================================
CREATE POLICY "Admins can view all user locations" ON public.user_locations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any user location" ON public.user_locations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any user location" ON public.user_locations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- USER_ROLES - Admins podem gerenciar roles (INSERT/UPDATE/DELETE)
-- =====================================================
CREATE POLICY "Admins can insert user roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- USER_BADGES - Admins podem gerenciar badges de usuários
-- =====================================================
CREATE POLICY "Admins can insert user badges" ON public.user_badges
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user badges" ON public.user_badges
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user badges" ON public.user_badges
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- BADGES - Admins podem gerenciar badges do sistema
-- =====================================================
CREATE POLICY "Admins can insert badges" ON public.badges
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update badges" ON public.badges
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete badges" ON public.badges
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- USER_FOLLOWS - Admins podem gerenciar relacionamentos de follow
-- =====================================================
CREATE POLICY "Admins can insert user follows" ON public.user_follows
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any user follow" ON public.user_follows
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
