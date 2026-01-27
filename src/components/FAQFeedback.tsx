import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FAQFeedbackProps {
  faqId: string;
}

export function FAQFeedback({ faqId }: FAQFeedbackProps) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<boolean | null>(null);

  // Check if user already submitted feedback for this FAQ
  useEffect(() => {
    async function checkExistingFeedback() {
      if (!user) return;
      
      const { data } = await supabase
        .from('faq_feedback')
        .select('is_helpful')
        .eq('faq_id', faqId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setExistingFeedback(data.is_helpful);
        setSubmitted(data.is_helpful);
      }
    }
    
    checkExistingFeedback();
  }, [faqId, user]);

  const handleFeedback = async (isHelpful: boolean) => {
    if (!user) {
      toast.error('Faça login para enviar feedback');
      return;
    }

    if (existingFeedback !== null) {
      toast.info('Você já enviou feedback para esta pergunta');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('faq_feedback')
        .insert({
          faq_id: faqId,
          user_id: user.id,
          is_helpful: isHelpful
        });

      if (error) throw error;

      setSubmitted(isHelpful);
      setExistingFeedback(isHelpful);
      toast.success('Obrigado pelo seu feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Erro ao enviar feedback');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted !== null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 pt-4 border-t pl-8">
        <Check className="h-4 w-4 text-green-500" />
        <span>Obrigado pelo feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-4 pt-4 border-t pl-8">
      <span className="text-sm text-muted-foreground">Isso foi útil?</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(true)}
          disabled={isLoading}
          className={cn(
            "h-8 gap-1.5 hover:bg-green-50 hover:text-green-600 hover:border-green-300",
            "dark:hover:bg-green-950 dark:hover:text-green-400"
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Sim
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(false)}
          disabled={isLoading}
          className={cn(
            "h-8 gap-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-300",
            "dark:hover:bg-red-950 dark:hover:text-red-400"
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          Não
        </Button>
      </div>
    </div>
  );
}
