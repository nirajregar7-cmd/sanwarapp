/**
 * Automatic Slot Generator
 *
 * Generates 30-minute time slots for every staff member individually,
 * for every salon open day, 30 days into the future.
 *
 * Runs automatically:
 *  - Once daily (via scheduler) to keep rolling 30-day coverage fresh
 *  - Immediately when working hours are saved
 *  - Immediately when a new staff member is added
 */

import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { workingHours, staff, timeSlots, salons } from '../shared/schema';

const SLOT_DURATION_MINUTES = 30;
const DAYS_AHEAD = 30;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Generate 30-min slot objects for a single day based on open/close/break times.
 */
function buildSlots(
  date: string,
  openTime: string,
  closeTime: string,
  breakStart: string | null | undefined,
  breakEnd: string | null | undefined,
) {
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  const bStart = breakStart ? toMinutes(breakStart) : null;
  const bEnd = breakEnd ? toMinutes(breakEnd) : null;

  const slots: { date: string; startTime: string; endTime: string }[] = [];

  for (let t = open; t + SLOT_DURATION_MINUTES <= close; t += SLOT_DURATION_MINUTES) {
    const end = t + SLOT_DURATION_MINUTES;
    // Skip if overlaps break
    if (bStart !== null && bEnd !== null) {
      if (t < bEnd && end > bStart) continue;
    }
    slots.push({ date, startTime: toTimeStr(t), endTime: toTimeStr(end) });
  }

  return slots;
}

/**
 * Auto-generate slots for ONE specific staff member from today for DAYS_AHEAD days.
 * Skips dates that already have slots for this staff member.
 * Returns the count of newly created slots.
 */
export async function autoGenerateSlotsForStaff(
  db: any,
  salonId: string,
  staffId: string,
): Promise<number> {
  try {
    // Load salon working hours (indexed by dayOfWeek)
    const hours = await db
      .select()
      .from(workingHours)
      .where(eq(workingHours.salonId, salonId));

    // If no working hours configured, use a sensible default: 10:00-20:00, Mon-Sat (Sun closed)
    const DEFAULT_OPEN = '10:00';
    const DEFAULT_CLOSE = '20:00';
    const hoursByDay: Record<number, { isOpen: boolean; openTime: string; closeTime: string; breakStartTime?: string | null; breakEndTime?: string | null }> = {};

    if (hours.length) {
      for (const h of hours) hoursByDay[h.dayOfWeek] = h;
    } else {
      // Default: Mon(1) through Sat(6) open, Sun(0) closed
      for (let d = 1; d <= 6; d++) {
        hoursByDay[d] = { isOpen: true, openTime: DEFAULT_OPEN, closeTime: DEFAULT_CLOSE, breakStartTime: null, breakEndTime: null };
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = addDays(today, DAYS_AHEAD);
    const startStr = dateStr(today);
    const endStr = dateStr(endDate);

    // Fetch existing slot dates for this staff in range (one query)
    const existing = await db
      .select({ date: timeSlots.date })
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.salonId, salonId),
          eq(timeSlots.staffId, staffId),
          gte(timeSlots.date, startStr),
          lte(timeSlots.date, endStr),
        ),
      );

    const datesWithSlots = new Set<string>(existing.map((r: any) => r.date));

    // Collect ALL slots for all missing days first, then bulk-insert in one go
    const allNewSlots: {
      salonId: string; staffId: string; date: string;
      startTime: string; endTime: string; isAvailable: boolean; slotType: string;
    }[] = [];

    for (let i = 0; i <= DAYS_AHEAD; i++) {
      const day = addDays(today, i);
      const ds = dateStr(day);
      if (datesWithSlots.has(ds)) continue; // already has slots

      const dayOfWeek = day.getDay(); // 0 = Sunday
      const wh = hoursByDay[dayOfWeek];
      if (!wh || !wh.isOpen || !wh.openTime || !wh.closeTime) continue;

      const slots = buildSlots(ds, wh.openTime, wh.closeTime, wh.breakStartTime, wh.breakEndTime);
      for (const slot of slots) {
        allNewSlots.push({
          salonId, staffId, date: slot.date,
          startTime: slot.startTime, endTime: slot.endTime,
          isAvailable: true, slotType: 'regular',
        });
      }
    }

    if (allNewSlots.length === 0) return 0;

    // Bulk insert in batches of 500 to avoid query size limits
    const BATCH = 500;
    for (let i = 0; i < allNewSlots.length; i += BATCH) {
      const batch = allNewSlots.slice(i, i + BATCH);
      await db.insert(timeSlots).values(batch).onConflictDoNothing();
    }

    return allNewSlots.length;
  } catch (err) {
    console.error(`[SlotGen] Error generating slots for staff ${staffId}:`, err);
    return 0;
  }
}

/**
 * Auto-generate slots for ALL staff of a salon.
 * Called when working hours are saved or on daily maintenance.
 */
export async function autoGenerateSlotsForSalon(
  db: any,
  salonId: string,
): Promise<{ staffCount: number; slotsCreated: number }> {
  try {
    const staffList = await db
      .select()
      .from(staff)
      .where(and(eq(staff.salonId, salonId), eq(staff.isActive, true)));

    if (!staffList.length) return { staffCount: 0, slotsCreated: 0 };

    let totalSlots = 0;
    for (const member of staffList) {
      const count = await autoGenerateSlotsForStaff(db, salonId, member.id);
      totalSlots += count;
    }

    return { staffCount: staffList.length, slotsCreated: totalSlots };
  } catch (err) {
    console.error(`[SlotGen] Error generating slots for salon ${salonId}:`, err);
    return { staffCount: 0, slotsCreated: 0 };
  }
}

/**
 * Daily maintenance: scan ALL salons and fill in any missing slots for the next 30 days.
 * This keeps coverage rolling forward so owners never have to think about it.
 */
export async function runDailySlotMaintenance(): Promise<void> {
  try {
    const { storage } = await import('./storage');
    const db = (storage as any).db;

    const allSalons = await db
      .select({ id: salons.id, name: salons.name })
      .from(salons);

    let totalSalons = 0;
    let totalSlots = 0;

    for (const salon of allSalons) {
      const { staffCount, slotsCreated } = await autoGenerateSlotsForSalon(db, salon.id);
      if (staffCount > 0) {
        totalSalons++;
        totalSlots += slotsCreated;
      }
    }

    if (totalSlots > 0) {
      console.log(`[SlotGen] Daily maintenance: filled ${totalSlots} slot(s) across ${totalSalons} salon(s)`);
    } else {
      console.log(`[SlotGen] Daily maintenance: all salons up to date (${allSalons.length} checked)`);
    }
  } catch (err) {
    console.error('[SlotGen] Daily maintenance error:', err);
  }
}
