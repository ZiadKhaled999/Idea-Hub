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
    const { prompt, apiKey } = await req.json()
    
    // Use provided API key if in developer mode, otherwise use environment variable
    const GOOGLE_AI_API_KEY = apiKey || Deno.env.get('GOOGLE_AI_API_KEY')
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API key not configured')
    }

    console.log('Generating image with prompt:', prompt)

    // Validate prompt length
    if (prompt.length > 1000) {
      throw new Error('Prompt too long. Please keep it under 1000 characters.');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Create a professional, high-quality illustration: ${prompt}`,
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ],
        generationConfig: {
          responseMimeType: "image/jpeg",
          aspectRatio: "16:9"
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Google AI API error:', errorData)
      throw new Error(`Google AI API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Image generation response received')

    if (data.candidates && data.candidates[0] && data.candidates[0].image) {
      const imageData = data.candidates[0].image.data
      return new Response(
        JSON.stringify({ 
          imageUrl: `data:image/jpeg;base64,${imageData}`,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('No image generated')
    }
  } catch (error) {
    console.error('Error generating image:', error)
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