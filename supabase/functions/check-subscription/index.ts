import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
