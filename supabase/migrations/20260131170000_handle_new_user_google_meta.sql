-- =====================================================
-- IMPROVE handle_new_user FOR OAUTH PROVIDERS (GOOGLE)
-- =====================================================
-- Objetivo:
-- - Preencher name e avatar_url corretamente quando o usuário vier do Google OAuth
-- - O Google geralmente envia "name"/"full_name" e "picture" na raw_user_meta_data

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_username TEXT;
  v_avatar_url TEXT;
BEGIN
  v_name :=
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'Novo Piloto'
    );

  v_username :=
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'rider_' || substr(NEW.id::text, 1, 8)
    );

  v_avatar_url :=
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    );

  INSERT INTO public.profiles (id, name, username, avatar_url)
  VALUES (NEW.id, v_name, v_username, v_avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

