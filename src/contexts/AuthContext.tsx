import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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
  const setupInProgress = useRef(false);

  const setupNewUser = async (userId: string, userEmail?: string, fullName?: string) => {
    if (setupInProgress.current) return null;
    setupInProgress.current = true;

    try {
      console.log('Setting up new user:', userId);
      
      // Get the free plan
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('code', 'free')
        .single();
      
      if (!freePlan) {
        console.error('Free plan not found');
        setupInProgress.current = false;
        return null;
      }

      // Create salon
      const { data: newSalon, error: salonError } = await supabase
        .from('salons')
        .insert({ name: 'Meu Salão' })
        .select()
        .single();
      
      if (salonError) {
        console.error('Error creating salon:', salonError);
        setupInProgress.current = false;
        return null;
      }

      console.log('Salon created:', newSalon.id);

      // Update profile with salon_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ salon_id: newSalon.id })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Add admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (roleError) {
        console.error('Error creating role:', roleError);
      }

      // Create salon plan
      const { error: planError } = await supabase
        .from('salon_plan')
        .insert({ salon_id: newSalon.id, plan_id: freePlan.id });

      if (planError) {
        console.error('Error creating salon plan:', planError);
      }

      // Create user as professional
      const displayName = fullName || userEmail?.split('@')[0] || 'Admin';
      const { error: profError } = await supabase
        .from('professionals')
        .insert({
          salon_id: newSalon.id,
          profile_id: userId,
          display_name: displayName,
          commission_percent_default: 0,
        });

      if (profError) {
        console.error('Error creating professional:', profError);
      }

      console.log('User setup complete');
      setupInProgress.current = false;
      return newSalon;
    } catch (error) {
      console.error('Error setting up new user:', error);
      setupInProgress.current = false;
      return null;
    }
  };

  const fetchUserData = async (userId: string, userEmail?: string, fullName?: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      setProfile(profileData);

      // Check if user has salon
      if (profileData?.salon_id) {
        // User has salon - fetch all data
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        setUserRole(roleData);

        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('id', profileData.salon_id)
          .maybeSingle();
        setSalon(salonData);

        const { data: planData } = await supabase
          .from('salon_plan')
          .select('*, plan:plans(*)')
          .eq('salon_id', profileData.salon_id)
          .maybeSingle();
        setSalonPlan(planData as (SalonPlan & { plan: Plan }) | null);
      } else {
        // New user - setup automatically
        const newSalon = await setupNewUser(userId, userEmail, fullName);
        if (newSalon) {
          setSalon(newSalon);
          
          // Fetch the newly created data
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          setProfile(updatedProfile);

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          setUserRole(roleData);

          const { data: planData } = await supabase
            .from('salon_plan')
            .select('*, plan:plans(*)')
            .eq('salon_id', newSalon.id)
            .maybeSingle();
          setSalonPlan(planData as (SalonPlan & { plan: Plan }) | null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id, user.email || undefined, user.user_metadata?.full_name);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(
            session.user.id, 
            session.user.email || undefined,
            session.user.user_metadata?.full_name
          );
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
        await fetchUserData(
          session.user.id,
          session.user.email || undefined,
          session.user.user_metadata?.full_name
        );
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
