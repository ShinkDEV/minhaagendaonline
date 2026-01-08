import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';
import { useProfessionalRanking } from '@/hooks/useDashboardReports';
import { cn } from '@/lib/utils';

export function ProfessionalRankingCard() {
  const { data: ranking = [], isLoading } = useProfessionalRanking();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const maxRevenue = ranking[0]?.revenue || 1;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          Top Profissionais
        </CardTitle>
        <p className="text-xs text-muted-foreground">Faturamento do mês</p>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-[140px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : ranking.length === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
            Sem dados disponíveis
          </div>
        ) : (
          <div className="space-y-3">
            {ranking.map((prof, idx) => (
              <div key={prof.id} className="flex items-center gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  idx === 0 ? "bg-yellow-500 text-white" :
                  idx === 1 ? "bg-gray-400 text-white" :
                  idx === 2 ? "bg-amber-600 text-white" :
                  "bg-muted text-muted-foreground"
                )}>
                  {idx + 1}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(prof.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{prof.name}</div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(prof.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">R$ {prof.revenue.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">{prof.appointments} atend.</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
