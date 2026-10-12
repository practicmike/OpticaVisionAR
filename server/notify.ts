import { BUSINESS, formatHour12, whatsappUrl, mapsLinkUrl } from "@shared/business";
import type { Appointment, Service } from "@shared/schema";

/**
 * Appointment e-mails through Resend's HTTP API (no SDK needed).
 *
 * Off until RESEND_API_KEY is set in Vercel, so the site works the same
 * without it. Env:
 *   RESEND_API_KEY      key from resend.com
 *   EMAIL_FROM          sender on a domain verified in Resend,
 *                       e.g. "Ópticas Cardani <citas@opticascardani.com>"
 *   STORE_NOTIFY_EMAIL  where the store gets new bookings (default BUSINESS.email)
 *
 * Until a domain is verified, Resend only delivers to the account owner's own
 * address: the store notice works, the customer copy does not.
 */

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  // Noon UTC so no time zone can move it to another day.
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
};

async function send(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM || "Ópticas Cardani <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[email] Resend", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[email] failed", err);
    return false;
  }
}

const layout = (body: string) => `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#1a202c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#2c5282;color:#fff;padding:20px 24px;font-size:20px;font-weight:bold">${escapeHtml(BUSINESS.name)}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.5">${body}</td></tr>
<tr><td style="padding:16px 24px;background:#f4f6fa;font-size:12px;color:#4a5568">
${escapeHtml(BUSINESS.address)}, ${escapeHtml(BUSINESS.city)} · Tel. ${escapeHtml(BUSINESS.phoneDisplay)} · WhatsApp ${escapeHtml(BUSINESS.whatsappDisplay)}
</td></tr></table></td></tr></table></body></html>`;

const detailsTable = (rows: [string, string][]) =>
  `<table role="presentation" cellpadding="6" style="border-collapse:collapse;margin:16px 0">${rows
    .map(([k, v]) => `<tr><td style="color:#4a5568">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
    .join("")}</table>`;

/**
 * Sends the customer confirmation and the store notice. Never throws; returns
 * whether the customer copy went out so the page can say so honestly.
 */
export async function sendAppointmentEmails(appt: Appointment, service: Service): Promise<{ customer: boolean }> {
  if (!process.env.RESEND_API_KEY) return { customer: false };

  const date = longDate(String(appt.date));
  const time = formatHour12(String(appt.time));
  const rows: [string, string][] = [
    ["Servicio", service.nameEs],
    ["Fecha", date],
    ["Hora", time],
    ["Dirección", `${BUSINESS.address}, ${BUSINESS.city}`],
  ];

  const changeMsg = `Hola, necesito cambiar mi cita del ${date} a las ${time} (a nombre de ${appt.name}).`;
  const customerHtml = layout(`
<p>Hola ${escapeHtml(appt.name)},</p>
<p>Registramos tu cita. Estos son los datos:</p>
${detailsTable(rows)}
<p>Te recomendamos llegar 10 minutos antes y traer tus lentes actuales si usas.</p>
<p>
<a href="${mapsLinkUrl()}" style="display:inline-block;margin:4px 8px 4px 0;padding:10px 16px;background:#2c5282;color:#fff;border-radius:8px;text-decoration:none">Cómo llegar</a>
<a href="${whatsappUrl(changeMsg)}" style="display:inline-block;margin:4px 0;padding:10px 16px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none">Cambiar o cancelar por WhatsApp</a>
</p>`);

  // One tap for the store to confirm to the customer on WhatsApp (10-digit MX numbers).
  const digits = appt.phone.replace(/\D/g, "");
  const mx = digits.length === 10 ? `52${digits}` : digits.length === 12 && digits.startsWith("52") ? digits : null;
  const customerWa = mx
    ? `https://wa.me/${mx}?text=${encodeURIComponent(`Hola ${appt.name}, te confirmamos tu cita en ${BUSINESS.name} el ${date} a las ${time} (${service.nameEs}). ¡Te esperamos en ${BUSINESS.address}!`)}`
    : null;

  const storeHtml = layout(`
<p><strong>Nueva cita desde la página web</strong></p>
${detailsTable([
  ...rows.slice(0, 3),
  ["Nombre", appt.name],
  ["Teléfono", appt.phone],
  ["Correo", appt.email],
  ["Primera visita", appt.isFirstVisit ? "Sí" : "No"],
  ["Comentarios", appt.comments || "—"],
])}
${customerWa ? `<p><a href="${customerWa}" style="display:inline-block;padding:10px 16px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none">Confirmarle por WhatsApp</a></p>` : ""}`);

  const storeTo = process.env.STORE_NOTIFY_EMAIL || BUSINESS.email;
  const [customer] = await Promise.all([
    send(appt.email, `Tu cita en ${BUSINESS.name}: ${date}, ${time}`, customerHtml, storeTo),
    send(storeTo, `Nueva cita: ${appt.name} · ${date} ${time}`, storeHtml, appt.email),
  ]);
  return { customer };
}
