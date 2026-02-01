-- =====================================================
-- ADICIONAR CAMPOS DE TEXTO E FEATURES AOS STORIES
-- =====================================================

-- 1. ADICIONAR CAMPOS DE TEXTO
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS text TEXT;

ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';

ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS text_bg BOOLEAN DEFAULT false;

ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS text_x_percent DECIMAL(5, 4);

ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS text_y_percent DECIMAL(5, 4);

-- 3. ADICIONAR CAMPOS DE STICKERS (JSON)
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS stickers JSONB;

-- 4. ADICIONAR CAMPO DE DESTAQUES
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS highlight_id UUID;

-- 5. ADICIONAR CAMPOS DE STORY PATROCINADO
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;

ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS cta_url TEXT;

-- 6. COMENTÁRIOS
COMMENT ON COLUMN public.stories.text IS 'Texto sobre o story';
COMMENT ON COLUMN public.stories.text_color IS 'Cor do texto em hexadecimal';
COMMENT ON COLUMN public.stories.text_bg IS 'Se o texto tem fundo para melhor legibilidade';
COMMENT ON COLUMN public.stories.text_x_percent IS 'Posição X do texto em percentual (0.0-1.0)';
COMMENT ON COLUMN public.stories.text_y_percent IS 'Posição Y do texto em percentual (0.0-1.0)';
COMMENT ON COLUMN public.stories.stickers IS 'Array de stickers/emojis com posição (JSON)';
COMMENT ON COLUMN public.stories.highlight_id IS 'ID do highlight/destaque (futuro)';
COMMENT ON COLUMN public.stories.is_sponsored IS 'Se o story é patrocinado';
COMMENT ON COLUMN public.stories.cta_url IS 'URL do call-to-action para stories patrocinados';
