import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useWeeklyRevenue, useMonthlyRevenue } from '@/hooks/useDashboardReports';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RevenueChart() {
  const { data: weeklyData = [], isLoading: loadingWeekly } = useWeeklyRevenue();
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyRevenue();

  const isLoading = loadingWeekly || loadingMonthly;
  const currentMonth = format(new Date(), 'MMMM', { locale: ptBR });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Faturamento da Semana</span>
          {monthlyData && !loadingMonthly && (
            <div className="flex items-center gap-1 text-sm font-normal">
              {monthlyData.growth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={monthlyData.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {monthlyData.growth >= 0 ? '+' : ''}{monthlyData.growth.toFixed(0)}%
              </span>
            </div>
          )}
        </CardTitle>
        {monthlyData && !loadingMonthly && (
          <p className="text-xs text-muted-foreground">
            R$ {monthlyData.current.toFixed(2)} em {currentMonth}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-[160px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : weeklyData.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                hide
                domain={[0, 'auto']}
              />
              <Tooltip 
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
