import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole, Salon, SalonPlan, Plan } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  salon: Salon | null;
  userRole: UserRole | null;
  userRoles: UserRole[];
  salonPlan: (SalonPlan & { plan: Plan }) | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  trialCancelled: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [salonPlan, setSalonPlan] = useState<(SalonPlan & { plan: Plan }) | null>(null);
  const [trialCancelled, setTrialCancelled] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (!error && data) {
        setTrialCancelled(data.trial_cancelled === true);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      setProfile(profileData);

      // Fetch all roles for user (including super_admin)
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      setUserRoles(rolesData as UserRole[] || []);
      setUserRole(rolesData?.[0] as UserRole || null);

      if (profileData?.salon_id) {
        // Fetch salon and plan in parallel
        const [salonResult, planResult] = await Promise.all([
          supabase.from('salons').select('*').eq('id', profileData.salon_id).maybeSingle(),
          supabase.from('salon_plan').select('*, plan:plans(*)').eq('salon_id', profileData.salon_id).maybeSingle()
        ]);

        setSalon(salonResult.data);
        setSalonPlan(planResult.data as (SalonPlan & { plan: Plan }) | null);
      }

      // Check subscription/trial status
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle password recovery event - redirect to reset page
        if (event === 'PASSWORD_RECOVERY') {
          window.location.href = '/reset-password';
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setSalon(null);
          setUserRole(null);
          setSalonPlan(null);
          setTrialCancelled(false);
        }
        
        setLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSalon(null);
    setUserRole(null);
    setUserRoles([]);
    setSalonPlan(null);
    setTrialCancelled(false);
  };

  const isSuperAdmin = userRoles.some(r => r.role === 'super_admin');
  // Super admin with a salon is also treated as admin
  const isAdmin = userRoles.some(r => r.role === 'admin') || (isSuperAdmin && !!profile?.salon_id);

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, salon, userRole, userRoles, salonPlan, loading, isAdmin, isSuperAdmin, trialCancelled,
      signIn, signUp, signOut, refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
