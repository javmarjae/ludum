interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Skips silently until key is configured

  const from = process.env.RESEND_FROM_EMAIL ?? 'notificaciones@ludum.app';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
}

export interface PlayNotificationData {
  groupName: string;
  gameName: string;
  playedAt: string;
  creatorName: string;
  results: { name: string; isWinner: boolean; score: number | null }[];
  playUrl: string;
  recipientEmails: string[];
}

export async function sendPlayNotification(data: PlayNotificationData) {
  const { groupName, gameName, playedAt, creatorName, results, playUrl, recipientEmails } = data;
  if (recipientEmails.length === 0) return;

  const date = new Date(playedAt).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const winner = results.find((r) => r.isWinner);

  const resultsRows = results
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 0;font-weight:${r.isWinner ? 700 : 500};color:${r.isWinner ? '#3E5E3B' : '#1a1a1a'}">
          ${r.isWinner ? '🏆 ' : ''}${r.name}
        </td>
        ${r.score !== null ? `<td style="padding:6px 0;text-align:right;color:#666">${r.score} pts</td>` : ''}
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fafaf8">
      <div style="background:white;border-radius:20px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">

        <p style="font-size:13px;font-weight:600;color:#3E5E3B;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:16px">
          🎲 Ludum · ${groupName}
        </p>

        <h1 style="font-size:22px;font-weight:800;color:#1a1a1a;margin-bottom:6px;line-height:1.2">
          Nueva partida de<br>${gameName}
        </h1>

        <p style="font-size:14px;color:#888;margin-bottom:24px">
          ${date} · Registrado por <strong style="color:#444">${creatorName}</strong>
        </p>

        ${winner ? `
        <div style="background:#f0f7ef;border-radius:12px;padding:14px 16px;margin-bottom:20px">
          <p style="font-size:14px;font-weight:700;color:#3E5E3B;margin:0">🏆 Ganador: ${winner.name}</p>
        </div>` : ''}

        ${results.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
          <tbody>${resultsRows}</tbody>
        </table>` : ''}

        <a href="${playUrl}"
          style="display:inline-block;padding:13px 26px;background:#3E5E3B;color:white;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px">
          Ver partida →
        </a>
      </div>

      <p style="font-size:12px;color:#aaa;text-align:center;margin-top:20px">
        Ludum · Deja de recibir emails desde tu perfil
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: recipientEmails,
      subject: `Nueva partida de ${gameName} en ${groupName}`,
      html,
    });
  } catch {
    // Never let email failure break the play registration
  }
}
