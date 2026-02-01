-- =====================================================
-- HABILITAR REALTIME PARA USER_LOCATIONS
-- =====================================================
-- Esta migration habilita o Supabase Realtime na tabela user_locations
-- para permitir atualizações em tempo real no mapa
-- VERSÃO SEGURA - Sem operações destrutivas

-- Habilitar Realtime na tabela user_locations (se ainda não estiver habilitado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_locations'
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
    END IF;
END $$;

-- Adicionar índice para melhorar performance das queries de localização
-- (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_user_locations_online_updated'
    ) THEN
        CREATE INDEX idx_user_locations_online_updated 
        ON user_locations(is_online, updated_at DESC) 
        WHERE is_online = true;
    END IF;
END $$;

-- Índice para queries por coordenadas (útil para busca de riders próximos)
-- (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_user_locations_lat_lng'
    ) THEN
        CREATE INDEX idx_user_locations_lat_lng 
        ON user_locations(latitude, longitude);
    END IF;
END $$;

-- Função para atualizar updated_at automaticamente
-- (usa CREATE OR REPLACE que é seguro)
CREATE OR REPLACE FUNCTION public.update_user_locations_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Criar trigger apenas se não existir (evita DROP)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_user_locations_updated_at'
        AND event_object_table = 'user_locations'
    ) THEN
        CREATE TRIGGER trigger_update_user_locations_updated_at
        BEFORE UPDATE ON user_locations
        FOR EACH ROW
        EXECUTE FUNCTION public.update_user_locations_updated_at();
    END IF;
END $$;

-- Comentários para documentação (seguro, não destrutivo)
COMMENT ON TABLE user_locations IS 'Tabela para rastreamento de localização em tempo real dos usuários. Habilitada para Supabase Realtime.';
COMMENT ON COLUMN user_locations.is_online IS 'Indica se o usuário está compartilhando localização ativamente';
COMMENT ON COLUMN user_locations.updated_at IS 'Última atualização da localização. Usado para determinar se usuário está online (updated_at < 10s)';
