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

// Markdown sanitization - removes potentially dangerous HTML
function sanitizeMarkdown(content: string): string {
  if (!content) return '';
  
  // Remove script tags and their content
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove dangerous HTML tags but preserve markdown formatting
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'];
  for (const tag of dangerousTags) {
    const regex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
    content = content.replace(regex, '');
  }
  
  // Remove javascript: and data: URLs
  content = content.replace(/javascript:/gi, '');
  content = content.replace(/data:/gi, '');
  
  // Limit content length (10MB max)
  if (content.length > 10 * 1024 * 1024) {
    throw new Error('Content too large (max 10MB)');
  }
  
  return content.trim();
}

// Validate idea data
function validateIdeaData(data: any) {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }
  
  if (data.title && data.title.length > 500) {
    errors.push('Title must be less than 500 characters');
  }
  
  if (data.description && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  }
  
  if (data.status && !['idea', 'research', 'progress', 'launched', 'archived'].includes(data.status)) {
    errors.push('Status must be one of: idea, research, progress, launched, archived');
  }
  
  if (data.tags && (!Array.isArray(data.tags) || !data.tags.every((tag: any) => typeof tag === 'string'))) {
    errors.push('Tags must be an array of strings');
  }
  
  if (data.color && (typeof data.color !== 'string' || !/^#[0-9A-F]{6}$/i.test(data.color))) {
    errors.push('Color must be a valid hex color code');
  }
  
  return errors;
}

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
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required in x-api-key header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate API key
    const keyData = await authenticateApiKey(apiKey);
    
    // Check permissions
    const method = req.method.toLowerCase();
    const requiredPermission = method === 'get' ? 'read' : 'write';
    
    if (!keyData.permissions.includes(requiredPermission) && !keyData.permissions.includes('admin')) {
      return new Response(
        JSON.stringify({ error: `Insufficient permissions. Required: ${requiredPermission}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const endpoint = 'ai-ideas';
    await checkRateLimit(keyData.api_key_id, endpoint, keyData.rate_limit_per_hour);

    const url = new URL(req.url);
    const ideaId = url.pathname.split('/').pop();

    switch (req.method) {
      case 'GET':
        if (ideaId && ideaId !== 'ai-ideas') {
          // Get single idea
          const { data: idea, error } = await supabase
            .from('ideas')
            .select('*')
            .eq('id', ideaId)
            .eq('user_id', keyData.user_id)
            .single();

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Idea not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ data: idea }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Get all ideas with optional filtering
          const params = url.searchParams;
          const status = params.get('status');
          const limit = Math.min(parseInt(params.get('limit') || '50'), 100);
          const offset = parseInt(params.get('offset') || '0');
          const search = params.get('search');

          let query = supabase
            .from('ideas')
            .select('*')
            .eq('user_id', keyData.user_id)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (status) {
            query = query.eq('status', status);
          }

          if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
          }

          const { data: ideas, error } = await query;

          if (error) {
            console.error('Database error:', error);
            return new Response(
              JSON.stringify({ error: 'Failed to fetch ideas' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              data: ideas, 
              meta: { 
                limit, 
                offset, 
                count: ideas.length 
              } 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'POST':
        const createData = await req.json();
        
        // Validate input
        const createErrors = validateIdeaData(createData);
        if (createErrors.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Validation failed', details: createErrors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Sanitize markdown content
        const sanitizedCreateData = {
          ...createData,
          title: sanitizeMarkdown(createData.title),
          description: createData.description ? sanitizeMarkdown(createData.description) : null,
          user_id: keyData.user_id
        };

        const { data: newIdea, error: createError } = await supabase
          .from('ideas')
          .insert([sanitizedCreateData])
          .select()
          .single();

        if (createError) {
          console.error('Database error:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create idea' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: newIdea }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'PUT':
        if (!ideaId || ideaId === 'ai-ideas') {
          return new Response(
            JSON.stringify({ error: 'Idea ID required for updates' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData = await req.json();
        
        // Validate input
        const updateErrors = validateIdeaData(updateData);
        if (updateErrors.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Validation failed', details: updateErrors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Sanitize markdown content
        const sanitizedUpdateData = {
          ...updateData,
          title: updateData.title ? sanitizeMarkdown(updateData.title) : undefined,
          description: updateData.description ? sanitizeMarkdown(updateData.description) : undefined,
        };

        // Remove undefined values
        Object.keys(sanitizedUpdateData).forEach(key => 
          sanitizedUpdateData[key] === undefined && delete sanitizedUpdateData[key]
        );

        const { data: updatedIdea, error: updateError } = await supabase
          .from('ideas')
          .update(sanitizedUpdateData)
          .eq('id', ideaId)
          .eq('user_id', keyData.user_id)
          .select()
          .single();

        if (updateError) {
          console.error('Database error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update idea or idea not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: updatedIdea }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'DELETE':
        if (!ideaId || ideaId === 'ai-ideas') {
          return new Response(
            JSON.stringify({ error: 'Idea ID required for deletion' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Soft delete by updating status to archived
        const { data: deletedIdea, error: deleteError } = await supabase
          .from('ideas')
          .update({ status: 'archived' })
          .eq('id', ideaId)
          .eq('user_id', keyData.user_id)
          .select()
          .single();

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: 'Failed to delete idea or idea not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: deletedIdea, message: 'Idea archived successfully' }),
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