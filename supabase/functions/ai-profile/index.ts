import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authenticate API key
async function authenticateApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('iah_')) {
    throw new Error('Invalid API key format');
  }

  const { data, error } = await supabase
    .rpc('validate_api_key', { key: apiKey });

  if (error) {
    console.error('API key validation error:', error);
    throw new Error('Authentication failed');
  }

  if (!data || data.length === 0) {
    throw new Error('Invalid API key');
  }

  const keyData = data[0];
  if (!keyData.is_valid) {
    throw new Error('API key is expired or inactive');
  }

  return keyData;
}

// Check rate limit
async function checkRateLimit(apiKeyId: string, endpoint: string, rateLimit: number) {
  const { data, error } = await supabase
    .rpc('check_rate_limit', { 
      p_api_key_id: apiKeyId, 
      p_endpoint: endpoint, 
      p_rate_limit: rateLimit 
    });

  if (error) {
    console.error('Rate limit check error:', error);
    throw new Error('Rate limiting failed');
  }

  if (!data) {
    throw new Error('Rate limit exceeded');
  }

  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Only GET method is allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required in x-api-key header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate API key
    const keyData = await authenticateApiKey(apiKey);
    
    // Check permissions (read permission required)
    if (!keyData.permissions.includes('read') && !keyData.permissions.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Required: read' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const endpoint = 'ai-profile';
    await checkRateLimit(keyData.api_key_id, endpoint, keyData.rate_limit_per_hour);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, avatar_color, created_at')
      .eq('user_id', keyData.user_id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('theme, auto_image_generation, ai_description_enhancement, markdown_preview')
      .eq('user_id', keyData.user_id)
      .single();

    if (settingsError) {
      console.error('Settings fetch error:', settingsError);
    }

    // Get idea statistics
    const { data: ideaStats, error: statsError } = await supabase
      .from('ideas')
      .select('status')
      .eq('user_id', keyData.user_id);

    let stats = {};
    if (!statsError && ideaStats) {
      stats = ideaStats.reduce((acc: any, idea: any) => {
        acc[idea.status] = (acc[idea.status] || 0) + 1;
        return acc;
      }, {});
      stats.total = ideaStats.length;
    }

    // Prepare response data
    const responseData = {
      user_id: keyData.user_id,
      profile: {
        display_name: profile.display_name,
        avatar_color: profile.avatar_color,
        created_at: profile.created_at
      },
      settings: settings || {},
      statistics: {
        ideas: stats
      },
      api_info: {
        permissions: keyData.permissions,
        rate_limit_per_hour: keyData.rate_limit_per_hour
      }
    };

    return new Response(
      JSON.stringify({ data: responseData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});