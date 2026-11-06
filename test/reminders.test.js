const test = require('node:test');
const assert = require('node:assert');
const { currentSlot, runReminders } = require('../lib/reminders');
const { importText, emptyData } = require('../lib/words');

test('slot follows Berlin time in summer and winter', () => {
  assert.strictEqual(currentSlot(new Date('2026-07-01T06:00:00Z')), '2026-07-01-08'); // CEST
  assert.strictEqual(currentSlot(new Date('2026-12-01T07:00:00Z')), '2026-12-01-08'); // CET
  assert.strictEqual(currentSlot(new Date('2026-12-01T18:30:00Z')), null);
  assert.strictEqual(currentSlot(new Date('2026-12-01T19:00:00Z')), '2026-12-01-20');
});

test('sends once per slot and only when cards are due', async () => {
  const sent = [];
  const telegram = { sendMessage: async (id, text) => sent.push([id, text]) };
  const db = { 1: emptyData() };
  importText(db[1], 'üben, to practise');
  const store = { load: async (id) => structuredClone(db[id]), save: async (id, d) => { db[id] = d; } };
  const now = new Date('2026-12-01T07:00:00Z');
  assert.strictEqual((await runReminders({ telegram, store, userIds: [1], now })).sent, 1);
  assert.strictEqual((await runReminders({ telegram, store, userIds: [1], now })).sent, 0);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual((await runReminders({ telegram, store, userIds: [1], now: new Date('2026-12-01T09:00:00Z') })).reason, 'not a reminder hour');
});
