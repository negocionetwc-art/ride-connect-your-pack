-- Tabela para curtidas nos stories
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Tabela para comentários nos stories
CREATE TABLE public.story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_story_likes_story_id ON public.story_likes(story_id);
CREATE INDEX idx_story_likes_user_id ON public.story_likes(user_id);
CREATE INDEX idx_story_comments_story_id ON public.story_comments(story_id);
CREATE INDEX idx_story_comments_user_id ON public.story_comments(user_id);

-- Enable RLS
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para story_likes
CREATE POLICY "Usuários podem ver todas as curtidas de stories"
ON public.story_likes FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem curtir stories"
ON public.story_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover própria curtida"
ON public.story_likes FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para story_comments
CREATE POLICY "Usuários podem ver todos os comentários de stories"
ON public.story_comments FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem comentar em stories"
ON public.story_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar próprios comentários"
ON public.story_comments FOR DELETE
USING (auth.uid() = user_id);