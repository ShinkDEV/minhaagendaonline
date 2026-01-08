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
  salonPlan: (SalonPlan & { plan: Plan }) | null;
  loading: boolean;
  isAdmin: boolean;
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
  const [salonPlan, setSalonPlan] = useState<(SalonPlan & { plan: Plan }) | null>(null);
  const [loading, setLoading] = useState(true);

  const setupNewUser = async (userId: string) => {
    try {
      // Get the free plan
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('code', 'free')
        .single();
      
      if (!freePlan) {
        console.error('Free plan not found');
        return null;
      }

      // Create salon
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .insert({ name: 'Meu Salão' })
        .select()
        .single();
      
      if (salonError) {
        console.error('Error creating salon:', salonError);
        return null;
      }

      // Update profile with salon_id
      await supabase
        .from('profiles')
        .update({ salon_id: salon.id })
        .eq('id', userId);

      // Add admin role
      await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      // Create salon plan
      await supabase
        .from('salon_plan')
        .insert({ salon_id: salon.id, plan_id: freePlan.id });

      // Create user as professional
      const { data: userData } = await supabase.auth.getUser();
      await supabase
        .from('professionals')
        .insert({
          salon_id: salon.id,
          profile_id: userId,
          display_name: userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || 'Admin',
          commission_percent_default: 0,
        });

      return salon;
    } catch (error) {
      console.error('Error setting up new user:', error);
      return null;
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

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      setUserRole(roleData);

      // Check if user has salon, if not create one
      if (profileData?.salon_id) {
        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('id', profileData.salon_id)
          .maybeSingle();
        
        setSalon(salonData);

        // Fetch salon plan
        const { data: planData } = await supabase
          .from('salon_plan')
          .select('*, plan:plans(*)')
          .eq('salon_id', profileData.salon_id)
          .maybeSingle();
        
        setSalonPlan(planData as (SalonPlan & { plan: Plan }) | null);
      } else {
        // New user - setup automatically
        const newSalon = await setupNewUser(userId);
        if (newSalon) {
          setSalon(newSalon);
          // Refetch all data after setup
          await fetchUserData(userId);
        }
      }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setSalon(null);
          setUserRole(null);
          setSalonPlan(null);
        }
        
        setLoading(false);
      }
    );

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
    setSalonPlan(null);
  };

  const isAdmin = userRole?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, salon, userRole, salonPlan, loading, isAdmin,
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
