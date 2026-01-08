import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Invitation {
  id: string;
  salon_id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  invited_by: string | null;
  accepted_at: string | null;
}

export function useInvitations() {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['invitations', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('salon_id', salon.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!salon?.id,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const { salon, user } = useAuth();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!salon?.id || !user?.id) throw new Error('No salon or user');
      
      // Check if invitation already exists
      const { data: existing } = await supabase
        .from('invitations')
        .select('id, status')
        .eq('salon_id', salon.id)
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();
      
      if (existing) {
        throw new Error('Já existe um convite pendente para este email');
      }

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          salon_id: salon.id,
          email: email.toLowerCase(),
          role: 'professional',
          invited_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useInvitationByToken(token: string | null) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase
        .from('invitations')
        .select('*, salon:salons(name)')
        .eq('token', token)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Invitation & { salon: { name: string } }) | null;
    },
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async ({ token, userId }: { token: string; userId: string }) => {
      // Get invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();
      
      if (fetchError || !invitation) {
        throw new Error('Convite não encontrado ou já utilizado');
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Este convite expirou');
      }

      // Update user profile with salon_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ salon_id: invitation.salon_id })
        .eq('id', userId);
      
      if (profileError) throw profileError;

      // Add professional role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'professional' });
      
      // Ignore if role already exists
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Create professional record
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const { error: profError } = await supabase
        .from('professionals')
        .insert({
          salon_id: invitation.salon_id,
          profile_id: userId,
          display_name: profile?.full_name || 'Profissional',
          commission_percent_default: 40,
        });
      
      if (profError && !profError.message.includes('duplicate')) {
        throw profError;
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ 
          status: 'accepted', 
          accepted_at: new Date().toISOString() 
        })
        .eq('id', invitation.id);
      
      if (updateError) throw updateError;

      return invitation;
    },
  });
}
