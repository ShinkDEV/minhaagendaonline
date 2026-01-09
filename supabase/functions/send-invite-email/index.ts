import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

interface InviteRequest {
  invitationId: string;
  email: string;
  salonName: string;
  inviteLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitationId, email, salonName, inviteLink }: InviteRequest = await req.json();

    if (!email || !salonName || !inviteLink) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Minha Agenda Online <noreply@t.minhaagendaonline.com>",
      to: [email],
      subject: `Você foi convidado para ${salonName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Minha Agenda Online</h1>
            </div>
            
            <div style="padding: 32px;">
              <h2 style="color: #18181b; margin: 0 0 16px;">Você foi convidado!</h2>
              
              <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px;">
                O salão <strong style="color: #18181b;">${salonName}</strong> está te convidando para fazer parte da equipe como profissional.
              </p>
              
              <a href="${inviteLink}" style="display: block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: 600; margin: 0 0 24px;">
                Aceitar Convite
              </a>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                Após aceitar, você terá acesso à sua agenda e poderá visualizar seus agendamentos e comissões.
              </p>
              
              <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
                <p style="color: #71717a; font-size: 12px; margin: 0 0 8px;">Se o botão não funcionar, copie e cole este link:</p>
                <p style="color: #6366f1; font-size: 12px; word-break: break-all; margin: 0;">${inviteLink}</p>
              </div>
              
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                Este convite expira em 7 dias.
              </p>
            </div>
            
            <div style="background: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Minha Agenda Online
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

serve(handler);