-- =====================================================
-- Adiciona campo para imagem de capa do perfil
-- =====================================================

-- Adicionar coluna cover_url na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN cover_url TEXT;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.cover_url IS 'URL da imagem de capa do perfil do usuário';
