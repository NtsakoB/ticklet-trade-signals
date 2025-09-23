import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Signal scheduler triggered')
    
    // Get the backend URL from environment
    const backendUrl = Deno.env.get('BACKEND_URL') || 'https://your-backend-url.onrender.com'
    
    // Trigger live signal generation
    const response = await fetch(`${backendUrl}/api/live-signals/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${await response.text()}`)
    }
    
    const result = await response.json()
    console.log('Signal generation result:', result)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Signal generation triggered successfully',
        result: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Signal scheduler error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})