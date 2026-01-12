import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already has a salon
    const { data: profile } = await supabase
      .from('profiles')
      .select('salon_id, full_name')
      .eq('id', user.id)
      .single();

    if (profile?.salon_id) {
      return new Response(JSON.stringify({ 
        message: 'User already has a salon',
        salon_id: profile.salon_id 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is a trial user
    const { data: trialUser, error: trialError } = await supabase
      .from('free_trial_users')
      .select('id, email, trial_days')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (!trialUser) {
      return new Response(JSON.stringify({ 
        message: 'User is not a trial user',
        is_trial: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create salon for trial user
    const salonName = profile?.full_name 
      ? `Salão de ${profile.full_name.split(' ')[0]}` 
      : 'Meu Salão';

    const { data: newSalon, error: salonError } = await supabase
      .from('salons')
      .insert({
        name: salonName,
      })
      .select()
      .single();

    if (salonError) {
      console.error('Error creating salon:', salonError);
      return new Response(JSON.stringify({ error: 'Failed to create salon' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update profile with salon_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ salon_id: newSalon.id })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Create admin role for user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin',
      });

    if (roleError && roleError.code !== '23505') {
      console.error('Error creating admin role:', roleError);
    }

    // Update free_trial_users with user_id and activated_at
    const { error: updateTrialError } = await supabase
      .from('free_trial_users')
      .update({ 
        user_id: user.id,
        activated_at: new Date().toISOString()
      })
      .eq('id', trialUser.id);

    if (updateTrialError) {
      console.error('Error updating trial user:', updateTrialError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      salon_id: newSalon.id,
      message: 'Salon and admin role created successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in setup-trial-salon:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
