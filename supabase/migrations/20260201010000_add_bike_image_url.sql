-- =====================================================
-- Adiciona campo para imagem da moto no perfil
-- =====================================================

-- Adicionar coluna bike_image_url na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN bike_image_url TEXT;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.bike_image_url IS 'URL da imagem da moto do usuário';
