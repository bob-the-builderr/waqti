const NBSP = ' ';

export function money(amount: number) {
  return `${amount}${NBSP}جنيه`;
}

export function clockTime(iso: string | Date) {
  return new Date(iso).toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: '2-digit' }).replace(/\s/g, NBSP);
}

/** Arabic counting: one, two, 3–10 plural, 11+ singular. */
function counted(count: number, one: string, two: string, plural: string, single: string) {
  if (count === 1) return one;
  if (count === 2) return two;
  if (count <= 10) return `${count} ${plural}`;
  return `${count} ${single}`;
}

export const itemsWord = (n: number) => counted(n, 'حاجة واحدة', 'حاجتين', 'حاجات', 'حاجة');
export const ordersWord = (n: number) => counted(n, 'طلب واحد', 'طلبين', 'طلبات', 'طلب');
export const kindsWord = (n: number) => counted(n, 'صنف واحد', 'صنفين', 'أصناف', 'صنف');

/** "010 1234 5678", isolated left-to-right inside Arabic text. */
export function formatPhone(phone: string) {
  return `⁦${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}⁩`;
}
