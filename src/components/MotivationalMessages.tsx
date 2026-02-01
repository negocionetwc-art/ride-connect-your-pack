// Componente wrapper para usar o hook de mensagens motivacionais
// Este componente não renderiza nada, apenas usa o hook para disparar mensagens

import { useMotivationalMessages } from '@/hooks/useMotivationalMessages';

interface MotivationalMessagesProps {
  currentDistance: number;
  isTracking: boolean;
}

export const MotivationalMessages = ({ currentDistance, isTracking }: MotivationalMessagesProps) => {
  useMotivationalMessages(currentDistance, isTracking);
  return null; // Componente não renderiza nada
};
