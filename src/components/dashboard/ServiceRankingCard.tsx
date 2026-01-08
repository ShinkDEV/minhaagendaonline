import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scissors } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useServiceRanking } from '@/hooks/useDashboardReports';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(221.2 83.2% 60%)',
  'hsl(250 95.2% 70%)',
  'hsl(280 87% 65%)',
  'hsl(320 87% 55%)',
];

export function ServiceRankingCard() {
  const { data: ranking = [], isLoading } = useServiceRanking();

  const totalCount = ranking.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scissors className="h-4 w-4 text-primary" />
          Serviços Populares
        </CardTitle>
        <p className="text-xs text-muted-foreground">Este mês</p>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : ranking.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
            Sem dados disponíveis
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Pie Chart */}
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ranking}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    dataKey="count"
                    stroke="none"
                  >
                    {ranking.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${((value / totalCount) * 100).toFixed(0)}%)`, 
                      props.payload.name
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {ranking.map((service, idx) => (
                <div key={service.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm truncate flex-1">{service.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {service.count}x
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
