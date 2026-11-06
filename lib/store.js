const { emptyData } = require('./words');

// One JSON blob per Telegram user in Netlify Blobs.
// shortcut: read-modify-write without locking, fine for one user; add etag checks if several people share the bot.
function blobStore() {
  let store;
  const open = () => {
    if (!store) {
      const { getStore } = require('@netlify/blobs');
      // On Netlify credentials are automatic; scripts run elsewhere pass NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN.
      const { NETLIFY_SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;
      store = siteID && token
        ? getStore({ name: 'cards', siteID, token })
        // Strong consistency: with the default (eventual) mode a read right after a write returns stale data,
        // which made /review right after an import find no cards.
        : getStore({ name: 'cards', consistency: 'strong' });
    }
    return store;
  };
  return {
    async load(userId) {
      return (await open().get(String(userId), { type: 'json' })) || emptyData();
    },
    async save(userId, data) {
      await open().setJSON(String(userId), data);
    },
  };
}

module.exports = { blobStore };
