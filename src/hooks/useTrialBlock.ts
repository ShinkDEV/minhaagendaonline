import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export function useTrialBlock() {
  const { trialCancelled } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const blockAction = (actionName?: string) => {
    if (trialCancelled) {
      toast({
        variant: 'destructive',
        title: 'Período de teste encerrado',
        description: 'Escolha um plano para continuar usando esta funcionalidade.',
      });
      navigate('/upgrade');
      return true;
    }
    return false;
  };

  return { trialCancelled, blockAction };
}
