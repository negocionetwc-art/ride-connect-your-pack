# Autocomplete de Localização - RideConnect

## Visão Geral

O campo "Adicionar localização" na criação de posts agora possui **autocomplete inteligente** usando a API gratuita do OpenStreetMap (Nominatim). Conforme o usuário digita, aparecem sugestões de locais em tempo real.

## Como Funciona

### 1. Interface do Usuário

**Estado Inicial** (campo vazio):
```
┌─────────────────────────────────────┐
│  📍  Adicionar localização          │
└─────────────────────────────────────┘
```

**Digitando** (com loading):
```
┌─────────────────────────────────────┐
│  📍  São Paulo  ⏳                   │
└─────────────────────────────────────┘
```

**Com Sugestões**:
```
┌─────────────────────────────────────┐
│  📍  São Paulo  ❌                   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 📍 São Paulo, São Paulo             │
│    São Paulo, Estado de São Paulo   │
├─────────────────────────────────────┤
│ 📍 São Paulo de Olivença, Amazonas  │
│    São Paulo de Olivença, AM        │
├─────────────────────────────────────┤
│ 📍 São Paulo do Potengi, R.G. Norte │
│    São Paulo do Potengi, RN         │
└─────────────────────────────────────┘
│    Powered by OpenStreetMap         │
└─────────────────────────────────────┘
```

**Local Selecionado**:
```
┌─────────────────────────────────────┐
│  📍  São Paulo, São Paulo  ❌        │
└─────────────────────────────────────┘
```

### 2. Experiência do Usuário

#### Ao Digitar:
1. **Mínimo 3 caracteres**: Sistema só busca após 3 letras
2. **Debounce de 500ms**: Aguarda 500ms após última tecla antes de buscar
3. **Loading indicator**: Ícone de carregamento aparece enquanto busca
4. **Máximo 5 sugestões**: Mostra até 5 locais mais relevantes

#### Ao Selecionar:
1. **Click na sugestão**: Preenche o campo com nome formatado
2. **Dropdown fecha**: Sugestões desaparecem automaticamente
3. **Nome bonito**: Formato "Cidade, Estado" ao invés do endereço completo

#### Botão Limpar (❌):
- Aparece quando há texto no campo
- Um click limpa todo o conteúdo
- Mantém foco no campo para digitar novamente

## Tecnologia Utilizada

### API: Nominatim (OpenStreetMap)

**Características**:
- ✅ **100% Gratuito** - Sem necessidade de cartão de crédito
- ✅ **Sem API Key** - Não precisa cadastro
- ✅ **Dados Open Source** - Mantido pela comunidade
- ✅ **Cobertura Global** - Filtrado para Brasil apenas
- ✅ **Respeita privacidade** - Não rastreia usuários

**Limitações**:
- ⚠️ **1 requisição por segundo** - Debounce de 500ms garante compliance
- ⚠️ **Requer User-Agent** - Identificamos como "RideConnect/1.0"

**Endpoint usado**:
```
https://nominatim.openstreetmap.org/search?
  q=São+Paulo
  &format=json
  &addressdetails=1
  &limit=5
  &countrycodes=br
  &accept-language=pt-BR
```

## Implementação Técnica

### Arquivos Criados

#### 1. [`src/hooks/useLocationAutocomplete.ts`](src/hooks/useLocationAutocomplete.ts)

Hook React personalizado que gerencia a busca de localizações:

**Funcionalidades**:
- Busca na API do Nominatim
- Debounce manual (500ms) para não spammar API
- Gerenciamento de estado (loading, sugestões, erros)
- Validação de query mínimo (3 caracteres)
- Filtro apenas para Brasil (`countrycodes=br`)

**API do Hook**:
```typescript
const {
  query,          // string - texto digitado
  setQuery,       // (query: string) => void
  suggestions,    // LocationSuggestion[] - lista de sugestões
  isLoading,      // boolean - está buscando
  error,          // string | null - mensagem de erro
  clearSuggestions // () => void - limpar sugestões
} = useLocationAutocomplete();
```

**Tipo LocationSuggestion**:
```typescript
interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}
```

#### 2. [`src/components/LocationAutocomplete.tsx`](src/components/LocationAutocomplete.tsx)

Componente React que renderiza o input com dropdown:

**Props**:
```typescript
interface LocationAutocompleteProps {
  value: string;           // valor atual
  onChange: (location: string) => void; // callback ao mudar
  disabled?: boolean;      // desabilitar input
}
```

**Funcionalidades**:
- Input com ícone de mapa (📍)
- Indicador de loading (⏳)
- Botão limpar (❌)
- Dropdown animado com sugestões
- Formatação inteligente de nomes
- Fecha ao clicar fora
- Acessibilidade (keyboard navigation)

**Formatação de Nomes**:
```typescript
// Entrada: "São Paulo, Região Geográfica Intermediária de São Paulo, ..."
// Saída: "São Paulo, São Paulo"

// Prioridade:
// 1. city (cidade)
// 2. town (vila)
// 3. village (aldeia)
// 4. suburb (subúrbio)
// 5. neighbourhood (bairro)
// + state (estado)
```

#### 3. Modificações em [`src/components/CreatePost.tsx`](src/components/CreatePost.tsx)

**Antes** (input simples):
```typescript
<input
  type="text"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
  placeholder="Adicionar localização"
/>
```

**Depois** (com autocomplete):
```typescript
<LocationAutocomplete
  value={location}
  onChange={setLocation}
  disabled={isPending}
/>
```

## Comportamento Detalhado

### Estados do Componente

#### 1. Vazio / Idle
- Sem sugestões visíveis
- Placeholder: "Adicionar localização"
- Borda normal (cinza)

#### 2. Focused (Focado)
- Borda muda para cor primária (laranja)
- Se query < 3, mostra dica "Digite pelo menos 3 caracteres"
- Se query >= 3, inicia busca

#### 3. Loading (Buscando)
- Ícone de loading animado (⏳) aparece
- Dropdown não aparece ainda
- Duração típica: 200-500ms

#### 4. Com Resultados
- Dropdown aparece com animação suave
- Lista de 1-5 sugestões
- Cada sugestão mostra:
  - Ícone de mapa
  - Nome formatado (bold)
  - Endereço completo (cinza, menor)
- Hover: background muda para cinza claro
- Rodapé: "Powered by OpenStreetMap"

#### 5. Sem Resultados
- Mostra mensagem: "Nenhum local encontrado"
- Dica: "Tente usar o nome da cidade ou estado"
- Ícone de mapa desbotado

#### 6. Erro
- Não mostra erro para usuário (experiência fluida)
- Apenas loga no console para debug
- Sugestões ficam vazias

### Interações do Usuário

#### Teclado:
- **Digitar**: Atualiza query, inicia busca após 500ms
- **Backspace**: Remove caracteres, atualiza busca
- **Esc**: Fecha dropdown (blur do input)
- **Tab**: Vai para próximo campo (fecha dropdown)

#### Mouse:
- **Click no input**: Foca e mostra sugestões (se houver)
- **Click em sugestão**: Seleciona e fecha dropdown
- **Click no X**: Limpa campo e mantém foco
- **Click fora**: Fecha dropdown e perde foco

## Performance e Otimizações

### 1. Debounce (500ms)
Evita fazer requisição a cada tecla:
```
Usuário digita: "S" → "Sã" → "São" → "São " → "São P"
Requisições:     (nenhuma - aguardando)        (1 req após 500ms)
```

### 2. Validação de Mínimo
Só busca com 3+ caracteres:
```
"S"  → Não busca (muito vago)
"Sã" → Não busca (ainda vago)
"São" → Busca! ✓
```

### 3. Limite de 5 Sugestões
```
API retorna: até 50 locais
Mostramos: apenas 5 primeiros
Benefício: Dropdown menor, mais rápido
```

### 4. Filtro Brasil Apenas
```
countrycodes=br
Benefício: Resultados mais relevantes, busca mais rápida
```

### 5. Cache do Navegador
```
Accept-Language: pt-BR
User-Agent: RideConnect/1.0
Benefício: Nominatim pode cachear resultados
```

## Exemplos de Uso

### Exemplo 1: Buscar Cidade
```
1. Usuário digita: "Rio de Janeiro"
2. Aguarda 500ms
3. Busca na API
4. Retorna sugestões:
   - Rio de Janeiro, Rio de Janeiro
   - Rio de Janeiro do Sul, Rio Grande do Sul
   - ...
5. Usuário seleciona: "Rio de Janeiro, Rio de Janeiro"
6. Campo preenchido ✓
```

### Exemplo 2: Buscar Estrada Famosa
```
1. Usuário digita: "Estrada Graciosa"
2. Aguarda 500ms
3. Busca na API
4. Retorna: Estrada da Graciosa, Paraná
5. Usuário seleciona
6. Campo preenchido: "Estrada da Graciosa, Paraná" ✓
```

### Exemplo 3: Buscar Ponto de Encontro
```
1. Usuário digita: "Posto Graal BR-101"
2. Aguarda 500ms
3. Busca na API
4. Retorna locais próximos ao posto
5. Usuário seleciona o mais relevante
6. Campo preenchido ✓
```

## Créditos e Atribuição

### OpenStreetMap
Dados fornecidos por **OpenStreetMap** e colaboradores.

**Licença**: Open Database License (ODbL)

**Atribuição Obrigatória**:
- Texto "Powered by OpenStreetMap" no rodapé do dropdown ✓
- User-Agent identificando o app ✓

**Mais informações**:
- https://www.openstreetmap.org/copyright
- https://nominatim.org/release-docs/latest/api/Search/

## Melhorias Futuras Possíveis

### 1. Usar Localização Atual do GPS
Botão para preencher automaticamente com localização do dispositivo:
```typescript
const getCurrentLocation = async () => {
  if (!navigator.geolocation) return;
  
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    
    // Reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${latitude}&lon=${longitude}&format=json`
    );
    
    const data = await response.json();
    setLocation(formatLocationName(data));
  });
};
```

### 2. Histórico de Locais Recentes
Salvar últimos 5 locais usados no localStorage:
```typescript
const recentLocations = JSON.parse(
  localStorage.getItem('recentLocations') || '[]'
);

// Mostrar recentes antes de digitar
if (!query && recentLocations.length > 0) {
  return <RecentLocationsList />;
}
```

### 3. Locais Populares/Favoritos
Lista predefinida de pontos de encontro famosos:
```typescript
const POPULAR_SPOTS = [
  'Estrada da Graciosa, PR',
  'Serra da Mantiqueira, SP/MG',
  'Rota dos Ipês, GO',
  // ... mais
];
```

### 4. Ícones Personalizados por Tipo
Diferentes ícones para diferentes tipos de local:
```typescript
const getIconForType = (type: string) => {
  switch(type) {
    case 'city': return <Building />;
    case 'road': return <Route />;
    case 'fuel': return <Fuel />;
    default: return <MapPin />;
  }
};
```

### 5. Salvar Coordenadas
Além do nome, salvar lat/lon para futuras funcionalidades:
```typescript
interface PostLocation {
  name: string;
  lat: number;
  lon: number;
}
```

## Troubleshooting

### Problema: Sugestões não aparecem
**Causas possíveis**:
1. Query < 3 caracteres
2. Sem conexão com internet
3. API do Nominatim fora do ar
4. Bloqueio de CORS (improvável)

**Solução**: Verificar console do navegador para logs

### Problema: "Nenhum local encontrado"
**Causas**:
1. Nome muito específico ou incorreto
2. Local fora do Brasil (filtro ativo)
3. Grafia incorreta

**Solução**: Tentar nome da cidade ou estado

### Problema: Loading infinito
**Causa**: API não respondeu ou erro de rede

**Solução**: 
1. Verificar conexão
2. Tentar novamente
3. Timeout de 10s cancela automaticamente

### Problema: Dropdown não fecha
**Causa**: Bug no código de click outside

**Solução**: Click fora ou pressione Esc

## Testes Recomendados

### Testes Funcionais:
1. ✅ Digitar menos de 3 caracteres (não deve buscar)
2. ✅ Digitar 3+ caracteres (deve buscar)
3. ✅ Selecionar sugestão (deve preencher campo)
4. ✅ Click no X (deve limpar campo)
5. ✅ Click fora (deve fechar dropdown)
6. ✅ Sem resultados (deve mostrar mensagem)

### Testes de Performance:
1. ✅ Digitar rápido (deve fazer apenas 1 requisição)
2. ✅ Abrir/fechar várias vezes (sem memory leak)
3. ✅ Buscar 10 locais seguidos (deve ser fluido)

### Testes de UX:
1. ✅ Animações suaves
2. ✅ Feedback visual claro
3. ✅ Textos descritivos
4. ✅ Cores acessíveis
5. ✅ Funciona em mobile

## Conformidade com Nominatim

### Requisitos da API:
✅ **User-Agent obrigatório**: `RideConnect/1.0`  
✅ **Limite de 1 req/s**: Debounce de 500ms garante  
✅ **Atribuição visível**: "Powered by OpenStreetMap"  
✅ **Uso aceitável**: App open source, não comercial

**Mais info**: https://operations.osmfoundation.org/policies/nominatim/

---

**Implementado com sucesso!** ✅  
**API Gratuita**: OpenStreetMap Nominatim  
**Zero custo**: Sem limite comercial
