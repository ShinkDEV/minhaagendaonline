import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface FeedbackStat {
  faq_id: string;
  question: string;
  category: string;
  helpful_count: number;
  not_helpful_count: number;
  total_count: number;
  helpful_rate: number;
}

const CATEGORIES: Record<string, string> = {
  'getting-started': 'Primeiros Passos',
  'agenda': 'Agenda',
  'clients': 'Clientes',
  'services': 'Serviços',
  'financial': 'Financeiro',
  'stock': 'Estoque',
  'professionals': 'Profissionais',
  'settings': 'Configurações',
};

export function FAQFeedbackStats() {
  // Fetch feedback stats with FAQ details
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['faq-feedback-stats'],
    queryFn: async () => {
      // Get all feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('faq_feedback')
        .select('faq_id, is_helpful');
      
      if (feedbackError) throw feedbackError;

      // Get all FAQs for reference
      const { data: faqsData, error: faqsError } = await supabase
        .from('faqs')
        .select('id, question, category');
      
      if (faqsError) throw faqsError;

      // Calculate stats per FAQ
      const statsMap = new Map<string, { helpful: number; notHelpful: number }>();
      
      feedbackData?.forEach(fb => {
        const existing = statsMap.get(fb.faq_id) || { helpful: 0, notHelpful: 0 };
        if (fb.is_helpful) {
          existing.helpful++;
        } else {
          existing.notHelpful++;
        }
        statsMap.set(fb.faq_id, existing);
      });

      // Create stats array with FAQ details
      const result: FeedbackStat[] = [];
      
      statsMap.forEach((counts, faqId) => {
        const faq = faqsData?.find(f => f.id === faqId);
        const total = counts.helpful + counts.notHelpful;
        const rate = total > 0 ? (counts.helpful / total) * 100 : 0;
        
        result.push({
          faq_id: faqId,
          question: faq?.question || `FAQ ${faqId.slice(0, 8)}...`,
          category: faq?.category || 'unknown',
          helpful_count: counts.helpful,
          not_helpful_count: counts.notHelpful,
          total_count: total,
          helpful_rate: rate,
        });
      });

      // Sort by total feedback count (most feedback first)
      result.sort((a, b) => b.total_count - a.total_count);

      return result;
    },
  });

  // Calculate overall stats
  const totalFeedback = stats?.reduce((acc, s) => acc + s.total_count, 0) || 0;
  const totalHelpful = stats?.reduce((acc, s) => acc + s.helpful_count, 0) || 0;
  const overallRate = totalFeedback > 0 ? (totalHelpful / totalFeedback) * 100 : 0;

  // Get top and bottom FAQs
  const topFAQs = stats?.filter(s => s.total_count >= 1).sort((a, b) => b.helpful_rate - a.helpful_rate).slice(0, 5) || [];
  const needsImprovementFAQs = stats?.filter(s => s.total_count >= 1 && s.helpful_rate < 70).sort((a, b) => a.helpful_rate - b.helpful_rate).slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Erro ao carregar estatísticas
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFeedback}</p>
                <p className="text-xs text-muted-foreground">Total Feedbacks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <ThumbsUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalHelpful}</p>
                <p className="text-xs text-muted-foreground">Úteis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                overallRate >= 70 ? 'bg-green-500/10' : overallRate >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'
              }`}>
                {overallRate >= 70 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className={`h-5 w-5 ${overallRate >= 50 ? 'text-amber-500' : 'text-red-500'}`} />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{overallRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Taxa Positiva</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top FAQs */}
      {topFAQs.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              FAQs Mais Úteis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topFAQs.map((faq) => (
              <div key={faq.faq_id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm truncate flex-1" title={faq.question}>
                    {faq.question}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORIES[faq.category] || faq.category}
                    </Badge>
                    <span className="text-sm font-medium text-green-600">
                      {faq.helpful_rate.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={faq.helpful_rate} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {faq.helpful_count}/{faq.total_count}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Needs Improvement */}
      {needsImprovementFAQs.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              FAQs que Precisam de Melhoria
              <span className="text-xs font-normal text-muted-foreground">(menos de 70% positivo)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needsImprovementFAQs.map((faq) => (
              <div key={faq.faq_id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm truncate flex-1" title={faq.question}>
                    {faq.question}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORIES[faq.category] || faq.category}
                    </Badge>
                    <span className={`text-sm font-medium ${
                      faq.helpful_rate >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {faq.helpful_rate.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={faq.helpful_rate} 
                    className="h-2 flex-1 [&>div]:bg-amber-500" 
                  />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                    {faq.helpful_count}
                    <ThumbsDown className="h-3 w-3 text-red-500 ml-1" />
                    {faq.not_helpful_count}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Feedback Details */}
      {stats && stats.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Todos os Feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {stats.map((faq) => (
                <div key={faq.faq_id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" title={faq.question}>
                        {faq.question}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORIES[faq.category] || faq.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{faq.helpful_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{faq.not_helpful_count}</span>
                      </div>
                      <Badge 
                        variant={faq.helpful_rate >= 70 ? 'default' : faq.helpful_rate >= 50 ? 'secondary' : 'destructive'}
                        className="min-w-[50px] justify-center"
                      >
                        {faq.helpful_rate.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats?.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum feedback recebido ainda</p>
            <p className="text-sm mt-1">Os feedbacks aparecerão aqui quando os usuários avaliarem as FAQs</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
