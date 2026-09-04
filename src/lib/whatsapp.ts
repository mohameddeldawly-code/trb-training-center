import { digitsOnly } from './format';

export interface WhatsAppContext {
  ticketId: string;
  type: string;
  name: string;
  center: string;
  subject?: string;
}

/** استبدال المتغيّرات داخل قالب الرسالة المحفوظ بالإعدادات */
export function renderTemplate(template: string, ctx: WhatsAppContext): string {
  return template
    .replace(/\{\{\s*TICKET_ID\s*\}\}/g, ctx.ticketId)
    .replace(/\{\{\s*TYPE\s*\}\}/g, ctx.type)
    .replace(/\{\{\s*NAME\s*\}\}/g, ctx.name)
    .replace(/\{\{\s*CENTER\s*\}\}/g, ctx.center)
    .replace(/\{\{\s*SUBJECT\s*\}\}/g, ctx.subject ?? '');
}

/**
 * رابط WhatsApp Click-to-Chat المجاني (wa.me).
 * لا يعتمد على أي واجهة برمجية مدفوعة.
 */
export function buildWhatsAppLink(number: string, message: string): string | null {
  const n = digitsOnly(number ?? '');
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
