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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get plan code from request body
    const { planCode } = await req.json();
    if (!planCode || !PLAN_PRICES[planCode]) {
      throw new Error(`Invalid plan code: ${planCode}. Valid codes: ${Object.keys(PLAN_PRICES).join(', ')}`);
    }
    const priceId = PLAN_PRICES[planCode];
    logStep("Plan selected", { planCode, priceId });

    // Try to get user if authenticated (optional)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      user = userData?.user;
      if (user?.email) {
        logStep("User authenticated", { userId: user.id, email: user.email });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer already exists (only if user is authenticated)
    let customerId: string | undefined;
    if (user?.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    // Check if user has an active subscription to handle upgrade with proration
    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        const currentSubscription = subscriptions.data[0];
        const currentItemId = currentSubscription.items.data[0].id;
        logStep("Found active subscription, upgrading with proration", { 
          subscriptionId: currentSubscription.id,
          currentItemId 
        });
        
        // Update the existing subscription with proration
        const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
          items: [{
            id: currentItemId,
            price: priceId,
          }],
          proration_behavior: 'always_invoice', // Immediately invoice the prorated amount
          metadata: {
            plan_code: planCode,
          },
        });
        logStep("Subscription upgraded with proration", { 
          subscriptionId: updatedSubscription.id,
          newPriceId: priceId 
        });

        return new Response(JSON.stringify({ 
          success: true, 
          upgraded: true,
          message: "Assinatura atualizada com sucesso! O valor proporcional foi aplicado." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }
    
    // No active subscription, create new checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user?.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/settings?success=true`,
      cancel_url: `${origin}/site?canceled=true`,
      metadata: {
        user_id: user?.id || 'guest',
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
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});