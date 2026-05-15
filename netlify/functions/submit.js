exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    const { type, ...fields } = payload;

    const notifyEmail = process.env.NOTIFY_EMAIL;
    const resendKey   = process.env.RESEND_API_KEY;
    const fromEmail   = process.env.RESEND_FROM || 'Ember <notifications@resend.dev>';

    let subject = '';
    let html    = '';

    if (type === 'booking') {
      subject = `New demo booking — ${fields.date} at ${fields.time}`;
      html = `
        <h2 style="margin:0 0 16px;font-size:20px;">New Demo Booking</h2>
        <table style="border-collapse:collapse;width:100%;font-size:15px;">
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px;">Date</td><td style="padding:8px 12px;">${fields.date}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Time</td><td style="padding:8px 12px;">${fields.time}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Name</td><td style="padding:8px 12px;">${fields.firstName} ${fields.lastName}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Email</td><td style="padding:8px 12px;"><a href="mailto:${fields.email}">${fields.email}</a></td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Company</td><td style="padding:8px 12px;">${fields.company || '—'}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Role</td><td style="padding:8px 12px;">${fields.role || '—'}</td></tr>
        </table>`;
    } else if (type === 'note') {
      subject = `New enquiry — ${fields.firstName} ${fields.lastName} (${fields.company || 'unknown company'})`;
      html = `
        <h2 style="margin:0 0 16px;font-size:20px;">New Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;font-size:15px;">
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px;">Name</td><td style="padding:8px 12px;">${fields.firstName} ${fields.lastName}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Email</td><td style="padding:8px 12px;"><a href="mailto:${fields.email}">${fields.email}</a></td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Company</td><td style="padding:8px 12px;">${fields.company || '—'}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Challenge</td><td style="padding:8px 12px;">${fields.challenge || '—'}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Message</td><td style="padding:8px 12px;white-space:pre-wrap;">${fields.message || '—'}</td></tr>
        </table>`;
    } else if (type === 'chat-booking') {
      subject = `Chat booking request — ${fields.slot}`;
      html = `
        <h2 style="margin:0 0 16px;font-size:20px;">Chat Booking Request</h2>
        <table style="border-collapse:collapse;width:100%;font-size:15px;">
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px;">Slot</td><td style="padding:8px 12px;">${fields.slot}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Email</td><td style="padding:8px 12px;"><a href="mailto:${fields.email}">${fields.email}</a></td></tr>
        </table>`;
    }

    if (resendKey && notifyEmail) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [notifyEmail],
          subject,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">${html}</div>`
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Resend error:', errText);
      }
    } else {
      console.log('Email not sent — RESEND_API_KEY or NOTIFY_EMAIL not configured. Payload:', JSON.stringify(payload));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
