import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Building2, Percent, Loader2, MapPin, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProfessionalAvatarUpload } from '@/components/ProfessionalAvatarUpload';

export default function Profile() {
  const { profile, salon, user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

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

  const handleAvatarChange = (url: string | null) => {
    queryClient.invalidateQueries({ queryKey: ['my-professional-profile'] });
    queryClient.invalidateQueries({ queryKey: ['professionals'] });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Tente novamente',
      });
      setSigningOut(false);
    }
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
              {professional ? (
                <ProfessionalAvatarUpload
                  professionalId={professional.id}
                  currentAvatarUrl={professional.avatar_url}
                  displayName={professional.display_name}
                  onAvatarChange={handleAvatarChange}
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-2xl">
                    {getInitials(profile?.full_name || 'U')}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-bold mt-4">{profile?.full_name}</h2>
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
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={(salon as any)?.logo_url || undefined} alt={salon?.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {salon?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{salon?.name}</p>
              </div>
            </div>
            
            {(salon?.address || salon?.phone) && (
              <div className="space-y-2 pt-2 border-t">
                {salon?.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{salon.address}</span>
                  </div>
                )}
                {salon?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{salon.phone}</span>
                  </div>
                )}
              </div>
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
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          {signingOut ? 'Saindo...' : 'Sair da conta'}
        </Button>
      </div>
    </AppLayout>
  );
}