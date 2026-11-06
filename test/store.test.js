const test = require('node:test');
const assert = require('node:assert');

// Replace @netlify/blobs with an in-memory fake before store.js loads it.
const opened = [];
const memory = new Map();
require.cache[require.resolve('@netlify/blobs')] = {
  id: 'fake', filename: 'fake', loaded: true,
  exports: {
    getStore: (opts) => {
      opened.push(opts);
      return {
        get: async (key) => (memory.has(key) ? structuredClone(memory.get(key)) : null),
        setJSON: async (key, value) => { memory.set(key, structuredClone(value)); },
      };
    },
  },
};
const { blobStore } = require('../lib/store');

test('new user gets empty data; saved data round-trips per user', async () => {
  delete process.env.NETLIFY_SITE_ID;
  delete process.env.NETLIFY_AUTH_TOKEN;
  const store = blobStore();
  assert.deepStrictEqual(await store.load(1), { cards: [], nextId: 1, lastReminderSlot: null });
  await store.save(1, { cards: [{ id: 1 }], nextId: 2, lastReminderSlot: 'x' });
  assert.strictEqual((await store.load(1)).nextId, 2);
  assert.strictEqual((await store.load(2)).nextId, 1);
});

test('on Netlify the store is opened with strong consistency', async () => {
  opened.length = 0;
  await blobStore().load(1);
  assert.deepStrictEqual(opened[0], { name: 'cards', consistency: 'strong' });
});

test('scripts outside Netlify pass site id and token', async () => {
  process.env.NETLIFY_SITE_ID = 'site';
  process.env.NETLIFY_AUTH_TOKEN = 'tok';
  opened.length = 0;
  await blobStore().load(1);
  assert.deepStrictEqual(opened[0], { name: 'cards', siteID: 'site', token: 'tok' });
  delete process.env.NETLIFY_SITE_ID;
  delete process.env.NETLIFY_AUTH_TOKEN;
});
