-- =====================================================
-- SCRIPT PARA ATRIBUIR ROLE DE ADMIN
-- =====================================================
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
-- 2. Vá em Authentication > Users
-- 3. Encontre seu usuário e copie o UUID
-- 4. Substitua 'SEU_USER_ID_AQUI' abaixo pelo seu UUID
-- 5. Execute este script no SQL Editor do Supabase
-- =====================================================

-- Atribuir role de admin para o desenvolvedor
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo seu UUID do Supabase
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID_AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar se a role foi atribuída corretamente
-- Execute esta query para confirmar (substitua o UUID também):
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  p.username,
  p.name,
  p.email
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.user_id = 'SEU_USER_ID_AQUI' AND ur.role = 'admin';

-- Se a query acima retornar uma linha, você tem acesso de admin!
