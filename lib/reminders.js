const { startSession } = require('./bot');

const SLOT_HOURS = [8, 13, 20];

// Berlin wall-clock slot, e.g. "2026-11-06-13", or null outside the 3 reminder hours.
// Using Intl keeps the schedule right across summer/winter time, which a UTC cron cannot.
function currentSlot(now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).map((x) => [x.type, x.value]),
  );
  return SLOT_HOURS.includes(Number(p.hour)) ? `${p.year}-${p.month}-${p.day}-${p.hour}` : null;
}

async function runReminders({ telegram, store, userIds, now = new Date() }) {
  const slot = currentSlot(now);
  if (!slot) return { sent: 0, reason: 'not a reminder hour' };
  let sent = 0;
  for (const id of userIds) {
    try {
      const data = await store.load(id);
      if (data.lastReminderSlot === slot) continue;
      data.lastReminderSlot = slot;
      await store.save(id, data);
      if (await startSession(telegram, id, data)) sent++;
    } catch (err) {
      console.error(`reminder for ${id} failed:`, err);
    }
  }
  return { sent, slot };
}

module.exports = { runReminders, currentSlot };
