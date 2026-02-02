// Lista de estados brasileiros com siglas e nomes completos
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const;

export type BrazilianState = typeof BRAZILIAN_STATES[number]['value'];

// Cargos disponíveis no grupo
export const GROUP_POSITIONS = [
  { value: 'presidente', label: 'Presidente' },
  { value: 'vice_presidente', label: 'Vice-presidente' },
  { value: 'diretor', label: 'Diretor' },
  { value: 'secretario', label: 'Secretário' },
  { value: 'tesoureiro', label: 'Tesoureiro / Financeiro' },
  { value: 'suporte', label: 'Suporte' },
] as const;

export type GroupPosition = typeof GROUP_POSITIONS[number]['value'];

// Função para obter o label de um cargo
export function getPositionLabel(position: GroupPosition | null | undefined): string {
  if (!position) return '';
  const found = GROUP_POSITIONS.find(p => p.value === position);
  return found?.label || position;
}

// Função para calcular anos de existência
export function calculateYearsSince(foundedDate: string | null | undefined): number | null {
  if (!foundedDate) return null;
  const founded = new Date(foundedDate);
  const today = new Date();
  const years = today.getFullYear() - founded.getFullYear();
  const monthDiff = today.getMonth() - founded.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < founded.getDate())) {
    return years - 1;
  }
  return years;
}

// Função para formatar data de fundação
export function formatFoundedDate(foundedDate: string | null | undefined): string {
  if (!foundedDate) return '';
  const date = new Date(foundedDate);
  return date.toLocaleDateString('pt-BR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
