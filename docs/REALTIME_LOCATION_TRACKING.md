# Sistema de Rastreamento de Localização em Tempo Real

## 📋 Visão Geral

Este sistema implementa rastreamento de localização em tempo real no mapa, permitindo que os avatares dos riders se movam suavemente conforme eles se deslocam.

## 🗄️ Migração SQL

### Arquivo da Migração

A migração está localizada em:
```
supabase/migrations/20260202140000_enable_realtime_locations.sql
```

### Como Aplicar a Migração

#### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Se você tem o Supabase CLI instalado
supabase db push

# Ou se estiver usando migrações locais
supabase migration up
```

#### Opção 2: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo de migração
6. Clique em **Run** ou pressione `Ctrl+Enter`

#### Opção 3: Via SQL Editor Direto

Copie e cole o seguinte SQL no SQL Editor do Supabase:

```sql
-- =====================================================
-- HABILITAR REALTIME PARA USER_LOCATIONS
-- =====================================================

-- Habilitar Realtime na tabela user_locations (se ainda não estiver habilitado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_locations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
    END IF;
END $$;

-- Adicionar índice para melhorar performance das queries de localização
CREATE INDEX IF NOT EXISTS idx_user_locations_online_updated 
ON user_locations(is_online, updated_at DESC) 
WHERE is_online = true;

-- Índice para queries por coordenadas
CREATE INDEX IF NOT EXISTS idx_user_locations_lat_lng 
ON user_locations(latitude, longitude);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em cada UPDATE
DROP TRIGGER IF EXISTS trigger_update_user_locations_updated_at ON user_locations;
CREATE TRIGGER trigger_update_user_locations_updated_at
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_locations_updated_at();
```

### Verificar se a Migração Foi Aplicada

Execute no SQL Editor:

```sql
-- Verificar se Realtime está habilitado
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'user_locations';

-- Verificar se os índices foram criados
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'user_locations' 
AND indexname LIKE 'idx_user_locations%';

-- Verificar se o trigger existe
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'user_locations';
```

## 🔧 Componentes Implementados

### 1. Hook `useLocationSharing`

**Localização:** `src/hooks/useLocationSharing.ts`

**Funcionalidades:**
- Captura contínua de localização usando `watchPosition()`
- Throttle inteligente baseado em velocidade:
  - **Parado**: 1 update a cada 5s
  - **Em movimento**: 1 update por segundo
  - **Alta velocidade (>50km/h)**: 500ms
- Atualização automática no banco de dados

### 2. Hook `useLiveLocationTracking`

**Localização:** `src/hooks/useLiveLocationTracking.ts`

**Funcionalidades:**
- Subscrição em tempo real via Supabase Realtime
- Recebe atualizações instantâneas quando riders se movem
- Filtra riders online (atualizados nos últimos 10s)
- Carrega perfis automaticamente

### 3. Componente `LiveMap`

**Localização:** `src/components/LiveMap.tsx`

**Melhorias:**
- Substituído polling por subscrição realtime
- Movimento suave dos marcadores
- Atualização instantânea de posições

## 🚀 Como Funciona

### Fluxo Completo

```
1. Usuário ativa "Compartilhar Localização"
        ↓
2. watchPosition() detecta movimento
        ↓
3. updateLiveLocation() → Supabase (com throttle)
        ↓
4. Supabase Realtime dispara evento
        ↓
5. useLiveLocationTracking() recebe update
        ↓
6. Mapa move o avatar em tempo real (movimento suave)
```

### Throttle Inteligente

O sistema ajusta a frequência de atualização automaticamente:

- **Parado (speed = 0)**: Atualiza a cada 5 segundos
- **Em movimento (0 < speed ≤ 50 km/h)**: Atualiza a cada 1 segundo
- **Alta velocidade (speed > 50 km/h)**: Atualiza a cada 500ms

Isso economiza bateria e recursos quando o usuário está parado, mas mantém precisão quando está em movimento.

## 🧪 Testando o Sistema

### 1. Teste Básico

1. Abra o app em dois dispositivos/navegadores diferentes
2. Faça login com contas diferentes
3. Ative "Compartilhar Localização" em ambos
4. Mova-se com um dos dispositivos
5. Verifique se o avatar se move no mapa do outro dispositivo

### 2. Teste de Performance

1. Ative o compartilhamento
2. Abra o DevTools → Network
3. Verifique que as atualizações seguem o throttle:
   - Parado: ~1 requisição a cada 5s
   - Em movimento: ~1 requisição por segundo

### 3. Teste de Realtime

1. Abra o console do navegador
2. Deve aparecer: `✅ Subscrito a live-locations`
3. Quando outro rider se mover, você verá atualizações instantâneas

## 🔍 Troubleshooting

### Problema: Avatares não se movem

**Soluções:**
1. Verifique se a migração foi aplicada:
   ```sql
   SELECT tablename FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename = 'user_locations';
   ```
2. Verifique se o Realtime está habilitado no Supabase Dashboard:
   - Settings → API → Realtime
3. Verifique o console do navegador para erros

### Problema: Atualizações muito lentas

**Soluções:**
1. Verifique se o throttle está funcionando corretamente
2. Verifique a velocidade do GPS (pode estar lenta em ambientes fechados)
3. Verifique a conexão de internet

### Problema: Erro "Subscription failed"

**Soluções:**
1. Verifique se a tabela `user_locations` existe
2. Verifique se as políticas RLS permitem leitura
3. Verifique se o Realtime está habilitado no projeto

## 📊 Monitoramento

### Verificar Riders Online

```sql
SELECT 
  ul.user_id,
  p.name,
  ul.latitude,
  ul.longitude,
  ul.speed_kmh,
  ul.updated_at,
  NOW() - ul.updated_at AS time_since_update
FROM user_locations ul
JOIN profiles p ON p.id = ul.user_id
WHERE ul.is_online = true
  AND ul.updated_at > NOW() - INTERVAL '10 seconds'
ORDER BY ul.updated_at DESC;
```

### Estatísticas de Uso

```sql
SELECT 
  COUNT(*) as total_online,
  AVG(speed_kmh) as avg_speed,
  MAX(updated_at) as last_update
FROM user_locations
WHERE is_online = true
  AND updated_at > NOW() - INTERVAL '1 minute';
```

## 🔒 Segurança

### Políticas RLS Recomendadas

Certifique-se de que as políticas RLS permitem:
- **Leitura**: Qualquer usuário autenticado pode ver localizações de riders online
- **Escrita**: Apenas o próprio usuário pode atualizar sua localização

Exemplo de política:

```sql
-- Permitir leitura de riders online
CREATE POLICY "Users can view online riders"
ON user_locations
FOR SELECT
USING (is_online = true);

-- Permitir que usuários atualizem apenas sua própria localização
CREATE POLICY "Users can update own location"
ON user_locations
FOR UPDATE
USING (auth.uid() = user_id);
```

## 📝 Notas Importantes

1. **Bateria**: O sistema usa throttle para economizar bateria
2. **Privacidade**: Apenas riders online são visíveis no mapa
3. **Performance**: Índices foram criados para otimizar queries
4. **Escalabilidade**: O sistema suporta muitos riders simultâneos

## 🎯 Próximos Passos

- [ ] Implementar detecção de app em background
- [ ] Adicionar notificações quando riders próximos aparecem
- [ ] Implementar histórico de rotas
- [ ] Adicionar filtros de distância no mapa
