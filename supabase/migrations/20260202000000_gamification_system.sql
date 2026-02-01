-- =====================================================
-- RIDECONNECT GAMIFICATION SYSTEM
-- Sistema completo de gamificação com rolês, níveis e conquistas
-- =====================================================

-- 1. NOVAS TABELAS

-- RIDES: Rolês/Viagens rastreados pelo app
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Status e controle
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
  
  -- Dados da viagem
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  distance_km DECIMAL(10, 2) DEFAULT 0,
  
  -- Rota GPS
  route_points JSONB DEFAULT '[]'::jsonb, -- Array de {lat, lng, timestamp, speed}
  start_location TEXT,
  end_location TEXT,
  
  -- Social
  description TEXT,
  photos JSONB DEFAULT '[]'::jsonb, -- Array de URLs de fotos tiradas durante viagem
  tagged_users UUID[] DEFAULT ARRAY[]::UUID[], -- Array de IDs de usuários marcados
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_LEVELS: Configuração de níveis do sistema
CREATE TABLE public.user_levels (
  level INTEGER PRIMARY KEY,
  km_required INTEGER NOT NULL,
  title TEXT NOT NULL, -- "Iniciante", "Piloto", "Veterano", etc.
  badge_icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_XP_LOG: Histórico de XP ganho
CREATE TABLE public.user_xp_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  xp_source VARCHAR(50) NOT NULL, -- 'ride_km', 'ride_complete', 'photo', 'social', etc.
  source_id UUID, -- ID do ride, post, etc.
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BADGE_PROGRESS: Progresso de conquistas por usuário
CREATE TABLE public.badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL,
  percentage DECIMAL(5, 2) DEFAULT 0,
  unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- LEADERBOARD_CACHE: Cache de ranking global
CREATE TABLE public.leaderboard_cache (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  level INTEGER NOT NULL,
  total_km INTEGER NOT NULL,
  total_rides INTEGER NOT NULL,
  rank_position INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ATUALIZAR TABELA PROFILES

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rides INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hours DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level_title TEXT DEFAULT 'Iniciante';

-- 3. ÍNDICES PARA PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_rides_user_id ON public.rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_start_time ON public.rides(start_time);
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_id ON public.badge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_progress_badge_id ON public.badge_progress(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_log_user_id ON public.user_xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_rank ON public.leaderboard_cache(rank_position);

-- 4. DADOS INICIAIS: Tabela de Níveis

INSERT INTO public.user_levels (level, km_required, title, badge_icon) VALUES
  (1, 0, 'Iniciante', '🏍️'),
  (2, 30, 'Piloto Novato', '🎯'),
  (3, 100, 'Piloto', '⭐'),
  (4, 250, 'Piloto Experiente', '🌟'),
  (5, 500, 'Piloto Veterano', '💫'),
  (6, 1000, 'Mestre das Estradas', '👑'),
  (7, 2500, 'Lenda do Asfalto', '🏆'),
  (8, 5000, 'Rei da Pista', '💎'),
  (9, 10000, 'Imortal das Rodovias', '🔥'),
  (10, 25000, 'Deus das Motos', '⚡')
ON CONFLICT (level) DO NOTHING;

-- 5. FUNÇÕES

-- Função: Atualizar progresso de badges
CREATE OR REPLACE FUNCTION public.update_badge_progress(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  badge_record RECORD;
  current_val INTEGER;
  profile_record RECORD;
BEGIN
  -- Buscar dados do perfil
  SELECT total_km, total_rides INTO profile_record
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Processar cada badge
  FOR badge_record IN SELECT * FROM public.badges LOOP
    -- Calcular valor atual baseado no tipo
    current_val := 0;
    
    CASE badge_record.requirement_type
      WHEN 'km' THEN
        current_val := profile_record.total_km;
      WHEN 'rides' THEN
        current_val := profile_record.total_rides;
      WHEN 'followers' THEN
        SELECT COUNT(*) INTO current_val 
        FROM public.user_follows 
        WHERE following_id = p_user_id;
      WHEN 'states' THEN
        -- TODO: Implementar contagem de estados visitados
        current_val := 0;
      WHEN 'time' THEN
        -- TODO: Implementar verificação de horário
        current_val := 0;
      WHEN 'weather' THEN
        -- TODO: Implementar verificação de clima
        current_val := 0;
      ELSE
        current_val := 0;
    END CASE;
    
    -- Inserir ou atualizar progresso
    INSERT INTO public.badge_progress (user_id, badge_id, current_value, target_value, percentage, unlocked)
    VALUES (
      p_user_id,
      badge_record.id,
      current_val,
      badge_record.requirement_value,
      LEAST(100, (current_val::DECIMAL / NULLIF(badge_record.requirement_value, 0) * 100)),
      current_val >= badge_record.requirement_value
    )
    ON CONFLICT (user_id, badge_id) 
    DO UPDATE SET
      current_value = current_val,
      percentage = LEAST(100, (current_val::DECIMAL / NULLIF(badge_record.requirement_value, 0) * 100)),
      unlocked = current_val >= badge_record.requirement_value,
      updated_at = now();
      
    -- Se desbloqueou, adicionar a user_badges
    IF current_val >= badge_record.requirement_value THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (p_user_id, badge_record.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: Atualizar Total KM e Level ao Completar Ride
CREATE OR REPLACE FUNCTION public.update_profile_on_ride_complete()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
  old_level INTEGER;
  profile_km INTEGER;
BEGIN
  -- Só processar se mudou de 'in_progress' para 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status = 'in_progress') THEN
    -- Buscar level atual
    SELECT level, total_km INTO old_level, profile_km
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Atualizar total_km, total_rides, total_hours
    UPDATE public.profiles 
    SET 
      total_km = total_km + COALESCE(NEW.distance_km, 0),
      total_rides = total_rides + 1,
      total_hours = total_hours + COALESCE(NEW.duration_minutes, 0) / 60.0,
      updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Buscar novo total_km após atualização
    SELECT total_km INTO profile_km
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Calcular novo level baseado em total_km
    SELECT level INTO new_level
    FROM public.user_levels
    WHERE km_required <= profile_km
    ORDER BY level DESC
    LIMIT 1;
    
    -- Se não encontrou level, usar level 1
    IF new_level IS NULL THEN
      new_level := 1;
    END IF;
    
    -- Atualizar level se mudou
    IF new_level > old_level THEN
      UPDATE public.profiles 
      SET 
        level = new_level,
        level_title = (SELECT title FROM public.user_levels WHERE level = new_level)
      WHERE id = NEW.user_id;
    END IF;
    
    -- Atualizar progresso de badges
    PERFORM public.update_badge_progress(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: Atualizar Ranking Global
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.leaderboard_cache;
  
  INSERT INTO public.leaderboard_cache (user_id, username, avatar_url, level, total_km, total_rides, rank_position)
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.level,
    p.total_km,
    p.total_rides,
    ROW_NUMBER() OVER (ORDER BY p.total_km DESC, p.total_rides DESC) as rank_position
  FROM public.profiles p
  WHERE p.total_km > 0 OR p.total_rides > 0
  ORDER BY p.total_km DESC, p.total_rides DESC
  LIMIT 1000; -- Top 1000
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: Trigger para updated_at em rides
CREATE OR REPLACE FUNCTION public.update_rides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 6. TRIGGERS

-- Trigger para atualizar perfil quando ride é completado
CREATE TRIGGER on_ride_completed
  AFTER UPDATE ON public.rides
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
  EXECUTE FUNCTION public.update_profile_on_ride_complete();

-- Trigger para updated_at em rides
CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rides_updated_at();

-- 7. RLS POLICIES

-- RLS para rides
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios rides e rides de quem seguem
CREATE POLICY "Users can view own rides and followed users rides"
  ON public.rides FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_follows
      WHERE follower_id = auth.uid() AND following_id = rides.user_id
    )
  );

-- Política: Usuários podem criar seus próprios rides
CREATE POLICY "Users can create own rides"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios rides
CREATE POLICY "Users can update own rides"
  ON public.rides FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios rides
CREATE POLICY "Users can delete own rides"
  ON public.rides FOR DELETE
  USING (auth.uid() = user_id);

-- RLS para user_levels (público, apenas leitura)
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user levels"
  ON public.user_levels FOR SELECT
  USING (true);

-- RLS para user_xp_log
ALTER TABLE public.user_xp_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp log"
  ON public.user_xp_log FOR SELECT
  USING (auth.uid() = user_id);

-- RLS para badge_progress
ALTER TABLE public.badge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badge progress"
  ON public.badge_progress FOR SELECT
  USING (true);

-- RLS para leaderboard_cache (público, apenas leitura)
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard_cache FOR SELECT
  USING (true);

-- 8. COMENTÁRIOS

COMMENT ON TABLE public.rides IS 'Rolês/Viagens rastreados pelo app com GPS em tempo real';
COMMENT ON TABLE public.user_levels IS 'Configuração de níveis do sistema de gamificação';
COMMENT ON TABLE public.user_xp_log IS 'Histórico de XP ganho por cada ação do usuário';
COMMENT ON TABLE public.badge_progress IS 'Progresso de conquistas por usuário com barras de progresso';
COMMENT ON TABLE public.leaderboard_cache IS 'Cache de ranking global atualizado periodicamente';
