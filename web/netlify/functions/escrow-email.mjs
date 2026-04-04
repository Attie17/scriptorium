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
    const { email, authorId, encryptedPayload } = await req.json();

    if (!email || !authorId || !encryptedPayload) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: process.env.ESCROW_FROM_EMAIL || 'Scriptorium <onboarding@resend.dev>',
        to: [email],
        subject: `Scriptorium — Author Key Recovery (${authorId})`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0c0c0e; color: #e8e6e0;">
            <h1 style="font-size: 28px; color: #c9a84c; margin-bottom: 8px;">Scriptorium</h1>
            <p style="font-size: 11px; letter-spacing: 3px; color: #5a5855; text-transform: uppercase; margin-bottom: 40px;">Author Key Recovery</p>
            <p>This email contains your encrypted author key for identity recovery. Keep it safe.</p>
            <div style="background: #141417; border: 1px solid #2a2a32; border-radius: 6px; padding: 20px; margin: 24px 0;">
              <p style="font-size: 11px; letter-spacing: 2px; color: #5a5855; text-transform: uppercase; margin-bottom: 8px;">Author ID</p>
              <p style="font-family: monospace; font-size: 16px; color: #c9a84c; letter-spacing: 1px;">${authorId}</p>
            </div>
            <div style="background: #141417; border: 1px solid #2a2a32; border-radius: 6px; padding: 20px; margin: 24px 0;">
              <p style="font-size: 11px; letter-spacing: 2px; color: #5a5855; text-transform: uppercase; margin-bottom: 8px;">Encrypted Key (decrypt with your email address)</p>
              <p style="font-family: monospace; font-size: 10px; color: #9b9891; word-break: break-all;">${encryptedPayload}</p>
            </div>
            <p style="font-size: 13px; color: #5a5855; margin-top: 32px;">This key is encrypted with your email address as the passphrase. Without it, this payload is unreadable. Do not share this email.</p>
          </div>
        `
      })
    });

    if (res.ok) {
      return Response.json({ success: true });
    } else {
      const err = await res.json();
      return Response.json({ error: err.message || 'Failed to send email' }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/escrow-email"
};
