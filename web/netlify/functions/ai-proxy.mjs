const VALID_PASSKEYS = [
  'SCRP-2026-ALPHA-7K9M',
  'SCRP-2026-BETA-3N8X',
  'SCRP-2026-GAMMA-5J2P',
  'SCRP-2026-DELTA-9W4R',
  'SCRP-2026-THETA-1L6C'
];

const PROVIDER_KEYS = {
  claude:     'ANTHROPIC_API_KEY',
  chatgpt:    'OPENAI_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
  grok:       'XAI_API_KEY'
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { provider, prompt, systemPrompt, passkey } = await req.json();

    if (!passkey || !VALID_PASSKEYS.includes(passkey.trim().toUpperCase())) {
      return Response.json({ error: 'Invalid or missing passkey' }, { status: 403 });
    }

    if (!provider || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing provider or prompt' }), { status: 400 });
    }

    const envVar = PROVIDER_KEYS[provider];
    if (!envVar) {
      return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 400 });
    }

    const apiKey = process.env[envVar];
    if (!apiKey) {
      return Response.json({ error: `API key not configured for ${provider}` }, { status: 500 });
    }

    let url, headers, body;

    if (provider === 'claude') {
      url = 'https://api.anthropic.com/v1/messages';
      headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
      body = JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        system: systemPrompt || '',
        messages: [{ role: 'user', content: prompt }]
      });
    } else if (provider === 'perplexity') {
      url = 'https://api.perplexity.ai/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
      body = JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a research assistant.' },
          { role: 'user', content: prompt }
        ]
      });
    } else if (provider === 'grok') {
      url = 'https://api.x.ai/v1/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
      body = JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a fact-checking assistant.' },
          { role: 'user', content: prompt }
        ]
      });
    } else if (provider === 'chatgpt') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
      body = JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt || 'You are an editorial assistant.' },
          { role: 'user', content: prompt }
        ]
      });
    }

    const res = await fetch(url, { method: 'POST', headers, body });
    const data = await res.json();

    // Normalize response
    if (provider === 'claude') {
      if (data.error) return Response.json({ error: data.error.message });
      return Response.json({ text: data.content[0].text });
    } else {
      if (data.error) return Response.json({ error: data.error.message });
      return Response.json({ text: data.choices[0].message.content });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/ai-proxy"
};
