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
    const { description, title, apiKey } = await req.json()
    
    // Use provided API key if in developer mode, otherwise use environment variable
    const DEEPSEEK_API_KEY = apiKey || Deno.env.get('DEEPSEEK_API_KEY')
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error('Deepseek API key not configured')
    }

    console.log('Enhancing description for:', title)

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical writer and app idea enhancer. Your job is to take basic app ideas and descriptions and enhance them with detailed features, technical considerations, market potential, and implementation suggestions. Make the description comprehensive, professional, and inspiring while keeping the core idea intact. Use markdown formatting for better readability.'
          },
          {
            role: 'user',
            content: `Please enhance this app idea description:

Title: ${title}
Current Description: ${description}

Please provide an enhanced, detailed description that includes:
- Detailed feature breakdown
- Technical implementation considerations  
- Market potential and target audience
- Monetization strategies
- Development roadmap suggestions
- Competitive advantages

Keep the writing engaging and professional. Use markdown formatting with headers, bullet points, and emphasis where appropriate.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Deepseek API error:', errorData)
      throw new Error(`Deepseek API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Description enhancement completed')

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const enhancedDescription = data.choices[0].message.content
      return new Response(
        JSON.stringify({ 
          enhancedDescription,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('No enhanced description generated')
    }
  } catch (error) {
    console.error('Error enhancing description:', error)
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