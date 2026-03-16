import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { fileUrl } = await req.json();
    if (!fileUrl) throw new Error('fileUrl is required');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an OCR specialist that extracts data from Brazilian Notas Fiscais (invoices). 
Extract the following information and return ONLY valid JSON (no markdown, no code blocks):
{
  "supplier": "supplier name",
  "total_value": 0.00,
  "items": [
    {
      "name": "item description",
      "quantity": 1,
      "unit_price": 0.00,
      "total_price": 0.00
    }
  ]
}
If you cannot extract some fields, use reasonable defaults. Always return valid JSON.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: fileUrl }
              },
              {
                type: 'text',
                text: 'Extract all invoice data from this Nota Fiscal image. Return only JSON.'
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${errorBody}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    // Clean markdown code blocks if present
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch {
      parsed = { supplier: 'Não identificado', total_value: 0, items: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing NF:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
