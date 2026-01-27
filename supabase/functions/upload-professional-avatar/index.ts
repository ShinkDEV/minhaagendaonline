import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.18";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const getExtension = (contentType: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[contentType] || 'jpg';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const professionalId = formData.get('professionalId') as string | null;

    if (!file || !professionalId) {
      return new Response(
        JSON.stringify({ error: 'File and professionalId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Only JPG, PNG and WebP images are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size must be less than 5MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if professional exists and user has permission (is the professional or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', user.id)
      .single();

    if (!profile?.salon_id) {
      return new Response(
        JSON.stringify({ error: 'User salon not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('id, avatar_url, salon_id, profile_id')
      .eq('id', professionalId)
      .eq('salon_id', profile.salon_id)
      .single();

    if (professionalError || !professional) {
      return new Response(
        JSON.stringify({ error: 'Professional not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is the professional themselves or an admin
    const isOwnProfile = professional.profile_id === user.id;
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (!isOwnProfile && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'You can only update your own avatar' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize R2 client using aws4fetch
    const r2 = new AwsClient({
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
    });

    const bucketName = Deno.env.get("R2_BUCKET_NAME")!;
    const accountId = Deno.env.get("R2_ACCOUNT_ID")!;
    const publicUrl = Deno.env.get("R2_PUBLIC_URL")!;
    const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    // Delete old avatar if exists
    if (professional.avatar_url) {
      try {
        const oldKey = professional.avatar_url.replace(`${publicUrl}/`, '');
        const deleteUrl = `${r2Endpoint}/${bucketName}/${oldKey}`;
        await r2.fetch(deleteUrl, { method: 'DELETE' });
        console.log('Deleted old professional avatar:', oldKey);
      } catch (e) {
        console.log('Failed to delete old professional avatar:', e);
      }
    }

    // Upload new avatar
    const ext = getExtension(file.type);
    const key = `professional-avatars/${professionalId}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const uploadUrl = `${r2Endpoint}/${bucketName}/${key}`;
    const uploadResponse = await r2.fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: new Uint8Array(arrayBuffer),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('R2 upload failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to upload image to storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const avatarUrl = `${publicUrl}/${key}`;

    // Update professional record
    const { error: updateError } = await supabase
      .from('professionals')
      .update({ avatar_url: avatarUrl })
      .eq('id', professionalId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update professional record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Professional avatar uploaded successfully:', avatarUrl);

    return new Response(
      JSON.stringify({ url: avatarUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
