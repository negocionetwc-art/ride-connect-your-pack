-- =====================================================
-- ADICIONAR CAMPOS INSTITUCIONAIS AOS GRUPOS
-- =====================================================

-- 1. Criar enum para cargos do grupo
CREATE TYPE public.group_position AS ENUM (
  'presidente',
  'vice_presidente',
  'diretor',
  'secretario',
  'tesoureiro',
  'suporte'
);

-- 2. Adicionar campos na tabela groups
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS founded_date DATE,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

-- 3. Adicionar campo de cargo na tabela group_memberships
ALTER TABLE public.group_memberships
  ADD COLUMN IF NOT EXISTS position public.group_position;

-- 4. Criar índice para busca por estado
CREATE INDEX IF NOT EXISTS idx_groups_state ON public.groups(state);

-- 5. Criar índice para busca por cidade
CREATE INDEX IF NOT EXISTS idx_groups_city ON public.groups(city);

-- 6. Comentários para documentação
COMMENT ON COLUMN public.groups.founded_date IS 'Data de fundação do grupo';
COMMENT ON COLUMN public.groups.state IS 'Estado onde o grupo está localizado';
COMMENT ON COLUMN public.groups.city IS 'Município onde o grupo está localizado';
COMMENT ON COLUMN public.group_memberships.position IS 'Cargo do membro no grupo (presidente, vice-presidente, diretor, etc.)';
