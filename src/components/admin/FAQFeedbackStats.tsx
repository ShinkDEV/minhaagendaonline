import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Loader2,
  MessageSquare,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle
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

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  'getting-started': { label: 'Primeiros Passos', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  'agenda': { label: 'Agenda', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  'clients': { label: 'Clientes', color: 'bg-green-500/10 text-green-600 border-green-200' },
  'services': { label: 'Serviços', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  'financial': { label: 'Financeiro', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  'stock': { label: 'Estoque', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  'professionals': { label: 'Profissionais', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  'settings': { label: 'Configurações', color: 'bg-slate-500/10 text-slate-600 border-slate-200' },
  'news': { label: 'Novidades', color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
};

function getRateColor(rate: number): string {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getRateBadgeVariant(rate: number): 'default' | 'secondary' | 'destructive' {
  if (rate >= 70) return 'default';
  if (rate >= 50) return 'secondary';
  return 'destructive';
}

function getStatusIcon(rate: number) {
  if (rate >= 80) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (rate >= 60) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

export function FAQFeedbackStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['faq-feedback-stats'],
    queryFn: async () => {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('faq_feedback')
        .select('faq_id, is_helpful');
      
      if (feedbackError) throw feedbackError;

      const { data: faqsData, error: faqsError } = await supabase
        .from('faqs')
        .select('id, question, category');
      
      if (faqsError) throw faqsError;

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

      result.sort((a, b) => b.total_count - a.total_count);
      return result;
    },
  });

  const totalFeedback = stats?.reduce((acc, s) => acc + s.total_count, 0) || 0;
  const totalHelpful = stats?.reduce((acc, s) => acc + s.helpful_count, 0) || 0;
  const totalNotHelpful = stats?.reduce((acc, s) => acc + s.not_helpful_count, 0) || 0;
  const overallRate = totalFeedback > 0 ? (totalHelpful / totalFeedback) * 100 : 0;
  const faqsWithFeedback = stats?.length || 0;
  const needsAttention = stats?.filter(s => s.helpful_rate < 70 && s.total_count >= 1).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground p-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-destructive" />
        <p>Erro ao carregar estatísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{totalFeedback}</p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Total de Feedbacks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">{totalHelpful}</p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">Avaliações Positivas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                overallRate >= 70 ? 'bg-green-500/20' : overallRate >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20'
              }`}>
                {overallRate >= 70 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className={`h-6 w-6 ${overallRate >= 50 ? 'text-amber-600' : 'text-red-600'}`} />
                )}
              </div>
              <div>
                <p className={`text-3xl font-bold ${getRateColor(overallRate)}`}>{overallRate.toFixed(0)}%</p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">Taxa de Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{needsAttention}</p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">Precisam Melhorar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Summary Bar */}
      {totalFeedback > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Distribuição de Avaliações</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Positivo ({totalHelpful})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Negativo ({totalNotHelpful})
                </span>
              </div>
            </div>
            <div className="h-4 rounded-full overflow-hidden bg-muted flex">
              <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${overallRate}%` }}
              />
              <div 
                className="h-full bg-red-500 transition-all duration-500" 
                style={{ width: `${100 - overallRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table */}
      {stats && stats.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Detalhamento por FAQ
              <Badge variant="secondary" className="ml-2">{faqsWithFeedback} FAQs</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40%]">Pergunta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((faq) => {
                    const categoryConfig = CATEGORY_CONFIG[faq.category] || { 
                      label: faq.category, 
                      color: 'bg-gray-500/10 text-gray-600 border-gray-200' 
                    };
                    
                    return (
                      <TableRow key={faq.faq_id} className="group hover:bg-muted/50">
                        <TableCell>
                          <p className="text-sm font-medium line-clamp-2 group-hover:line-clamp-none transition-all" title={faq.question}>
                            {faq.question}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${categoryConfig.color}`}
                          >
                            {categoryConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-green-600">{faq.helpful_count}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-red-600">{faq.not_helpful_count}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-muted-foreground">{faq.total_count}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress 
                              value={faq.helpful_rate} 
                              className={`h-2 w-16 ${
                                faq.helpful_rate >= 70 ? '' : '[&>div]:bg-amber-500'
                              } ${faq.helpful_rate < 50 ? '[&>div]:bg-red-500' : ''}`}
                            />
                            <Badge variant={getRateBadgeVariant(faq.helpful_rate)} className="min-w-[52px] justify-center">
                              {faq.helpful_rate.toFixed(0)}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getStatusIcon(faq.helpful_rate)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-lg mb-1">Nenhum feedback ainda</h3>
            <p className="text-muted-foreground text-sm">
              Os feedbacks aparecerão aqui quando os usuários avaliarem as FAQs no Help Center
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
