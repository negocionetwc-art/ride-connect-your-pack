# Sistema de Rastreamento de Rolês - RideConnect

## Visão Geral

O RideConnect agora possui um sistema completo de rastreamento de viagens de moto (rolês) com GPS em tempo real. Esta funcionalidade permite que os usuários registrem suas viagens, acumulem quilometragem, subam de nível e desbloqueiem conquistas.

## Como Usar

### 1. Acessar o Rastreador

- Abra o aplicativo RideConnect
- No menu inferior, clique na aba **"Rolê"** (ícone de rota)
- Você verá a tela inicial com o botão "Iniciar Rolê"

### 2. Iniciar um Rolê

1. Clique no botão **"Iniciar Rolê"**
2. O navegador solicitará permissão de localização - **clique em "Permitir"**
3. O GPS será ativado e o rastreamento começará
4. A tela mostrará em tempo real:
   - **Distância percorrida** (km/metros)
   - **Tempo decorrido** (HH:MM:SS)
   - **Velocidade atual** (km/h)

### 3. Durante o Rolê

**Tirar Fotos**:
- Clique no botão **"Foto"**
- O navegador solicitará permissão da câmera
- Tire a foto desejada
- A foto aparecerá em miniatura na tela
- Você pode tirar quantas fotos quiser

**Cancelar Rolê**:
- Clique no **X** no canto superior direito
- Confirme o cancelamento
- ⚠️ **Atenção**: O progresso será perdido e não contará para sua quilometragem

**Progresso de Nível**:
- Se você estiver próximo de subir de nível (menos de 10km), uma barra de progresso aparecerá
- Mostra quantos km faltam para o próximo nível

**Mensagens Motivacionais**:
- O app exibe mensagens motivacionais em marcos importantes (5km, 10km, etc.)

### 4. Finalizar o Rolê

1. Clique no botão **"Finalizar"**
2. O rolê será salvo automaticamente
3. Uma tela de conclusão aparecerá mostrando:
   - Resumo do rolê (distância, tempo, velocidade média)
   - Localização de início e fim
   - Fotos tiradas
4. Você pode adicionar:
   - **Descrição**: Conte sobre sua viagem
   - **Marcar pessoas**: Adicionar amigos que estavam junto (em breve)
5. Clique em **"Salvar e Compartilhar"**

### 5. Sistema de Gamificação

**Level Up** 🎉:
- Se você subir de nível, um popup animado aparecerá
- Cada nível requer mais 30km que o anterior:
  - Nível 1: 0-30 km (Iniciante)
  - Nível 2: 30-60 km (Piloto Novato)
  - Nível 3: 60-100 km (Piloto)
  - E assim por diante...

**Badges Desbloqueados** 🏆:
- Se você desbloquear uma conquista, verá um popup animado
- Exemplos de badges:
  - **Iniciante**: Complete seu primeiro rolê
  - **1000km**: Atinja 1.000km totais
  - **Madrugador**: Faça um rolê antes das 6h
  - **Noturno**: Faça um rolê após 22h

## Requisitos e Permissões

### Permissões do Navegador

**Geolocalização** (obrigatório):
- Solicitada ao iniciar o primeiro rolê
- Necessária para rastreamento GPS
- Modo de alta precisão ativado

**Câmera** (opcional):
- Solicitada ao tirar a primeira foto
- Permite capturar momentos durante a viagem

### Compatibilidade

✅ **Funciona em**:
- Chrome/Edge (desktop e mobile)
- Safari (desktop e mobile)
- Firefox (desktop e mobile)

⚠️ **Requisitos**:
- Conexão com internet (para salvar no banco)
- GPS ativo no dispositivo
- Navegador atualizado

## Configuração do Banco de Dados

### 1. Aplicar Migration de Gamificação

A migration `20260202000000_gamification_system.sql` já foi aplicada automaticamente. Ela cria:
- Tabela `rides` (rolês)
- Tabela `user_levels` (níveis)
- Tabela `user_xp_log` (histórico de XP)
- Tabela `badge_progress` (progresso de badges)
- Triggers automáticos para atualizar `total_km` e nível do perfil

### 2. Configurar Storage Bucket

Execute o script `supabase/scripts/setup_ride_photos.sql` no Supabase SQL Editor:

```bash
# Copiar conteúdo do arquivo e executar no Supabase Dashboard:
# SQL Editor > New Query > Colar > Run
```

Isso criará:
- Bucket `ride-photos` (público)
- Políticas RLS para upload, atualização e deleção

### 3. Verificar Configuração

No Supabase Dashboard:

1. **Database > Tables**:
   - Verifique se a tabela `rides` existe
   - Verifique se `profiles` tem colunas `total_km`, `total_rides`, `level_title`

2. **Storage > Buckets**:
   - Verifique se o bucket `ride-photos` existe
   - Confirme que é público (public: true)

3. **Database > Policies**:
   - Tabela `rides` deve ter 4 policies (SELECT, INSERT, UPDATE, DELETE)
   - Storage `ride-photos` deve ter 4 policies

## Como Funciona (Técnico)

### Rastreamento GPS

1. **Início**: Obtém posição inicial via `navigator.geolocation.getCurrentPosition()`
2. **Durante**: Monitora posição via `navigator.geolocation.watchPosition()`
3. **Cálculo de Distância**: Usa fórmula de Haversine para calcular distância entre pontos GPS
4. **Atualização**: Salva no banco a cada 10 pontos coletados (economia de writes)

### Estrutura do Banco

**Tabela `rides`**:
```sql
- id: UUID
- user_id: UUID (referência para profiles)
- status: 'in_progress' | 'completed' | 'cancelled'
- start_time: Timestamp de início
- end_time: Timestamp de fim
- distance_km: Distância total em km
- duration_minutes: Duração em minutos
- route_points: JSONB (array de {lat, lng, timestamp, speed})
- photos: JSONB (array de URLs)
- description: Texto opcional
- tagged_users: Array de UUIDs
```

**Trigger Automático**:
Quando um `ride` é marcado como `completed`:
1. Atualiza `profiles.total_km += ride.distance_km`
2. Atualiza `profiles.total_rides += 1`
3. Atualiza `profiles.total_hours += ride.duration_minutes / 60`
4. Verifica se o usuário subiu de nível
5. Verifica quais badges foram desbloqueados
6. Atualiza progresso de todas as badges

### Componentes

- **RideTracker.tsx**: Interface do rastreador
- **useRideTracking.ts**: Hook com lógica de GPS e estado
- **RideComplete.tsx**: Tela de conclusão com resumo
- **MotivationalMessages.tsx**: Mensagens durante o rolê

## Troubleshooting

### "Geolocalização não é suportada"
**Causa**: Navegador antigo ou sem suporte a GPS

**Solução**: Use um navegador moderno (Chrome, Safari, Firefox)

### "Permissão de localização negada"
**Causa**: Usuário negou permissão de GPS

**Solução**:
1. Nas configurações do navegador, permita localização para o site
2. Chrome: Configurações > Privacidade > Configurações de site > Localização
3. Recarregue a página e tente novamente

### "Erro ao fazer upload da foto"
**Causa**: Bucket não configurado ou políticas incorretas

**Solução**:
1. Execute o script `setup_ride_photos.sql`
2. Verifique no Supabase Dashboard se o bucket existe
3. Confirme que as policies estão ativas

### "Não foi possível iniciar o rolê"
**Causa**: Usuário não autenticado ou erro de conexão

**Solução**:
1. Verifique se está logado no app
2. Verifique conexão com internet
3. Confira o console do navegador para erros

### Rolê não aparece no perfil
**Causa**: Trigger não executou ou RLS bloqueou

**Solução**:
1. Verifique se o trigger `on_ride_completed` está ativo
2. Execute a query: `SELECT * FROM rides WHERE user_id = 'SEU_UUID'`
3. Confirme que o status é 'completed'

## Roadmap de Melhorias

- [ ] Compartilhar rolê no feed automaticamente
- [ ] Mapa com a rota percorrida
- [ ] Estatísticas avançadas (elevação, paradas, etc.)
- [ ] Comparação com rolês anteriores
- [ ] Desafios semanais/mensais
- [ ] Integração com Strava/Komoot
- [ ] Rolês em grupo (ao vivo)
- [ ] Previsão do tempo antes de iniciar

## Suporte

Para dúvidas ou problemas:
1. Verifique o console do navegador (F12)
2. Consulte os logs do Supabase
3. Revise este documento
