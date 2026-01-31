-- =====================================================
-- MAP LOCATION FEATURES
-- Adiciona campos de localizacao para grupos e novas tabelas
-- =====================================================

-- 1. Adicionar campos de localizacao na tabela groups
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS is_visible_on_map BOOLEAN NOT NULL DEFAULT false;

-- 2. Criar tabela location_photos para galeria de fotos dos locais/grupos
CREATE TABLE IF NOT EXISTS public.location_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 3. Criar tabela location_reviews para avaliacoes e comentarios
CREATE TABLE IF NOT EXISTS public.location_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- 4. Criar indices para melhor performance
CREATE INDEX IF NOT EXISTS idx_groups_location ON public.groups(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_visible_on_map = true;
CREATE INDEX IF NOT EXISTS idx_location_photos_group_id ON public.location_photos(group_id);
CREATE INDEX IF NOT EXISTS idx_location_reviews_group_id ON public.location_reviews(group_id);
CREATE INDEX IF NOT EXISTS idx_location_reviews_user_id ON public.location_reviews(user_id);

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE public.location_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_reviews ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies para location_photos
CREATE POLICY "Location photos are viewable by everyone" ON public.location_photos
  FOR SELECT USING (true);

CREATE POLICY "Group admins can add photos" ON public.location_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_group_admin(group_id) 
    OR auth.uid() = uploaded_by
  );

CREATE POLICY "Group admins or uploader can update photos" ON public.location_photos
  FOR UPDATE TO authenticated
  USING (
    public.is_group_admin(group_id) 
    OR auth.uid() = uploaded_by
  );

CREATE POLICY "Group admins or uploader can delete photos" ON public.location_photos
  FOR DELETE TO authenticated
  USING (
    public.is_group_admin(group_id) 
    OR auth.uid() = uploaded_by
  );

-- 7. RLS Policies para location_reviews
CREATE POLICY "Location reviews are viewable by everyone" ON public.location_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can add reviews" ON public.location_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.location_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.location_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 8. Trigger para atualizar updated_at em location_reviews
CREATE TRIGGER update_location_reviews_updated_at
  BEFORE UPDATE ON public.location_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
