import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }

    console.log('Capturing screenshot for URL:', url)

    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Use htmlcsstoimage.com API for reliable screenshots
    const apiKey = Deno.env.get('HTMLCSSTOIMAGE_API_KEY');
    if (!apiKey) {
      throw new Error('Screenshot service not configured');
    }

    // Use basic authentication with user:key format
    const auth = btoa(`${apiKey}:${apiKey}`)
    
    const response = await fetch('https://hcti.io/v1/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        url: url,
        viewport_width: 1280,
        viewport_height: 720,
        device_scale: 1,
        format: 'png',
        quality: 90,
        ms_delay: 2000
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Screenshot API error:', errorData)
      throw new Error(`Screenshot API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Screenshot captured successfully')

    if (data.url) {
      return new Response(
        JSON.stringify({ 
          imageUrl: data.url,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('No screenshot URL returned')
    }
  } catch (error) {
    console.error('Error capturing screenshot:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})