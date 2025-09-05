import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const keyId = url.pathname.split('/').pop();

    switch (req.method) {
      case 'GET':
        if (keyId && keyId !== 'ai-keys') {
          // Get single API key
          const { data: apiKey, error } = await supabase
            .from('api_keys')
            .select('id, name, permissions, rate_limit_per_hour, usage_count, last_used_at, expires_at, is_active, created_at, updated_at')
            .eq('id', keyId)
            .eq('user_id', user.id)
            .single();

          if (error) {
            return new Response(
              JSON.stringify({ error: 'API key not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ data: apiKey }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Get all user's API keys
          const { data: apiKeys, error } = await supabase
            .from('api_keys')
            .select('id, name, permissions, rate_limit_per_hour, usage_count, last_used_at, expires_at, is_active, created_at, updated_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Database error:', error);
            return new Response(
              JSON.stringify({ error: 'Failed to fetch API keys' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ data: apiKeys }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'POST':
        const createData = await req.json();
        
        // Validate input
        if (!createData.name || typeof createData.name !== 'string' || createData.name.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'Name is required and must be a non-empty string' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (createData.name.length > 100) {
          return new Response(
            JSON.stringify({ error: 'Name must be less than 100 characters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate permissions
        const validPermissions = ['read', 'write', 'admin'];
        const permissions = createData.permissions || ['read'];
        
        if (!Array.isArray(permissions) || !permissions.every(p => validPermissions.includes(p))) {
          return new Response(
            JSON.stringify({ error: 'Permissions must be an array containing: read, write, admin' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate rate limit
        const rateLimit = createData.rate_limit_per_hour || 1000;
        if (typeof rateLimit !== 'number' || rateLimit < 1 || rateLimit > 10000) {
          return new Response(
            JSON.stringify({ error: 'Rate limit must be a number between 1 and 10000' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate expiry date
        let expiresAt = null;
        if (createData.expires_at) {
          expiresAt = new Date(createData.expires_at);
          if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
            return new Response(
              JSON.stringify({ error: 'Expiry date must be a valid future date' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Generate API key
        const { data: generatedKey, error: keyGenError } = await supabase
          .rpc('generate_api_key');

        if (keyGenError || !generatedKey) {
          console.error('Key generation error:', keyGenError);
          return new Response(
            JSON.stringify({ error: 'Failed to generate API key' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Hash the API key
        const { data: hashedKey, error: hashError } = await supabase
          .rpc('hash_api_key', { key: generatedKey });

        if (hashError || !hashedKey) {
          console.error('Key hashing error:', hashError);
          return new Response(
            JSON.stringify({ error: 'Failed to process API key' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Insert new API key
        const { data: newApiKey, error: createError } = await supabase
          .from('api_keys')
          .insert([{
            user_id: user.id,
            key_hash: hashedKey,
            name: createData.name.trim(),
            permissions,
            rate_limit_per_hour: rateLimit,
            expires_at: expiresAt?.toISOString()
          }])
          .select('id, name, permissions, rate_limit_per_hour, usage_count, last_used_at, expires_at, is_active, created_at, updated_at')
          .single();

        if (createError) {
          console.error('Database error:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create API key' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            data: newApiKey,
            api_key: generatedKey, // Only returned once during creation
            message: 'API key created successfully. Please save the key as it will not be shown again.'
          }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'PUT':
        if (!keyId || keyId === 'ai-keys') {
          return new Response(
            JSON.stringify({ error: 'API key ID required for updates' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData = await req.json();
        const allowedFields = ['name', 'permissions', 'rate_limit_per_hour', 'expires_at', 'is_active'];
        const updates: any = {};

        // Validate and prepare updates
        for (const [key, value] of Object.entries(updateData)) {
          if (!allowedFields.includes(key)) continue;

          if (key === 'name') {
            if (!value || typeof value !== 'string' || (value as string).trim().length === 0) {
              return new Response(
                JSON.stringify({ error: 'Name must be a non-empty string' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            updates.name = (value as string).trim();
          } else if (key === 'permissions') {
            const validPermissions = ['read', 'write', 'admin'];
            if (!Array.isArray(value) || !(value as string[]).every(p => validPermissions.includes(p))) {
              return new Response(
                JSON.stringify({ error: 'Permissions must be an array containing: read, write, admin' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            updates.permissions = value;
          } else if (key === 'rate_limit_per_hour') {
            if (typeof value !== 'number' || value < 1 || value > 10000) {
              return new Response(
                JSON.stringify({ error: 'Rate limit must be a number between 1 and 10000' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            updates.rate_limit_per_hour = value;
          } else if (key === 'expires_at') {
            if (value) {
              const expiryDate = new Date(value as string);
              if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
                return new Response(
                  JSON.stringify({ error: 'Expiry date must be a valid future date' }),
                  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
              updates.expires_at = expiryDate.toISOString();
            } else {
              updates.expires_at = null;
            }
          } else if (key === 'is_active') {
            if (typeof value !== 'boolean') {
              return new Response(
                JSON.stringify({ error: 'is_active must be a boolean' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            updates.is_active = value;
          }
        }

        if (Object.keys(updates).length === 0) {
          return new Response(
            JSON.stringify({ error: 'No valid fields to update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updatedApiKey, error: updateError } = await supabase
          .from('api_keys')
          .update(updates)
          .eq('id', keyId)
          .eq('user_id', user.id)
          .select('id, name, permissions, rate_limit_per_hour, usage_count, last_used_at, expires_at, is_active, created_at, updated_at')
          .single();

        if (updateError) {
          console.error('Database error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update API key or key not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: updatedApiKey }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'DELETE':
        if (!keyId || keyId === 'ai-keys') {
          return new Response(
            JSON.stringify({ error: 'API key ID required for deletion' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabase
          .from('api_keys')
          .delete()
          .eq('id', keyId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Database error:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Failed to delete API key or key not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'API key deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});