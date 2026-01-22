import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify they're super admin
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Check if user is super admin
    const { data: { user } } = await supabaseUser.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has super_admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isSuperAdmin = roles?.some((r) => r.role === "super_admin");
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all profiles with salon_id
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, salon_id, full_name")
      .not("salon_id", "is", null);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ salon_owners: {} }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all user roles to find admins
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");

    const adminUserIds = new Set(userRoles?.map((r) => r.user_id) || []);

    // Get emails from auth.users for admin users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

    // Build a map of salon_id -> owner email
    const salonOwners: Record<string, { email: string; name: string }> = {};

    for (const profile of profiles) {
      if (profile.salon_id && adminUserIds.has(profile.id)) {
        const authUser = authUsers.users.find((u) => u.id === profile.id);
        if (authUser && !salonOwners[profile.salon_id]) {
          salonOwners[profile.salon_id] = {
            email: authUser.email || "",
            name: profile.full_name || "",
          };
        }
      }
    }

    return new Response(JSON.stringify({ salon_owners: salonOwners }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
