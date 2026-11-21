import { clockTime } from './pricing';

/** Delivery for later: half-hour slots, 10 AM to 11 PM, from one hour ahead, for 3 days. */
const FIRST_HOUR = 10;
const LAST_HOUR = 23;
const LEAD_MINUTES = 60;

export type Slot = { at: number; label: string };
export type Day = { key: number; label: string; slots: Slot[] };

const WEEKDAYS = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];

/** «النهارده», «بكرة», then the weekday. */
export function dayLabel(at: number, now = Date.now()) {
  const day = new Date(at);
  const today = new Date(now);
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(day) - start(today)) / 86_400_000);
  if (diff === 0) return 'النهارده';
  if (diff === 1) return 'بكرة';
  return WEEKDAYS[day.getDay()];
}

/** «بكرة الساعة 10:30 ص» */
export function whenText(at: number, now = Date.now()) {
  return `${dayLabel(at, now)} الساعة ${clockTime(new Date(at))}`;
}

export function deliveryDays(now = Date.now()): Day[] {
  const earliest = now + LEAD_MINUTES * 60_000;
  const days: Day[] = [];
  for (let d = 0; d < 3; d++) {
    const base = new Date(now);
    base.setDate(base.getDate() + d);
    const slots: Slot[] = [];
    for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) {
      for (const m of [0, 30]) {
        if (h === LAST_HOUR && m === 30) continue;
        const at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m).getTime();
        if (at >= earliest) slots.push({ at, label: clockTime(new Date(at)) });
      }
    }
    if (slots.length) days.push({ key: d, label: dayLabel(slots[0].at, now), slots });
  }
  return days;
}
