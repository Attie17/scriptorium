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
    const { provider, prompt, systemPrompt, apiKey } = await req.json();

    if (!provider || !prompt || !apiKey) {
      return new Response(JSON.stringify({ error: 'Missing provider, prompt, or apiKey' }), { status: 400 });
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
        model: 'llama-3.1-sonar-large-128k-online',
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
    } else {
      return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 400 });
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
