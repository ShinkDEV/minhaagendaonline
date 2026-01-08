import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Price IDs for each plan
const PLAN_PRICES: Record<string, string> = {
  'basic': 'price_1SnNHpGaGUx8JjUE7oiRPMUH',      // Plano Basic Mensal - R$ 29,00
  'basic_plus': 'price_1SnNHQGaGUx8JjUE4i1Ga2xV', // Plano Basic+ - R$ 49,00
  'pro': 'price_1SnNHFGaGUx8JjUEvUpkFApW',        // Plano Pro - R$ 79,00
  'pro_plus': 'price_1SnNGkGaGUx8JjUESEPFZYzV',   // Plano Pro+ - R$ 99,00
  'super': 'price_1SnNGCGaGUx8JjUEYuKBBlye',      // Plano Super - R$ 299,00
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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

    // Get plan code from request body
    const { planCode } = await req.json();
    if (!planCode || !PLAN_PRICES[planCode]) {
      throw new Error(`Invalid plan code: ${planCode}. Valid codes: ${Object.keys(PLAN_PRICES).join(', ')}`);
    }
    const priceId = PLAN_PRICES[planCode];
    logStep("Plan selected", { planCode, priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/settings?success=true`,
      cancel_url: `${origin}/settings?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_code: planCode,
      },
    });
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
