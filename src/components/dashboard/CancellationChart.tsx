import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Line, ComposedChart, ResponsiveContainer } from 'recharts';
import { useCancellationRate } from '@/hooks/useDashboardReports';
import { Skeleton } from '@/components/ui/skeleton';
import { XCircle, TrendingDown, TrendingUp } from 'lucide-react';

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--muted-foreground))',
  },
  cancelled: {
    label: 'Cancelados',
    color: 'hsl(var(--destructive))',
  },
  rate: {
    label: 'Taxa %',
    color: 'hsl(var(--primary))',
  },
};

export function CancellationChart() {
  const { data: cancellationData, isLoading } = useCancellationRate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentMonth = cancellationData?.[cancellationData.length - 1];
  const previousMonth = cancellationData?.[cancellationData.length - 2];
  
  const rateChange = currentMonth && previousMonth 
    ? currentMonth.rate - previousMonth.rate 
    : 0;
  
  const isImproving = rateChange < 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            Taxa de Cancelamento
          </CardTitle>
          {currentMonth && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{currentMonth.rate}%</span>
              {rateChange !== 0 && (
                <div className={`flex items-center text-xs ${isImproving ? 'text-green-600' : 'text-destructive'}`}>
                  {isImproving ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(rateChange).toFixed(1)}%
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Últimos 6 meses • {currentMonth?.cancelled || 0} cancelamentos de {currentMonth?.total || 0} agendamentos
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <ComposedChart data={cancellationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10 }}
              width={30}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10 }}
              width={30}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value, name) => {
                    if (name === 'rate') return [`${value}%`, 'Taxa'];
                    if (name === 'cancelled') return [value, 'Cancelados'];
                    return [value, 'Total'];
                  }}
                />
              } 
            />
            <Bar 
              yAxisId="left"
              dataKey="total" 
              fill="hsl(var(--muted))" 
              radius={[4, 4, 0, 0]} 
              name="total"
            />
            <Bar 
              yAxisId="left"
              dataKey="cancelled" 
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]} 
              name="cancelled"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="rate" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
              name="rate"
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
