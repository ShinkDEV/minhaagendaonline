import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Building2, Percent } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { profile, salon, user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Get professional data for current user
  const { data: professional } = useQuery({
    queryKey: ['my-professional-profile', user?.id, salon?.id],
    queryFn: async () => {
      if (!user?.id || !salon?.id) return null;
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('salon_id', salon.id)
        .eq('profile_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!salon?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AppLayout title="Meu Perfil">
      <div className="space-y-4">
        {/* Profile Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {getInitials(profile?.full_name || 'U')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{profile?.full_name}</h2>
              <Badge variant="outline" className="mt-2">
                {isAdmin ? 'Dono do Salão' : 'Profissional'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Salon Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Salão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{salon?.name}</p>
            {salon?.address && (
              <p className="text-sm text-muted-foreground">{salon.address}</p>
            )}
            {salon?.phone && (
              <p className="text-sm text-muted-foreground">{salon.phone}</p>
            )}
          </CardContent>
        </Card>

        {/* Professional Info (if applicable) */}
        {professional && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Comissão Padrão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {professional.commission_percent_default}%
              </p>
              <p className="text-sm text-muted-foreground">
                Sobre os serviços realizados
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Button variant="destructive" className="w-full" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair da conta
        </Button>
      </div>
    </AppLayout>
  );
}