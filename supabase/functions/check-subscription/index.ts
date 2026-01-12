import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Helper function to get CORS headers with origin validation
const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    Deno.env.get("ALLOWED_ORIGIN"),
    "https://auzbynhwadrrgbtxdrbs.supabase.co",
    "http://localhost:5173",
    "http://localhost:8080",
  ].filter(Boolean);
  
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "";
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Mapping from Stripe product IDs to plan codes
const PRODUCT_TO_PLAN: Record<string, { code: string; name: string; maxProfessionals: number }> = {
  'prod_Tkt3JD4zV6WTl4': { code: 'basic', name: 'Plano Basic Mensal', maxProfessionals: 2 },
  'prod_Tkt3cBlJsL48b7': { code: 'basic_plus', name: 'Plano Basic+', maxProfessionals: 5 },
  'prod_Tkt3U2Ie8rWwoC': { code: 'pro', name: 'Plano Pro', maxProfessionals: 10 },
  'prod_Tkt2UdZB1XvQ7y': { code: 'pro_plus', name: 'Plano Pro+', maxProfessionals: 20 },
  'prod_Tkt2QAH8ve4BfX': { code: 'super', name: 'Plano Super', maxProfessionals: 999 },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has a free trial (unlimited)
    const { data: freeTrial } = await supabaseClient
      .from('free_trial_users')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (freeTrial) {
      // Check if trial was cancelled
      if (freeTrial.cancelled_at) {
        logStep("User's free trial was cancelled", { email: user.email, cancelled_at: freeTrial.cancelled_at });
        return new Response(JSON.stringify({
          subscribed: false,
          plan_code: 'free',
          plan_name: 'Plano Gratuito',
          max_professionals: 1,
          subscription_end: null,
          trial_cancelled: true,
          trial_cancelled_at: freeTrial.cancelled_at,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check if trial has expired based on trial_days
      if (freeTrial.trial_days && freeTrial.created_at) {
        const createdAt = new Date(freeTrial.created_at);
        const expiresAt = new Date(createdAt.getTime() + (freeTrial.trial_days * 24 * 60 * 60 * 1000));
        const now = new Date();
        
        if (now > expiresAt) {
          logStep("User's free trial has expired", { 
            email: user.email, 
            trial_days: freeTrial.trial_days,
            created_at: freeTrial.created_at,
            expired_at: expiresAt.toISOString()
          });
          return new Response(JSON.stringify({
            subscribed: false,
            plan_code: 'free',
            plan_name: 'Plano Gratuito',
            max_professionals: 1,
            subscription_end: null,
            trial_expired: true,
            trial_expired_at: expiresAt.toISOString(),
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        
        // Calculate remaining days for response
        const remainingMs = expiresAt.getTime() - now.getTime();
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        
        logStep("User has free trial with limited days", { 
          email: user.email, 
          trial_days: freeTrial.trial_days,
          remaining_days: remainingDays 
        });
        
        // Update free trial with user_id and activated_at if not already set
        if (!freeTrial.user_id || !freeTrial.activated_at) {
          await supabaseClient
            .from('free_trial_users')
            .update({ 
              user_id: user.id, 
              activated_at: freeTrial.activated_at || new Date().toISOString() 
            })
            .eq('id', freeTrial.id);
        }

        return new Response(JSON.stringify({
          subscribed: true,
          is_free_trial: true,
          plan_code: 'basic',
          plan_name: 'Teste Gratuito (Básico)',
          max_professionals: 2,
          subscription_end: expiresAt.toISOString(),
          trial_days_remaining: remainingDays,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("User has unlimited free trial - granting Basic plan access", { email: user.email });
      
      // Update free trial with user_id and activated_at if not already set
      if (!freeTrial.user_id || !freeTrial.activated_at) {
        await supabaseClient
          .from('free_trial_users')
          .update({ 
            user_id: user.id, 
            activated_at: freeTrial.activated_at || new Date().toISOString() 
          })
          .eq('id', freeTrial.id);
      }

      // Unlimited trial is on Basic plan (1-2 professionals)
      return new Response(JSON.stringify({
        subscribed: true,
        is_free_trial: true,
        plan_code: 'basic',
        plan_name: 'Teste Gratuito (Básico)',
        max_professionals: 2,
        subscription_end: null, // No expiration for unlimited trials
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found - returning free plan");
      return new Response(JSON.stringify({
        subscribed: false,
        plan_code: 'free',
        plan_name: 'Plano Gratuito',
        max_professionals: 1,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found - returning free plan");
      return new Response(JSON.stringify({
        subscribed: false,
        plan_code: 'free',
        plan_name: 'Plano Gratuito',
        max_professionals: 1,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const productId = subscription.items.data[0].price.product as string;
    
    const planInfo = PRODUCT_TO_PLAN[productId] || { 
      code: 'unknown', 
      name: 'Plano Desconhecido', 
      maxProfessionals: 1 
    };
    
    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      productId, 
      planCode: planInfo.code,
      endDate: subscriptionEnd 
    });

    // Check if user already has a salon
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('salon_id')
      .eq('id', user.id)
      .single();

    let salonId = profile?.salon_id;

    // If user has active subscription but no salon, create one and make them admin
    if (!salonId) {
      logStep("User has subscription but no salon - creating salon and assigning admin role");

      // Create salon using user's name or email
      const salonName = user.user_metadata?.full_name 
        ? `Salão de ${user.user_metadata.full_name}` 
        : `Salão ${user.email?.split('@')[0]}`;

      const { data: newSalon, error: salonError } = await supabaseClient
        .from('salons')
        .insert({ name: salonName })
        .select()
        .single();

      if (salonError) {
        logStep("Error creating salon", { error: salonError.message });
        throw new Error(`Failed to create salon: ${salonError.message}`);
      }

      salonId = newSalon.id;
      logStep("Salon created", { salonId, salonName });

      // Update user profile with salon_id
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ salon_id: salonId })
        .eq('id', user.id);

      if (profileError) {
        logStep("Error updating profile", { error: profileError.message });
      }

      // Assign admin role to user
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .upsert({ 
          user_id: user.id, 
          role: 'admin' 
        }, { 
          onConflict: 'user_id,role' 
        });

      if (roleError) {
        logStep("Error assigning admin role", { error: roleError.message });
      } else {
        logStep("Admin role assigned to user");
      }

      // Link salon to plan
      const { data: planData } = await supabaseClient
        .from('plans')
        .select('id')
        .eq('code', planInfo.code)
        .single();

      if (planData) {
        const { error: salonPlanError } = await supabaseClient
          .from('salon_plan')
          .upsert({
            salon_id: salonId,
            plan_id: planData.id,
          }, {
            onConflict: 'salon_id'
          });

        if (salonPlanError) {
          logStep("Error linking salon to plan", { error: salonPlanError.message });
        } else {
          logStep("Salon linked to plan", { planCode: planInfo.code });
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: true,
      plan_code: planInfo.code,
      plan_name: planInfo.name,
      max_professionals: planInfo.maxProfessionals,
      subscription_end: subscriptionEnd,
      product_id: productId,
      salon_id: salonId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});